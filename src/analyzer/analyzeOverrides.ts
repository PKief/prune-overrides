import type { AnalysisReport, AnalyzerOptions } from "./types.js";
import { getOverrideDisplayName } from "./types.js";
import { analyzeSingleOverride } from "./analyzeSingle.js";
import { readPackageJson, getOverrideKeys } from "../fs/readPackageJson.js";
import type { OverrideValue } from "../fs/readPackageJson.js";
import { readLockfile } from "../fs/readLockfile.js";
import { logger } from "../util/logger.js";
import { createSpinner } from "../util/spinner.js";
import { processInPool } from "../util/processInPool.js";
import { DEFAULT_CONCURRENCY } from "../config/constants.js";

export interface OverrideLeaf {
  key: string;
  value: string;
  /** Parent chain (empty for top-level overrides) */
  path: string[];
}

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

export async function analyzeOverrides(options: AnalyzerOptions): Promise<AnalysisReport> {
  const { cwd, include, exclude, verbose } = options;
  const startTime = Date.now();

  logger.configure({ verbose });
  logger.info("Analyzing npm overrides...");
  logger.newline();

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

  let leaves = flattenOverrides(packageJson.overrides ?? {});

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

  // Read lockfile once — shared across all parallel workers
  const baselineLockfile = await readLockfile(cwd);

  let completed = 0;
  const spinner = createSpinner(`Analyzing overrides (0/${String(leaves.length)})`);
  spinner.start();

  const results = await processInPool(leaves, concurrency, async (leaf) => {
    const result = await analyzeSingleOverride({
      cwd,
      overrideKey: leaf.key,
      overrideValue: leaf.value,
      overridePath: leaf.path.length > 0 ? leaf.path : undefined,
      baselineLockfile,
      packageJson,
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
