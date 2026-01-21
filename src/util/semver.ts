/**
 * Simple semver comparison utilities.
 * We avoid adding the full semver package to keep dependencies minimal.
 */

/**
 * Parse a semver version string into components
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
} | null {
  // Handle versions like "1.2.3", "1.2.3-beta.1", "1.2.3-rc.1"
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(version);
  if (!match) {
    return null;
  }

  return {
    major: parseInt(match[1] ?? "0", 10),
    minor: parseInt(match[2] ?? "0", 10),
    patch: parseInt(match[3] ?? "0", 10),
    prerelease: match[4] ?? "",
  };
}

/**
 * Compare two semver versions.
 * Returns:
 *   -1 if a < b
 *    0 if a === b
 *    1 if a > b
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);

  // If we can't parse, fall back to string comparison
  if (!parsedA || !parsedB) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  // Compare major.minor.patch
  if (parsedA.major !== parsedB.major) {
    return parsedA.major < parsedB.major ? -1 : 1;
  }
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor < parsedB.minor ? -1 : 1;
  }
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch < parsedB.patch ? -1 : 1;
  }

  // Handle prerelease: no prerelease > prerelease (1.0.0 > 1.0.0-beta)
  if (!parsedA.prerelease && parsedB.prerelease) {
    return 1;
  }
  if (parsedA.prerelease && !parsedB.prerelease) {
    return -1;
  }
  if (parsedA.prerelease && parsedB.prerelease) {
    if (parsedA.prerelease < parsedB.prerelease) return -1;
    if (parsedA.prerelease > parsedB.prerelease) return 1;
  }

  return 0;
}

/**
 * Check if version a is older than version b
 */
export function isOlderVersion(a: string, b: string): boolean {
  return compareVersions(a, b) < 0;
}

/**
 * Find the minimum version in an array
 */
export function findMinVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;

  let min = versions[0];
  if (!min) return null;

  for (const v of versions) {
    if (compareVersions(v, min) < 0) {
      min = v;
    }
  }
  return min;
}

/**
 * Find the maximum version in an array
 */
export function findMaxVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;

  let max = versions[0];
  if (!max) return null;

  for (const v of versions) {
    if (compareVersions(v, max) > 0) {
      max = v;
    }
  }
  return max;
}

/**
 * Check if removing an override would introduce older versions.
 * Returns true if any version in 'after' is older than the minimum version in 'before'.
 */
export function wouldIntroduceOlderVersions(before: string[], after: string[]): boolean {
  if (before.length === 0 || after.length === 0) {
    return false;
  }

  const minBefore = findMinVersion(before);
  if (!minBefore) return false;

  // Check if any version in 'after' is older than the minimum we had before
  for (const version of after) {
    if (isOlderVersion(version, minBefore)) {
      return true;
    }
  }

  return false;
}

/**
 * Get versions that are older than a reference version
 */
export function getOlderVersions(versions: string[], reference: string): string[] {
  return versions.filter((v) => isOlderVersion(v, reference));
}
