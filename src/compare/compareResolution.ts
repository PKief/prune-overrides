export function versionsMatch(before: string | null, after: string | null): boolean {
  if (before === null && after === null) {
    return true;
  }

  if (before === null || after === null) {
    return false;
  }

  return before === after;
}

export function overrideAffectsResolution(
  withOverride: string | null,
  withoutOverride: string | null
): boolean {
  return !versionsMatch(withOverride, withoutOverride);
}

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
