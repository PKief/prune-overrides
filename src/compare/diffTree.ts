import type { Lockfile } from "../fs/readLockfile.js";

export interface DiffEntry {
  packagePath: string;
  packageName: string;
  beforeVersion: string | null;
  afterVersion: string | null;
  change: "added" | "removed" | "changed" | "unchanged";
}

/**
 * Compare two lockfiles and return the differences
 */
export function diffLockfiles(before: Lockfile, after: Lockfile): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const allPaths = new Set([...Object.keys(before.packages), ...Object.keys(after.packages)]);

  for (const packagePath of allPaths) {
    // Skip root package
    if (packagePath === "") continue;

    const beforePkg = before.packages[packagePath];
    const afterPkg = after.packages[packagePath];

    const beforeVersion = beforePkg?.version ?? null;
    const afterVersion = afterPkg?.version ?? null;

    // Extract package name from path
    const packageName = extractPackageName(packagePath);

    if (beforeVersion === null && afterVersion !== null) {
      diffs.push({
        packagePath,
        packageName,
        beforeVersion,
        afterVersion,
        change: "added",
      });
    } else if (beforeVersion !== null && afterVersion === null) {
      diffs.push({
        packagePath,
        packageName,
        beforeVersion,
        afterVersion,
        change: "removed",
      });
    } else if (beforeVersion !== afterVersion) {
      diffs.push({
        packagePath,
        packageName,
        beforeVersion,
        afterVersion,
        change: "changed",
      });
    }
    // Skip unchanged packages
  }

  return diffs;
}

/**
 * Extract package name from lockfile path
 * e.g., "node_modules/foo" -> "foo"
 * e.g., "node_modules/@scope/bar" -> "@scope/bar"
 */
function extractPackageName(packagePath: string): string {
  const regex = /node_modules\/(.+)$/;
  const match = regex.exec(packagePath);
  if (!match?.[1]) {
    return packagePath;
  }

  const fullPath = match[1];
  // Handle nested packages - get the last package name
  const parts = fullPath.split("/node_modules/");
  const lastPart = parts[parts.length - 1];

  // Handle scoped packages
  if (lastPart?.startsWith("@")) {
    const scopedRegex = /^(@[^/]+\/[^/]+)/;
    const scopedMatch = scopedRegex.exec(lastPart);
    return scopedMatch?.[1] ?? lastPart;
  }

  // Regular package
  const regularRegex = /^([^/]+)/;
  const regularMatch = regularRegex.exec(lastPart ?? "");
  return regularMatch?.[1] ?? lastPart ?? "";
}

/**
 * Filter diffs to only include a specific package
 */
export function filterDiffsByPackage(diffs: DiffEntry[], packageName: string): DiffEntry[] {
  return diffs.filter((diff) => diff.packageName === packageName);
}

/**
 * Check if any diffs exist for a package
 */
export function hasChangesForPackage(diffs: DiffEntry[], packageName: string): boolean {
  return diffs.some((diff) => diff.packageName === packageName);
}
