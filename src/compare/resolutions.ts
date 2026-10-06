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
    const resolution = toResolution(path, pkg);
    if (!resolution) continue;
    const values = index.get(resolution.name) ?? [];
    values.push(resolution);
    index.set(resolution.name, values);
  }
  for (const values of index.values())
    values.sort((a, b) => identity(a).localeCompare(identity(b)));
  return index;
}

function toResolution(path: string, pkg: LockfilePackage): Resolution | null {
  const name = packageNameFromPath(path);
  if (!name || !pkg.version) return null;
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

function versions(values: Resolution[]): string[] {
  return [...new Set(values.map((value) => value.version))].sort(semver.compare);
}

export function comparePackageResolutions(
  before: Resolution[],
  after: Resolution[],
  policy: SafetyPolicy
): SafetyResult {
  if (before.length === 0 && after.length === 0) return { safe: true, reason: "Package is absent" };
  if (before.length > 0 && after.length === 0)
    return { safe: false, reason: "Package disappears without the override" };

  if (policy === "exact" || policy === "full-tree") {
    return equalResolutions(before, after)
      ? {
          safe: true,
          reason: `npm resolves the same versions without the override: ${versions(after).join(", ")}`,
        }
      : { safe: false, reason: "Package versions, sources, or instance counts change" };
  }

  const baseline = before.map((entry) => semver.valid(entry.version, { loose: true }));
  const candidate = after.map((entry) => semver.valid(entry.version, { loose: true }));
  if (baseline.some((entry) => !entry) || candidate.some((entry) => !entry)) {
    return equalResolutions(before, after)
      ? { safe: true, reason: "npm resolves the same non-semver sources without the override" }
      : { safe: false, reason: "Package source changes and cannot be ordered safely" };
  }
  const maximum = semver.maxSatisfying(baseline as string[], ">=0.0.0-0", {
    loose: true,
    includePrerelease: true,
  });
  if (!maximum) return { safe: false, reason: "Versions cannot be compared safely" };

  const baselineCounts = new Map<string, number>();
  const candidateCounts = new Map<string, number>();
  for (const entry of before)
    baselineCounts.set(entry.version, (baselineCounts.get(entry.version) ?? 0) + 1);
  for (const entry of after)
    candidateCounts.set(entry.version, (candidateCounts.get(entry.version) ?? 0) + 1);
  const older = [...candidateCounts]
    .filter(
      ([version, count]) =>
        count > (baselineCounts.get(version) ?? 0) && semver.lt(version, maximum, { loose: true })
    )
    .map(([version]) => version)
    .sort(semver.compare);
  const candidateMaximum = semver.maxSatisfying(candidate as string[], ">=0.0.0-0", {
    loose: true,
    includePrerelease: true,
  });
  if (candidateMaximum && semver.lt(candidateMaximum, maximum, { loose: true }))
    older.push(candidateMaximum);
  const uniqueOlder = [...new Set(older)].sort(semver.compare);
  if (uniqueOlder.length > 0)
    return {
      safe: false,
      reason: `Removing the override introduces older versions: ${uniqueOlder.join(", ")}`,
    };

  const beforeVersions = versions(before);
  const afterVersions = versions(after);
  return {
    safe: true,
    reason:
      beforeVersions.join("\0") === afterVersions.join("\0")
        ? `npm resolves the same versions without the override: ${afterVersions.join(", ")}`
        : `npm resolves no older versions without the override: ${afterVersions.join(", ")}`,
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
  if (policy !== "full-tree")
    return comparePackageResolutions(
      beforeIndex.get(packageName) ?? [],
      afterIndex.get(packageName) ?? [],
      policy
    );

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
