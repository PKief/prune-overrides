import type { OverrideAnalysisResult } from "./types.js";
import { createTempWorkspace } from "../fs/tempWorkspace.js";
import type { PackageJson } from "../fs/readPackageJson.js";
import { writePackageJson, removeOverride } from "../fs/writePackageJson.js";
import { readLockfile, getAllResolvedVersions } from "../fs/readLockfile.js";
import type { Lockfile } from "../fs/readLockfile.js";
import { npmInstall } from "../npm/install.js";
import { logger } from "../util/logger.js";
import { findMinVersion, wouldIntroduceOlderVersions, getOlderVersions } from "../util/semver.js";

export interface AnalyzeSingleOptions {
  cwd: string;
  overrideKey: string;
  overrideValue: string;
  overridePath?: string[];
  baselineLockfile: Lockfile;
  packageJson: PackageJson;
}

export async function analyzeSingleOverride(
  options: AnalyzeSingleOptions
): Promise<OverrideAnalysisResult> {
  const { cwd, overrideKey, overrideValue, overridePath } = options;

  logger.debug(
    `Analyzing override: ${overridePath ? [...overridePath, overrideKey].join(" > ") : overrideKey} -> ${overrideValue}`
  );

  const beforeVersions = getAllResolvedVersions(options.baselineLockfile, overrideKey);
  const beforeMinVersion = findMinVersion(beforeVersions);

  logger.debug(
    `Current versions of ${overrideKey}: ${beforeVersions.length > 0 ? beforeVersions.join(", ") : "none"}`
  );

  const modifiedPackageJson = removeOverride(options.packageJson, overrideKey, overridePath);

  const workspace = await createTempWorkspace(cwd);

  try {
    await writePackageJson(workspace.path, modifiedPackageJson);

    try {
      await npmInstall({
        cwd: workspace.path,
        packageLockOnly: true,
        ignoreScripts: true,
      });
    } catch (error) {
      // Install error means the override is required
      logger.debug(`npm install failed without override: ${String(error)}`);
      return {
        name: overrideKey,
        ...(overridePath ? { overridePath } : {}),
        overrideValue,
        before: beforeMinVersion,
        after: null,
        verdict: "required",
        reason: "npm install fails without this override",
      };
    }

    const newLockfile = await readLockfile(workspace.path);
    const afterVersions = getAllResolvedVersions(newLockfile, overrideKey);
    const afterMinVersion = findMinVersion(afterVersions);

    logger.debug(
      `Versions without override: ${afterVersions.length > 0 ? afterVersions.join(", ") : "none"}`
    );

    if (beforeVersions.length === 0 && afterVersions.length === 0) {
      return {
        name: overrideKey,
        ...(overridePath ? { overridePath } : {}),
        overrideValue,
        before: null,
        after: null,
        verdict: "redundant",
        reason: "Package not found in dependency tree",
      };
    }

    // Check if removing the override would introduce ANY older versions
    if (wouldIntroduceOlderVersions(beforeVersions, afterVersions)) {
      const olderVersions = getOlderVersions(afterVersions, beforeMinVersion ?? "0.0.0");
      return {
        name: overrideKey,
        ...(overridePath ? { overridePath } : {}),
        overrideValue,
        before: beforeMinVersion,
        after: afterMinVersion,
        verdict: "required",
        reason: `Would introduce older version(s): ${olderVersions.join(", ")} (currently all at ${beforeMinVersion ?? "unknown"} or newer)`,
      };
    }

    const beforeSet = new Set(beforeVersions);
    const afterSet = new Set(afterVersions);
    const setsEqual =
      beforeSet.size === afterSet.size && [...beforeSet].every((v) => afterSet.has(v));

    if (setsEqual) {
      return {
        name: overrideKey,
        ...(overridePath ? { overridePath } : {}),
        overrideValue,
        before: beforeMinVersion,
        after: afterMinVersion,
        verdict: "redundant",
        reason: "Same version(s) resolve with and without override",
      };
    }

    // Versions changed but no older versions introduced - could be redundant
    // This happens when the override was pinning to a version that dependencies
    // would naturally resolve to anyway (or newer)
    if (!wouldIntroduceOlderVersions(beforeVersions, afterVersions)) {
      // All versions in 'after' are >= min version in 'before'
      // This means the override isn't preventing downgrades
      return {
        name: overrideKey,
        ...(overridePath ? { overridePath } : {}),
        overrideValue,
        before: beforeMinVersion,
        after: afterMinVersion,
        verdict: "redundant",
        reason: `No older versions would be introduced (before: ${beforeVersions.join(", ")}, after: ${afterVersions.join(", ")})`,
      };
    }

    return {
      name: overrideKey,
      ...(overridePath ? { overridePath } : {}),
      overrideValue,
      before: beforeMinVersion,
      after: afterMinVersion,
      verdict: "required",
      reason: `Version changes from ${beforeMinVersion ?? "none"} to ${afterMinVersion ?? "none"} without override`,
    };
  } finally {
    await workspace.cleanup();
  }
}
