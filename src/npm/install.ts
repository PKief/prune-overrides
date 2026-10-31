import { rm } from "node:fs/promises";
import { join } from "node:path";
import { execFile, execFileSafe } from "../util/exec.js";
import { NpmError } from "../util/errors.js";
import { DEFAULT_NPM_TIMEOUT } from "../config/constants.js";
import { logger } from "../util/logger.js";

export interface InstallOptions {
  cwd: string;
  packageLockOnly?: boolean;
  ignoreScripts?: boolean;
  timeout?: number;
  signal?: AbortSignal;
  /** Resolve without the existing lockfile. Only use in disposable workspaces. */
  freshResolution?: boolean;
}

export async function npmInstall(options: InstallOptions): Promise<void> {
  const {
    cwd,
    packageLockOnly = true,
    ignoreScripts = true,
    timeout = DEFAULT_NPM_TIMEOUT,
    signal,
    freshResolution = false,
  } = options;
  // npm can retain overridden versions even after their override is removed.
  // A clean resolution must prove that the remaining manifest allows them.
  if (freshResolution) await rm(join(cwd, "package-lock.json"), { force: true });
  const args: string[] = [
    "install",
    "--no-audit",
    "--no-fund",
    "--prefer-offline",
  ];
  if (packageLockOnly) args.push("--package-lock-only");
  if (ignoreScripts) args.push("--ignore-scripts");
  logger.debug(`Running: npm ${args.join(" ")} in ${cwd}`);
  const result = await execFileSafe("npm", args, { cwd, timeout, signal });
  if (!result.success)
    throw new NpmError(
      `npm install failed: ${result.stderr}`,
      `npm ${args.join(" ")}`,
      result.stderr,
    );
}

export async function checkNpmAvailable(): Promise<boolean> {
  try {
    await execFile("npm", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function getNpmVersion(): Promise<string> {
  return (await execFile("npm", ["--version"])).stdout;
}
