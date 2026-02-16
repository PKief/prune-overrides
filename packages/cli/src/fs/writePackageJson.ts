import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PackageJson } from "./readPackageJson.js";
import { PackageJsonError } from "../util/errors.js";

/**
 * Write package.json to a directory, preserving formatting if possible
 */
export async function writePackageJson(dir: string, packageJson: PackageJson): Promise<void> {
  const packageJsonPath = join(dir, "package.json");

  try {
    // Try to detect existing indentation
    let indent = 2;
    try {
      const existing = await readFile(packageJsonPath, "utf-8");
      // Simple heuristic: check first indented line
      const regex = /\n(\s+)"/;
      const match = regex.exec(existing);
      if (match?.[1]) {
        indent = match[1].length;
      }
    } catch {
      // File doesn't exist yet, use default indent
    }

    const content = JSON.stringify(packageJson, null, indent) + "\n";
    await writeFile(packageJsonPath, content, "utf-8");
  } catch (error) {
    throw new PackageJsonError(
      `Failed to write package.json: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Remove a specific override from package.json
 */
export function removeOverride(packageJson: PackageJson, overrideKey: string): PackageJson {
  if (!packageJson.overrides) {
    return packageJson;
  }

  const { [overrideKey]: _, ...remainingOverrides } = packageJson.overrides;

  // If no overrides left, remove the overrides key entirely
  if (Object.keys(remainingOverrides).length === 0) {
    const { overrides: __, ...rest } = packageJson;
    return rest;
  }

  return {
    ...packageJson,
    overrides: remainingOverrides,
  };
}
