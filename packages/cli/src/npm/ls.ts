import { execSafe } from "../util/exec.js";
import { logger } from "../util/logger.js";

export interface NpmLsDependency {
  version?: string;
  resolved?: string;
  overridden?: boolean;
  dependencies?: Record<string, NpmLsDependency>;
}

export interface NpmLsResult {
  version?: string;
  name?: string;
  dependencies?: Record<string, NpmLsDependency>;
}

export interface LsOptions {
  /** Working directory */
  cwd: string;
  /** Package name to query */
  packageName: string;
  /** Include all nested instances */
  all?: boolean;
}

/**
 * Run npm ls for a specific package and return JSON result
 */
export async function npmLs(options: LsOptions): Promise<NpmLsResult | null> {
  const { cwd, packageName, all = false } = options;

  const args = ["ls", packageName, "--json"];
  if (all) {
    args.push("--all");
  }

  const command = `npm ${args.join(" ")}`;
  logger.debug(`Running: ${command} in ${cwd}`);

  const result = await execSafe(command, { cwd });

  // npm ls returns non-zero exit code even when package is found but has issues
  // We should try to parse the JSON regardless
  if (!result.stdout) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout) as NpmLsResult;
    return parsed;
  } catch {
    logger.debug(`Failed to parse npm ls output: ${result.stdout}`);
    return null;
  }
}

/**
 * Get the version(s) of a package from npm ls output
 */
export function extractVersionsFromLs(lsResult: NpmLsResult, packageName: string): string[] {
  const versions = new Set<string>();

  function traverse(deps: Record<string, NpmLsDependency> | undefined): void {
    if (!deps) return;

    for (const [name, dep] of Object.entries(deps)) {
      if (name === packageName && dep.version) {
        versions.add(dep.version);
      }
      traverse(dep.dependencies);
    }
  }

  traverse(lsResult.dependencies);
  return [...versions];
}
