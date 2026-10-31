import type { OverrideAnalysisResult, SafetyPolicy } from "./types.js";
import type { OverrideRule } from "./overrideRule.js";
import { createTempWorkspace } from "../fs/tempWorkspace.js";
import type { PackageJson } from "../fs/readPackageJson.js";
import { writePackageJson, removeOverride } from "../fs/writePackageJson.js";
import { readLockfile, getAllResolvedVersions } from "../fs/readLockfile.js";
import type { Lockfile } from "../fs/readLockfile.js";
import { npmInstall } from "../npm/install.js";
import { logger } from "../util/logger.js";
import { findMinVersion } from "../util/semver.js";
import { compareLockfiles } from "../compare/resolutions.js";
import { classifyNpmFailure } from "./npmFailure.js";

export interface AnalyzeSingleOptions {
  cwd: string;
  overrideKey: string;
  overrideValue: string;
  overridePath?: string[];
  packageName?: string;
  baselineLockfile: Lockfile;
  packageJson: PackageJson;
  policy?: SafetyPolicy;
  signal?: AbortSignal;
}

export async function analyzeSingleOverride(
  options: AnalyzeSingleOptions,
): Promise<OverrideAnalysisResult> {
  const rule: OverrideRule = {
    key: options.overrideKey,
    packageName: options.packageName ?? options.overrideKey,
    value: options.overrideValue,
    path: options.overridePath ?? [],
  };
  const beforeVersions = getAllResolvedVersions(
    options.baselineLockfile,
    rule.packageName,
  );
  const base = {
    name: rule.key,
    packageName: rule.packageName,
    ...(rule.path.length > 0 ? { overridePath: rule.path } : {}),
    overrideValue: rule.value,
    before: findMinVersion(beforeVersions),
  };

  logger.debug(
    `Analyzing override: ${[...rule.path, rule.key].join(" > ")} -> ${rule.value}`,
  );
  const workspace = await createTempWorkspace(options.cwd);
  try {
    await writePackageJson(
      workspace.path,
      removeOverride(options.packageJson, rule.key, rule.path),
    );
    try {
      await npmInstall({
        cwd: workspace.path,
        signal: options.signal,
        freshResolution: true,
      });
    } catch (error) {
      logger.debug(`npm install failed without override: ${String(error)}`);
      const failure = classifyNpmFailure(error);
      return {
        ...base,
        after: null,
        verdict: failure.kind === "conflict" ? "required" : "unknown",
        reason: failure.reason,
      };
    }

    let candidate: Lockfile;
    try {
      candidate = await readLockfile(workspace.path);
    } catch (error) {
      return {
        ...base,
        after: null,
        verdict: "unknown",
        reason: `Generated lockfile is unreadable: ${String(error)}`,
      };
    }
    const afterVersions = getAllResolvedVersions(candidate, rule.packageName);
    const safety = compareLockfiles(
      options.baselineLockfile,
      candidate,
      rule.packageName,
      options.policy ?? "no-downgrade",
    );
    return {
      ...base,
      after: findMinVersion(afterVersions),
      verdict: safety.safe ? "redundant" : "required",
      reason: safety.reason,
    };
  } finally {
    await workspace.cleanup();
  }
}
