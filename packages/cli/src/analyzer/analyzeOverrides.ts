import type { AnalysisReport, AnalyzerOptions, OverrideAnalysisResult } from "./types.js";
import { analyzeSingleOverride } from "./analyzeSingle.js";
import { readPackageJson, getOverrideKeys } from "../fs/readPackageJson.js";
import { logger } from "../util/logger.js";
import { createSpinner } from "../util/spinner.js";

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
  let overrideKeys = getOverrideKeys(packageJson);

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

  // Apply filters
  if (include && include.length > 0) {
    overrideKeys = overrideKeys.filter((key) => include.includes(key));
  }

  if (exclude && exclude.length > 0) {
    overrideKeys = overrideKeys.filter((key) => !exclude.includes(key));
  }

  logger.info(`Found ${String(overrideKeys.length)} override(s) to analyze`);
  logger.newline();

  // Analyze each override
  const results: OverrideAnalysisResult[] = [];

  for (const overrideKey of overrideKeys) {
    const overrideValue = packageJson.overrides?.[overrideKey];

    // Skip complex nested overrides for now
    if (typeof overrideValue !== "string") {
      logger.warn(`Skipping complex override: ${overrideKey} (nested overrides not yet supported)`);
      continue;
    }

    const spinner = createSpinner(`Analyzing: ${overrideKey}`, { silent: logger.isSilent() });
    spinner.start();

    const result = await analyzeSingleOverride({
      cwd,
      overrideKey,
      overrideValue,
    });

    results.push(result);

    spinner.success(`${overrideKey}: ${result.verdict.toUpperCase()} - ${result.reason}`);
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
