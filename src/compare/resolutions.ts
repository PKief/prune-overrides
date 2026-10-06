import semver from "semver";
import type { Lockfile, LockfilePackage } from "../fs/readLockfile.js";

export type SafetyPolicy = "exact" | "no-downgrade" | "full-tree";

export interface Resolution {
  path: string;
  name: string;
  version: string;
  resolved?: string;
  integrity?: string;
}

export interface SafetyResult {
  safe: boolean;
  reason: string;
}

export function packageNameFromPath(path: string): string | null {
  const marker = "node_modules/";
  const index = path.lastIndexOf(marker);
  if (index < 0) return null;
  const tail = path.slice(index + marker.length);
  if (tail.startsWith("@")) return tail.split("/").slice(0, 2).join("/") || null;
  return tail.split("/")[0] ?? null;
}

export function indexResolutions(lockfile: Lockfile): Map<string, Resolution[]> {
  const index = new Map<string, Resolution[]>();
  for (const [path, pkg] of Object.entries(lockfile.packages)) {
    const name = packageNameFromPath(path);
    if (!name || !pkg.version) continue;
    const resolution = toResolution(path, name, pkg);
    const entries = index.get(name) ?? [];
    entries.push(resolution);
    index.set(name, entries);
  }
  for (const entries of index.values()) entries.sort((a, b) => a.path.localeCompare(b.path));
  return index;
}

function toResolution(path: string, name: string, pkg: LockfilePackage): Resolution {
  return {
    path,
    name,
    version: pkg.version,
    ...(pkg.resolved ? { resolved: pkg.resolved } : {}),
    ...(pkg.integrity ? { integrity: pkg.integrity } : {}),
  };
}

function identity(value: Resolution): string {
  return `${value.version}\0${value.resolved ?? ""}\0${value.integrity ?? ""}`;
}

function multiset(values: Resolution[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const value of values) result.set(identity(value), (result.get(identity(value)) ?? 0) + 1);
  return result;
}

function equalResolutions(before: Resolution[], after: Resolution[]): boolean {
  const left = multiset(before);
  const right = multiset(after);
  return left.size === right.size && [...left].every(([key, count]) => right.get(key) === count);
}

export function comparePackageResolutions(
  before: Resolution[],
  after: Resolution[],
  policy: SafetyPolicy
): SafetyResult {
  if (before.length === 0 && after.length === 0) return { safe: true, reason: "Package is absent" };
  if (before.length !== after.length) {
    return {
      safe: false,
      reason: `Package instance count changes (${String(before.length)} → ${String(after.length)})`,
    };
  }
  if (policy === "exact" || policy === "full-tree") {
    return equalResolutions(before, after)
      ? { safe: true, reason: "Same versions and sources resolve" }
      : { safe: false, reason: "Package versions or sources change" };
  }

  const baseline = before.map((entry) => semver.valid(entry.version, { loose: true }));
  const candidate = after.map((entry) => semver.valid(entry.version, { loose: true }));
  if (baseline.some((entry) => !entry) || candidate.some((entry) => !entry)) {
    return equalResolutions(before, after)
      ? { safe: true, reason: "Same non-semver resolutions" }
      : { safe: false, reason: "Non-semver resolutions cannot be ordered safely" };
  }
  const minimum = semver.minSatisfying(baseline as string[], ">=0.0.0-0", {
    loose: true,
    includePrerelease: true,
  });
  if (!minimum) return { safe: false, reason: "Versions cannot be compared safely" };
  const older = after.filter((entry) => semver.lt(entry.version, minimum, { loose: true }));
  return older.length === 0
    ? { safe: true, reason: "No older versions are introduced" }
    : {
        safe: false,
        reason: `Older versions introduced: ${older.map((entry) => entry.version).join(", ")}`,
      };
}

export function compareLockfiles(
  before: Lockfile,
  after: Lockfile,
  packageName: string,
  policy: SafetyPolicy
): SafetyResult {
  const beforeIndex = indexResolutions(before);
  const afterIndex = indexResolutions(after);
  if (policy !== "full-tree") {
    return comparePackageResolutions(
      beforeIndex.get(packageName) ?? [],
      afterIndex.get(packageName) ?? [],
      policy
    );
  }
  const names = new Set([...beforeIndex.keys(), ...afterIndex.keys()]);
  for (const name of names) {
    const result = comparePackageResolutions(
      beforeIndex.get(name) ?? [],
      afterIndex.get(name) ?? [],
      "exact"
    );
    if (!result.safe) return { safe: false, reason: `${name}: ${result.reason}` };
  }
  return { safe: true, reason: "Entire dependency tree is unchanged" };
}
