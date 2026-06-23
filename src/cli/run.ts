import type { CliOptions } from "./options.js";
import { analyzeOverrides } from "../analyzer/analyzeOverrides.js";
import type { OverrideAnalysisResult } from "../analyzer/types.js";
import { getOverrideDisplayName } from "../analyzer/types.js";
import { reportToConsole } from "../report/consoleReporter.js";
import { readPackageJson } from "../fs/readPackageJson.js";
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
    });

    reportToConsole(report);

    if (options.fix && report.redundant > 0) {
      await applyFixes(options.cwd, report.results);
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

async function applyFixes(cwd: string, results: OverrideAnalysisResult[]): Promise<void> {
  const redundantOverrides = results.filter((r) => r.verdict === "redundant");

  if (redundantOverrides.length === 0) {
    return;
  }

  logger.newline();
  logger.info("Applying fixes...");

  let packageJson = await readPackageJson(cwd);

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
