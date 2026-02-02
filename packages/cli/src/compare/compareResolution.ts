/**
 * Compare two version strings
 */
export function versionsMatch(before: string | null, after: string | null): boolean {
  // Both null means package doesn't exist
  if (before === null && after === null) {
    return true;
  }

  // One null means package appeared or disappeared
  if (before === null || after === null) {
    return false;
  }

  // Compare version strings
  return before === after;
}

/**
 * Determine if an override affects the resolution
 */
export function overrideAffectsResolution(
  withOverride: string | null,
  withoutOverride: string | null
): boolean {
  return !versionsMatch(withOverride, withoutOverride);
}

/**
 * Get a human-readable comparison description
 */
export function describeChange(before: string | null, after: string | null): string {
  if (before === null && after === null) {
    return "Package not in dependency tree";
  }

  if (before === null) {
    return `Package would be added: ${String(after)}`;
  }

  if (after === null) {
    return `Package would be removed (was ${before})`;
  }

  if (before === after) {
    return `No change: ${before}`;
  }

  return `${before} → ${after}`;
}
