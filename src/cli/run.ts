import type { CliOptions } from "./options.js";
import { analyzeOverrides } from "../analyzer/analyzeOverrides.js";
import type { OverrideAnalysisResult } from "../analyzer/types.js";
import { getOverrideDisplayName } from "../analyzer/types.js";
import { reportToConsole } from "../report/consoleReporter.js";
import { readPackageJson } from "../fs/readPackageJson.js";
import { readLockfile } from "../fs/readLockfile.js";
import { validateRemovalSet } from "../analyzer/validateRemoval.js";
import { createResolver } from "../resolver/index.js";
import { compareGraphs } from "../compare/graphs.js";
import { PruneOverridesError as ValidationError } from "../util/errors.js";
import { writePackageJson, removeOverride } from "../fs/writePackageJson.js";
import { npmInstall } from "../npm/install.js";
import { logger } from "../util/logger.js";
import { createSpinner } from "../util/spinner.js";
import { ExitCode } from "../config/constants.js";
import { PruneOverridesError } from "../util/errors.js";

export async function run(options: CliOptions): Promise<number> {
  logger.configure({ verbose: options.verbose });

  try {
    const report = await analyzeOverrides({
      cwd: options.cwd,
      include: options.include.length > 0 ? options.include : undefined,
      exclude: options.exclude.length > 0 ? options.exclude : undefined,
      verbose: options.verbose,
      concurrency: options.concurrency,
      policy: options.policy,
      cache: options.cache,
      resolver: options.resolver,
    });

    reportToConsole(report);

    if (options.fix && report.redundant > 0) {
      await applyFixes(options.cwd, report.results, options.policy, options.resolver);
    }

    if (report.redundant > 0 && !options.fix) {
      return ExitCode.REDUNDANT_FOUND;
    }

    return ExitCode.SUCCESS;
  } catch (error) {
    if (error instanceof PruneOverridesError) {
      logger.error(error.message);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Unexpected error: ${message}`);
    }

    return ExitCode.ERROR;
  }
}

async function applyFixes(
  cwd: string,
  results: OverrideAnalysisResult[],
  policy: CliOptions["policy"],
  resolverName: CliOptions["resolver"]
): Promise<void> {
  const redundantOverrides = results.filter((r) => r.verdict === "redundant");

  if (redundantOverrides.length === 0) {
    return;
  }

  logger.newline();
  logger.info("Validating fixes...");

  let packageJson = await readPackageJson(cwd);
  const baseline = await readLockfile(cwd);
  const rules = redundantOverrides.map((result) => ({
    key: result.name,
    packageName: result.packageName ?? result.name,
    value: result.overrideValue,
    path: result.overridePath ?? [],
  }));
  if (resolverName === "arborist") {
    const resolver = await createResolver(resolverName);
    const baselineOutcome = await resolver.loadBaseline({ cwd });
    let modified = packageJson;
    for (const rule of rules) modified = removeOverride(modified, rule.key, rule.path);
    const candidate = await resolver.resolve(modified, { cwd });
    const valid =
      baselineOutcome.status === "resolved" &&
      baselineOutcome.graph &&
      candidate.status === "resolved" &&
      candidate.graph &&
      compareGraphs(
        baselineOutcome.graph,
        candidate.graph,
        rules.map((rule) => rule.packageName),
        policy
      ).safe;
    if (!valid) {
      throw new ValidationError(
        "Refusing to apply fixes because Arborist could not validate the combined removal",
        "VALIDATION_ERROR"
      );
    }
  } else {
    const validation = await validateRemovalSet(cwd, packageJson, baseline, rules, policy);
    if (!validation.safe) {
      throw new ValidationError(
        `Refusing to apply unvalidated fixes: ${validation.reason}`,
        "VALIDATION_ERROR"
      );
    }
  }

  logger.info("Applying fixes...");

  for (const override of redundantOverrides) {
    packageJson = removeOverride(packageJson, override.name, override.overridePath);
    logger.success(`Removed override: ${getOverrideDisplayName(override)}`);
  }

  await writePackageJson(cwd, packageJson);

  const spinner = createSpinner("Regenerating package-lock.json...");
  spinner.start();
  await npmInstall({
    cwd,
    packageLockOnly: true,
    ignoreScripts: true,
  });
  spinner.success("Lockfile regenerated");

  logger.newline();
  logger.success(`Removed ${String(redundantOverrides.length)} redundant override(s)`);
}
