import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PackageJsonError } from "@prune-overrides/core";

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  overrides?: Record<string, string | Record<string, string>>;
  [key: string]: unknown;
}

/**
 * Read and parse package.json from a directory
 */
export async function readPackageJson(dir: string): Promise<PackageJson> {
  const packageJsonPath = join(dir, "package.json");

  try {
    const content = await readFile(packageJsonPath, "utf-8");
    const parsed = JSON.parse(content) as PackageJson;
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new PackageJsonError(`package.json not found at ${packageJsonPath}`);
    }
    if (error instanceof SyntaxError) {
      throw new PackageJsonError(`Invalid JSON in package.json at ${packageJsonPath}`);
    }
    throw new PackageJsonError(
      `Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract top-level override keys from package.json
 */
export function getOverrideKeys(packageJson: PackageJson): string[] {
  if (!packageJson.overrides) {
    return [];
  }
  return Object.keys(packageJson.overrides);
}
