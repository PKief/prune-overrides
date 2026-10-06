import { availableParallelism } from "node:os";
import type { AnalysisReport, AnalyzerOptions, OverrideAnalysisResult } from "./types.js";
import { getOverrideDisplayName } from "./types.js";
import { analyzeSingleOverride } from "./analyzeSingle.js";
import { flattenOverrideRules, getRuleId } from "./overrideRule.js";
import type { OverrideRule } from "./overrideRule.js";
import { selectSafeRemovalSet, validateRemovalSet } from "./validateRemoval.js";
import { validateBaseline } from "./validateBaseline.js";
import { AnalysisCache, createCacheKey } from "./cache.js";
import { readPackageJson } from "../fs/readPackageJson.js";
import type { PackageJson } from "../fs/readPackageJson.js";
import { readLockfile } from "../fs/readLockfile.js";
import { logger } from "../util/logger.js";
import { createSpinner } from "../util/spinner.js";
import { processInPool } from "../util/processInPool.js";
import { DEFAULT_CONCURRENCY } from "../config/constants.js";
import { getNpmVersion } from "../npm/install.js";
import { createResolver } from "../resolver/index.js";
import { analyzeWithResolver } from "./analyzeWithResolver.js";

/** @deprecated Use flattenOverrideRules; retained for API compatibility. */
export function flattenOverrides(
  overrides: NonNullable<PackageJson["overrides"]>,
  parentPath: string[] = []
): { key: string; value: string; path: string[] }[] {
  return flattenOverrideRules(overrides, parentPath).map(({ key, value, path }) => ({
    key,
    value,
    path,
  }));
}

function hasRelativeDependency(packageJson: PackageJson): boolean {
  const groups = [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.optionalDependencies,
  ];
  return groups.some((group) =>
    Object.values(group ?? {}).some((value) => /^(?:file:|link:|workspace:|\.\.?\/)/.test(value))
  );
}

function unknownResult(rule: OverrideRule, reason: string): OverrideAnalysisResult {
  return {
    name: rule.key,
    packageName: rule.packageName,
    ...(rule.path.length ? { overridePath: rule.path } : {}),
    overrideValue: rule.value,
    before: null,
    after: null,
    verdict: "unknown",
    reason,
  };
}

export async function analyzeOverrides(options: AnalyzerOptions): Promise<AnalysisReport> {
  const startTime = Date.now();
  const policy = options.policy ?? "exact";
  logger.configure({ verbose: options.verbose });
  logger.info("Analyzing npm overrides...");
  logger.newline();

  const packageJson = await readPackageJson(options.cwd);
  let rules = flattenOverrideRules(packageJson.overrides ?? {});
  const include = options.include;
  const exclude = options.exclude;
  if (include?.length)
    rules = rules.filter(
      (rule) => include.includes(rule.packageName) || include.includes(getRuleId(rule))
    );
  if (exclude?.length)
    rules = rules.filter(
      (rule) => !exclude.includes(rule.packageName) && !exclude.includes(getRuleId(rule))
    );

  const platform = `${process.platform}-${process.arch}`;
  if (rules.length === 0)
    return {
      total: 0,
      redundant: 0,
      required: 0,
      unknown: 0,
      results: [],
      duration: Date.now() - startTime,
      platform,
    };

  const resolverName = options.resolver ?? "arborist";
  const concurrency = Math.max(
    1,
    Math.min(options.concurrency ?? DEFAULT_CONCURRENCY, availableParallelism(), rules.length)
  );

  if (resolverName === "arborist") {
    const resolver = await createResolver(resolverName);
    logger.info(
      `Found ${String(rules.length)} override(s) to analyze (resolver: ${resolver.name}, policy: ${policy}, concurrency: ${String(concurrency)})`
    );
    const results = await analyzeWithResolver(
      resolver,
      options.cwd,
      packageJson,
      rules,
      policy,
      concurrency
    );
    return report(results, startTime, platform, resolver.version, resolver.name);
  }

  const baselineLockfile = await readLockfile(options.cwd);
  let npmVersion: string | undefined;
  try {
    npmVersion = await getNpmVersion();
  } catch {
    /* install reports a useful unknown result */
  }

  if (hasRelativeDependency(packageJson)) {
    const results = rules.map((rule) =>
      unknownResult(
        rule,
        "Relative file/link/workspace dependencies are not safely reproducible in isolation"
      )
    );
    return report(results, startTime, platform, npmVersion);
  }

  const baselineValidation = await validateBaseline(options.cwd, packageJson, baselineLockfile);
  if (!baselineValidation.valid) {
    return report(
      rules.map((rule) => unknownResult(rule, baselineValidation.reason)),
      startTime,
      platform,
      npmVersion
    );
  }

  logger.info(
    `Found ${String(rules.length)} override(s) to analyze (policy: ${policy}, concurrency: ${String(concurrency)})`
  );

  // Fast path: one npm resolution proves that the whole selected set is safe.
  const batch = await validateRemovalSet(options.cwd, packageJson, baselineLockfile, rules, policy);
  if (batch.safe) {
    const results = rules.map((rule) => ({
      ...unknownResult(rule, batch.reason),
      verdict: "redundant" as const,
    }));
    return report(results, startTime, platform, npmVersion);
  }

  const cache = new AnalysisCache(options.cwd);
  if (options.cache !== false) await cache.load();
  const spinner = createSpinner(`Analyzing overrides (0/${String(rules.length)})`);
  spinner.start();
  let completed = 0;
  const results = await processInPool(rules, concurrency, async (rule) => {
    const key = createCacheKey([packageJson, baselineLockfile, rule, policy, npmVersion, platform]);
    const cached = options.cache === false ? undefined : cache.get(key);
    const result = cached
      ? { ...cached, cached: true }
      : await analyzeSingleOverride({
          cwd: options.cwd,
          overrideKey: rule.key,
          overrideValue: rule.value,
          overridePath: rule.path,
          packageName: rule.packageName,
          baselineLockfile,
          packageJson,
          policy,
        });
    if (!cached) cache.set(key, result);
    spinner.update(`Analyzing overrides (${String(++completed)}/${String(rules.length)})`);
    return result;
  });
  spinner.stop();
  if (options.cache !== false) await cache.save();

  const redundantRules = rules.filter((_, index) => results[index]?.verdict === "redundant");
  const selected = await selectSafeRemovalSet(
    options.cwd,
    packageJson,
    baselineLockfile,
    redundantRules,
    policy
  );
  const rejected = new Set(selected.rejected.map(getRuleId));
  for (const result of results) {
    if (result.verdict === "redundant" && rejected.has(getOverrideDisplayName(result))) {
      result.verdict = "required";
      result.reason = "Unsafe when removed together with other candidates";
    }
    logger.info(
      `${getOverrideDisplayName(result)}: ${result.verdict.toUpperCase()} - ${result.reason}`
    );
  }
  return report(results, startTime, platform, npmVersion);
}

function report(
  results: OverrideAnalysisResult[],
  start: number,
  platform: string,
  npmVersion?: string,
  resolver = "npm"
): AnalysisReport {
  return {
    total: results.length,
    redundant: results.filter((result) => result.verdict === "redundant").length,
    required: results.filter((result) => result.verdict === "required").length,
    unknown: results.filter((result) => result.verdict === "unknown").length,
    results,
    duration: Date.now() - start,
    platform,
    resolver,
    ...(npmVersion ? { npmVersion, resolverVersion: npmVersion } : {}),
  };
}
