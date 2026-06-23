import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PackageJson } from "./readPackageJson.js";
import { PackageJsonError } from "../util/errors.js";

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
 * Supports nested paths: removeOverride(pkg, "child", ["parent"]) removes
 * the "child" entry from inside the "parent" nested override object.
 */
export function removeOverride(
  packageJson: PackageJson,
  overrideKey: string,
  overridePath?: string[]
): PackageJson {
  if (!packageJson.overrides) {
    return packageJson;
  }

  // Simple (top-level) override removal
  if (!overridePath || overridePath.length === 0) {
    const { [overrideKey]: _, ...remainingOverrides } = packageJson.overrides;

    if (Object.keys(remainingOverrides).length === 0) {
      const { overrides: __, ...rest } = packageJson;
      return rest;
    }

    return {
      ...packageJson,
      overrides: remainingOverrides,
    };
  }

  // Nested override removal — walk the path and remove the leaf
  const newOverrides = removeNestedKey(packageJson.overrides, overridePath, overrideKey);

  if (Object.keys(newOverrides).length === 0) {
    const { overrides: __, ...rest } = packageJson;
    return rest;
  }

  return {
    ...packageJson,
    overrides: newOverrides as PackageJson["overrides"],
  };
}

function removeNestedKey(
  obj: Record<string, unknown>,
  path: string[],
  leafKey: string
): Record<string, unknown> {
  if (path.length === 0) {
    return obj;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const head = path[0]!;
  const tail = path.slice(1);
  const current = obj[head];

  if (current === undefined || typeof current !== "object" || current === null) {
    return obj;
  }

  let updated: Record<string, unknown>;
  if (tail.length > 0) {
    // More path segments to traverse
    updated = removeNestedKey(current as Record<string, unknown>, tail, leafKey);
  } else {
    // We're at the parent of the leaf — remove the leaf key
    const { [leafKey]: _, ...rest } = current as Record<string, unknown>;
    updated = rest;
  }

  // If the nested object is now empty, remove the parent key too
  if (Object.keys(updated).length === 0) {
    const { [head]: _, ...rest } = obj;
    return rest;
  }

  return {
    ...obj,
    [head]: updated,
  };
}
