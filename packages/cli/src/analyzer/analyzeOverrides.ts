import type { AnalysisReport, AnalyzerOptions } from "./types.js";
import { getOverrideDisplayName } from "./types.js";
import { analyzeSingleOverride } from "./analyzeSingle.js";
import { readPackageJson, getOverrideKeys } from "../fs/readPackageJson.js";
import type { OverrideValue } from "../fs/readPackageJson.js";
import { logger } from "../util/logger.js";
import { createSpinner } from "../util/spinner.js";
import { processInPool } from "../util/processInPool.js";
import { DEFAULT_CONCURRENCY } from "../config/constants.js";

/**
 * A flattened override leaf with its path and value
 */
export interface OverrideLeaf {
  /** The leaf package name */
  key: string;
  /** The version string value */
  value: string;
  /** Parent chain (empty for top-level overrides) */
  path: string[];
}

/**
 * Recursively flatten an overrides object into individual leaves
 */
export function flattenOverrides(
  overrides: Record<string, OverrideValue>,
  parentPath: string[] = []
): OverrideLeaf[] {
  const leaves: OverrideLeaf[] = [];

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === "string") {
      leaves.push({ key, value, path: parentPath });
    } else {
      leaves.push(...flattenOverrides(value, [...parentPath, key]));
    }
  }

  return leaves;
}

/**
 * Analyze all overrides in a project
 */
export async function analyzeOverrides(options: AnalyzerOptions): Promise<AnalysisReport> {
  const { cwd, include, exclude, verbose } = options;
  const startTime = Date.now();

  logger.configure({ verbose });
  logger.info("Analyzing npm overrides...");
  logger.newline();

  // Read package.json
  const packageJson = await readPackageJson(cwd);
  const overrideKeys = getOverrideKeys(packageJson);

  if (overrideKeys.length === 0) {
    logger.info("No overrides found in package.json");
    return {
      total: 0,
      redundant: 0,
      required: 0,
      results: [],
      duration: Date.now() - startTime,
    };
  }

  // Flatten all overrides (including nested) into individual leaves
  let leaves = flattenOverrides(packageJson.overrides ?? {});

  // Apply filters (match against the leaf key)
  if (include && include.length > 0) {
    leaves = leaves.filter((leaf) => include.includes(leaf.key));
  }

  if (exclude && exclude.length > 0) {
    leaves = leaves.filter((leaf) => !exclude.includes(leaf.key));
  }

  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

  logger.info(
    `Found ${String(leaves.length)} override(s) to analyze (concurrency: ${String(concurrency)})`
  );
  logger.newline();

  // Analyze overrides concurrently
  let completed = 0;
  const spinner = createSpinner(`Analyzing overrides (0/${String(leaves.length)})`, {
    silent: logger.isSilent(),
  });
  spinner.start();

  const results = await processInPool(leaves, concurrency, async (leaf) => {
    const result = await analyzeSingleOverride({
      cwd,
      overrideKey: leaf.key,
      overrideValue: leaf.value,
      overridePath: leaf.path.length > 0 ? leaf.path : undefined,
    });

    completed++;
    spinner.update(`Analyzing overrides (${String(completed)}/${String(leaves.length)})`);

    return result;
  });

  spinner.stop();

  for (const result of results) {
    logger.info(
      `${getOverrideDisplayName(result)}: ${result.verdict.toUpperCase()} - ${result.reason}`
    );
  }

  const redundantCount = results.filter((r) => r.verdict === "redundant").length;
  const requiredCount = results.filter((r) => r.verdict === "required").length;

  return {
    total: results.length,
    redundant: redundantCount,
    required: requiredCount,
    results,
    duration: Date.now() - startTime,
  };
}
