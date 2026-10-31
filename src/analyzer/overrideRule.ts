import type { OverrideValue } from "../fs/readPackageJson.js";

export interface OverrideRule {
  /** Exact key used in the overrides object, including an optional selector. */
  key: string;
  /** Package name without an npm version selector. */
  packageName: string;
  value: string;
  /** Object keys leading to key. */
  path: string[];
}

/** Extract a package name from npm's name, name@range, or @scope/name@range syntax. */
export function parseOverridePackageName(key: string): string | null {
  if (key === ".") return null;
  if (key.startsWith("@")) {
    const slash = key.indexOf("/");
    if (slash < 2) return null;
    const selector = key.indexOf("@", slash);
    return selector === -1 ? key : key.slice(0, selector);
  }
  const selector = key.indexOf("@");
  return selector === -1 ? key : key.slice(0, selector);
}

export function flattenOverrideRules(
  overrides: Record<string, OverrideValue>,
  parentPath: string[] = [],
): OverrideRule[] {
  const rules: OverrideRule[] = [];

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === "string") {
      const parentKey = parentPath.at(-1);
      const packageName =
        key === "." && parentKey
          ? parseOverridePackageName(parentKey)
          : parseOverridePackageName(key);
      if (packageName)
        rules.push({ key, packageName, value, path: parentPath });
    } else {
      rules.push(...flattenOverrideRules(value, [...parentPath, key]));
    }
  }

  return rules;
}

export function getRuleId(rule: Pick<OverrideRule, "key" | "path">): string {
  return [...rule.path, rule.key].join(" > ");
}
