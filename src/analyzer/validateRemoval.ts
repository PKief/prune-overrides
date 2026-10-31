import type { OverrideRule } from "./overrideRule.js";
import type { PackageJson } from "../fs/readPackageJson.js";
import type { Lockfile } from "../fs/readLockfile.js";
import { readLockfile } from "../fs/readLockfile.js";
import { removeOverride, writePackageJson } from "../fs/writePackageJson.js";
import { createTempWorkspace } from "../fs/tempWorkspace.js";
import { npmInstall } from "../npm/install.js";
import { compareLockfiles } from "../compare/resolutions.js";
import type { SafetyPolicy } from "../compare/resolutions.js";

export interface ValidationResult {
  safe: boolean;
  reason: string;
}

export async function validateRemovalSet(
  cwd: string,
  packageJson: PackageJson,
  baseline: Lockfile,
  rules: OverrideRule[],
  policy: SafetyPolicy,
  signal?: AbortSignal,
): Promise<ValidationResult> {
  if (rules.length === 0)
    return { safe: true, reason: "No overrides selected" };
  let modified = packageJson;
  for (const rule of rules)
    modified = removeOverride(modified, rule.key, rule.path);

  const workspace = await createTempWorkspace(cwd);
  try {
    await writePackageJson(workspace.path, modified);
    try {
      await npmInstall({ cwd: workspace.path, signal, freshResolution: true });
    } catch {
      return { safe: false, reason: "Combined npm install failed" };
    }
    const candidate = await readLockfile(workspace.path);
    if (policy === "full-tree")
      return compareLockfiles(
        baseline,
        candidate,
        rules[0]?.packageName ?? "",
        policy,
      );
    for (const rule of rules) {
      const result = compareLockfiles(
        baseline,
        candidate,
        rule.packageName,
        policy,
      );
      if (!result.safe)
        return { safe: false, reason: `${rule.packageName}: ${result.reason}` };
    }
    return { safe: true, reason: "Combined removal validated" };
  } finally {
    await workspace.cleanup();
  }
}

/** Greedily constructs a set whose combined removal has been validated. */
export async function selectSafeRemovalSet(
  cwd: string,
  packageJson: PackageJson,
  baseline: Lockfile,
  candidates: OverrideRule[],
  policy: SafetyPolicy,
  signal?: AbortSignal,
): Promise<{ safe: OverrideRule[]; rejected: OverrideRule[] }> {
  if (
    (
      await validateRemovalSet(
        cwd,
        packageJson,
        baseline,
        candidates,
        policy,
        signal,
      )
    ).safe
  ) {
    return { safe: candidates, rejected: [] };
  }
  const safe: OverrideRule[] = [];
  const rejected: OverrideRule[] = [];
  for (const candidate of candidates) {
    const proposed = [...safe, candidate];
    if (
      (
        await validateRemovalSet(
          cwd,
          packageJson,
          baseline,
          proposed,
          policy,
          signal,
        )
      ).safe
    )
      safe.push(candidate);
    else rejected.push(candidate);
  }
  return { safe, rejected };
}
