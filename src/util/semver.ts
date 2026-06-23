import semver from "semver";

export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  try {
    const result = semver.compare(a, b, { loose: true });
    return result;
  } catch {
    // Fallback for invalid semver (e.g. "latest", git refs, URLs)
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
}

export function isOlderVersion(a: string, b: string): boolean {
  return compareVersions(a, b) < 0;
}

export function findMinVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;

  const validVersions = versions.filter((v) => semver.valid(v, { loose: true }));

  if (validVersions.length > 0) {
    const min = semver.minSatisfying(validVersions, ">=0.0.0-0", {
      loose: true,
      includePrerelease: true,
    });
    if (min) return min;
  }

  let min = versions[0];
  if (!min) return null;

  for (const v of versions) {
    if (compareVersions(v, min) < 0) {
      min = v;
    }
  }
  return min;
}

export function findMaxVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;

  const validVersions = versions.filter((v) => semver.valid(v, { loose: true }));

  if (validVersions.length > 0) {
    const max = semver.maxSatisfying(validVersions, ">=0.0.0-0", {
      loose: true,
      includePrerelease: true,
    });
    if (max) return max;
  }

  let max = versions[0];
  if (!max) return null;

  for (const v of versions) {
    if (compareVersions(v, max) > 0) {
      max = v;
    }
  }
  return max;
}

export function wouldIntroduceOlderVersions(before: string[], after: string[]): boolean {
  if (before.length === 0 || after.length === 0) {
    return false;
  }

  const minBefore = findMinVersion(before);
  if (!minBefore) return false;

  for (const version of after) {
    if (isOlderVersion(version, minBefore)) {
      return true;
    }
  }

  return false;
}

export function getOlderVersions(versions: string[], reference: string): string[] {
  return versions.filter((v) => isOlderVersion(v, reference));
}
