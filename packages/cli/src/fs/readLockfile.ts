import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LockfileError } from "@prune-overrides/core";

export interface LockfilePackage {
  version: string;
  resolved?: string;
  integrity?: string;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface Lockfile {
  name?: string;
  version?: string;
  lockfileVersion: number;
  packages: Record<string, LockfilePackage>;
}

/**
 * Read and parse package-lock.json from a directory
 */
export async function readLockfile(dir: string): Promise<Lockfile> {
  const lockfilePath = join(dir, "package-lock.json");

  try {
    const content = await readFile(lockfilePath, "utf-8");
    const parsed = JSON.parse(content) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("packages" in parsed) ||
      typeof (parsed as { packages: unknown }).packages !== "object"
    ) {
      throw new LockfileError("Invalid lockfile format: missing 'packages' field");
    }

    return parsed as Lockfile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new LockfileError(
        `package-lock.json not found at ${lockfilePath}. Run 'npm install' first.`
      );
    }
    if (error instanceof SyntaxError) {
      throw new LockfileError(`Invalid JSON in package-lock.json at ${lockfilePath}`);
    }
    if (error instanceof LockfileError) {
      throw error;
    }
    throw new LockfileError(
      `Failed to read package-lock.json: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get the resolved version of a package from the lockfile
 */
export function getResolvedVersion(lockfile: Lockfile, packageName: string): string | null {
  // Check root-level package first
  const rootKey = `node_modules/${packageName}`;
  const rootPackage = lockfile.packages[rootKey];
  if (rootPackage?.version) {
    return rootPackage.version;
  }

  // Search for nested installations
  for (const [key, pkg] of Object.entries(lockfile.packages)) {
    if (key.endsWith(`/node_modules/${packageName}`) || key === `node_modules/${packageName}`) {
      if (pkg.version) {
        return pkg.version;
      }
    }
  }

  return null;
}

/**
 * Get all resolved versions of a package (including nested)
 */
export function getAllResolvedVersions(lockfile: Lockfile, packageName: string): string[] {
  const versions = new Set<string>();

  for (const [key, pkg] of Object.entries(lockfile.packages)) {
    // Match patterns:
    // - "node_modules/package-name"
    // - "node_modules/@scope/package-name"
    // - "node_modules/foo/node_modules/package-name"
    // - "node_modules/foo/node_modules/@scope/package-name"
    const isMatch =
      key === `node_modules/${packageName}` || key.endsWith(`/node_modules/${packageName}`);

    if (isMatch && pkg.version) {
      versions.add(pkg.version);
    }
  }

  return [...versions];
}
