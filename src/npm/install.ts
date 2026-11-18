import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
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
    "--prefer-online",
    "--prefer-offline=false",
    "--offline=false",
  ];
  if (packageLockOnly) args.push("--package-lock-only");
  if (ignoreScripts) args.push("--ignore-scripts");
  logger.debug(`Running: npm ${args.join(" ")} in ${cwd}`);
  let result = await execFileSafe("npm", args, { cwd, timeout, signal });
  if (!result.success && /\bETARGET\b/.test(result.stderr) && !signal?.aborted) {
    // npm may reuse stale packuments even with --prefer-online. Retry the
    // entire resolution once, so multiple stale packages cannot fail in turn.
    // Never clear or modify the user's shared cache to recover from this.
    const cache = await mkdtemp(join(tmpdir(), "prune-overrides-npm-cache-"));
    try {
      logger.debug("npm returned ETARGET; retrying with an isolated cache");
      if (freshResolution) await rm(join(cwd, "package-lock.json"), { force: true });
      result = await execFileSafe("npm", [...args, `--cache=${cache}`], {
        cwd,
        timeout,
        signal,
      });
    } finally {
      await rm(cache, { recursive: true, force: true });
    }
  }
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
