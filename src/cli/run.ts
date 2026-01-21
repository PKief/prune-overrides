import type { CliOptions } from "./options.js";
import { analyzeOverrides } from "../analyzer/analyzeOverrides.js";
import { reportToConsole } from "../report/consoleReporter.js";
import { printJsonReport } from "../report/jsonReporter.js";
import { readPackageJson } from "../fs/readPackageJson.js";
import { writePackageJson, removeOverride } from "../fs/writePackageJson.js";
import { npmInstall } from "../npm/install.js";
import { logger } from "../util/logger.js";
import { ExitCode } from "../config/constants.js";
import { PruneOverridesError } from "../util/errors.js";

/**
 * Main CLI execution
 */
export async function run(options: CliOptions): Promise<number> {
  logger.configure({ verbose: options.verbose, silent: options.json });

  try {
    // Run analysis
    const report = await analyzeOverrides({
      cwd: options.cwd,
      include: options.include.length > 0 ? options.include : undefined,
      exclude: options.exclude.length > 0 ? options.exclude : undefined,
      verbose: options.verbose,
    });

    // Output results
    if (options.json) {
      printJsonReport(report);
    } else {
      reportToConsole(report);
    }

    // Handle fix mode
    if (options.fix && report.redundant > 0) {
      await applyFixes(options.cwd, report.results);
    }

    // Return appropriate exit code
    if (report.redundant > 0 && !options.fix) {
      return ExitCode.REDUNDANT_FOUND;
    }

    return ExitCode.SUCCESS;
  } catch (error) {
    if (error instanceof PruneOverridesError) {
      if (options.json) {
        console.log(JSON.stringify({ error: error.message, code: error.code }));
      } else {
        logger.error(error.message);
      }
    } else {
      const message = error instanceof Error ? error.message : String(error);
      if (options.json) {
        console.log(JSON.stringify({ error: message, code: "UNKNOWN_ERROR" }));
      } else {
        logger.error(`Unexpected error: ${message}`);
      }
    }

    return ExitCode.ERROR;
  }
}

/**
 * Apply fixes by removing redundant overrides
 */
async function applyFixes(
  cwd: string,
  results: { name: string; verdict: "redundant" | "required" }[]
): Promise<void> {
  const redundantOverrides = results.filter((r) => r.verdict === "redundant");

  if (redundantOverrides.length === 0) {
    return;
  }

  logger.newline();
  logger.info("Applying fixes...");

  // Read current package.json
  let packageJson = await readPackageJson(cwd);

  // Remove each redundant override
  for (const override of redundantOverrides) {
    packageJson = removeOverride(packageJson, override.name);
    logger.success(`Removed override: ${override.name}`);
  }

  // Write updated package.json
  await writePackageJson(cwd, packageJson);

  // Regenerate lockfile
  logger.info("Regenerating package-lock.json...");
  await npmInstall({
    cwd,
    packageLockOnly: true,
    ignoreScripts: true,
  });

  logger.newline();
  logger.success(`Removed ${String(redundantOverrides.length)} redundant override(s)`);
}
