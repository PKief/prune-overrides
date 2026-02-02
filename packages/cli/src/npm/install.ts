import { exec, execSafe, NpmError, DEFAULT_NPM_TIMEOUT, logger } from "@prune-overrides/core";

export interface InstallOptions {
  /** Working directory */
  cwd: string;
  /** Only update lockfile, don't install packages */
  packageLockOnly?: boolean;
  /** Skip lifecycle scripts */
  ignoreScripts?: boolean;
  /** Custom timeout in milliseconds */
  timeout?: number;
}

/**
 * Run npm install in a directory
 */
export async function npmInstall(options: InstallOptions): Promise<void> {
  const {
    cwd,
    packageLockOnly = true,
    ignoreScripts = true,
    timeout = DEFAULT_NPM_TIMEOUT,
  } = options;

  const args: string[] = ["install"];

  if (packageLockOnly) {
    args.push("--package-lock-only");
  }

  if (ignoreScripts) {
    args.push("--ignore-scripts");
  }

  const command = `npm ${args.join(" ")}`;
  logger.debug(`Running: ${command} in ${cwd}`);

  const result = await execSafe(command, { cwd, timeout });

  if (!result.success) {
    throw new NpmError(`npm install failed: ${result.stderr}`, command, result.stderr);
  }
}

/**
 * Check if npm is available
 */
export async function checkNpmAvailable(): Promise<boolean> {
  try {
    await exec("npm --version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get npm version
 */
export async function getNpmVersion(): Promise<string> {
  const result = await exec("npm --version");
  return result.stdout;
}
