import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { printHelp, printVersion, type CliOptions } from "./options.js";
import { analyzeOverrides } from "../analyzer/analyzeOverrides.js";
import type { OverrideAnalysisResult } from "../analyzer/types.js";
import { getOverrideDisplayName } from "../analyzer/types.js";
import { reportToConsole } from "../report/consoleReporter.js";
import { readPackageJson } from "../fs/readPackageJson.js";
import { readLockfile } from "../fs/readLockfile.js";
import { validateRemovalSet } from "../analyzer/validateRemoval.js";
import { validateBaseline } from "../analyzer/validateBaseline.js";
import { writePackageJson, removeOverride } from "../fs/writePackageJson.js";
import { npmInstall } from "../npm/install.js";
import { logger } from "../util/logger.js";
import { createSpinner } from "../util/spinner.js";
import { ExitCode } from "../config/constants.js";
import { PruneOverridesError } from "../util/errors.js";

export async function run(options: CliOptions): Promise<number> {
  if (options.help) {
    printHelp();
    return ExitCode.SUCCESS;
  }
  if (options.version) {
    printVersion();
    return ExitCode.SUCCESS;
  }

  const cwd = process.cwd();
  try {
    const report = await analyzeOverrides({ cwd, cache: false });

    reportToConsole(report);

    if (options.fix && report.redundant > 0) {
      await applyFixes(cwd, report.results);
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
): Promise<void> {
  const redundantOverrides = results.filter((r) => r.verdict === "redundant");

  if (redundantOverrides.length === 0) {
    return;
  }

  logger.newline();
  logger.info("Validating fixes...");

  let packageJson = await readPackageJson(cwd);
  const checkedInLockfile = await readLockfile(cwd);
  const reproduced = await validateBaseline(
    cwd,
    packageJson,
    checkedInLockfile,
  );
  if (!reproduced.valid || !reproduced.lockfile) {
    throw new PruneOverridesError(
      `Refusing to apply fixes: ${reproduced.reason}`,
      "VALIDATION_ERROR",
    );
  }
  const rules = redundantOverrides.map((result) => ({
    key: result.name,
    packageName: result.packageName ?? result.name,
    value: result.overrideValue,
    path: result.overridePath ?? [],
  }));
  const validation = await validateRemovalSet(
    cwd,
    packageJson,
    reproduced.lockfile,
    rules,
    "no-downgrade",
  );
  if (!validation.safe) {
    throw new PruneOverridesError(
      `Refusing to apply unvalidated fixes: ${validation.reason}`,
      "VALIDATION_ERROR",
    );
  }

  logger.info("Applying fixes...");

  for (const override of redundantOverrides) {
    packageJson = removeOverride(
      packageJson,
      override.name,
      override.overridePath,
    );
    logger.success(`Removed override: ${getOverrideDisplayName(override)}`);
  }

  const packagePath = join(cwd, "package.json");
  const lockPath = join(cwd, "package-lock.json");
  const originalPackage = await readFile(packagePath, "utf8");
  const originalLock = await readFile(lockPath, "utf8");
  const spinner = createSpinner("Regenerating package-lock.json...");
  try {
    await writePackageJson(cwd, packageJson);
    spinner.start();
    await npmInstall({ cwd, packageLockOnly: true, ignoreScripts: true });
    spinner.success("Lockfile regenerated");
  } catch (error) {
    await Promise.all([
      writeFile(packagePath, originalPackage, "utf8"),
      writeFile(lockPath, originalLock, "utf8"),
    ]);
    spinner.error("Changes rolled back");
    throw error;
  }

  logger.newline();
  logger.success(
    `Removed ${String(redundantOverrides.length)} redundant override(s)`,
  );
}
