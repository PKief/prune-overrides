/**
 * Semver comparison utilities using the official semver package.
 * This ensures correct handling of all edge cases including:
 * - Build metadata (1.0.0+build)
 * - Prerelease versions (1.0.0-alpha.1, 1.0.0-beta.10)
 * - Invalid versions (graceful fallback)
 */

import semver from "semver";

/**
 * Compare two semver versions.
 * Returns:
 *   -1 if a < b
 *    0 if a === b
 *    1 if a > b
 *
 * Falls back to string comparison for invalid versions.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  try {
    const result = semver.compare(a, b, { loose: true });
    return result;
  } catch {
    // Fallback for invalid semver (e.g., "latest", git refs, URLs)
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
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

  // Filter to valid semver versions first
  const validVersions = versions.filter((v) => semver.valid(v, { loose: true }));

  if (validVersions.length > 0) {
    // Use semver.minSatisfying with includePrerelease to handle all versions
    const min = semver.minSatisfying(validVersions, ">=0.0.0-0", {
      loose: true,
      includePrerelease: true,
    });
    if (min) return min;
  }

  // Fallback: manual comparison for all versions (including invalid ones)
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

  // Filter to valid semver versions first
  const validVersions = versions.filter((v) => semver.valid(v, { loose: true }));

  if (validVersions.length > 0) {
    // Use semver.maxSatisfying with includePrerelease to handle all versions
    const max = semver.maxSatisfying(validVersions, ">=0.0.0-0", {
      loose: true,
      includePrerelease: true,
    });
    if (max) return max;
  }

  // Fallback: manual comparison for all versions (including invalid ones)
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
