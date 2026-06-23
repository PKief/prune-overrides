export { run } from "./cli/run.js";
export { parseOptions } from "./cli/options.js";
export type { CliOptions } from "./cli/options.js";

export { analyzeOverrides } from "./analyzer/analyzeOverrides.js";
export { analyzeSingleOverride } from "./analyzer/analyzeSingle.js";
export type { AnalyzeSingleOptions } from "./analyzer/analyzeSingle.js";

export { readPackageJson, getOverrideKeys } from "./fs/readPackageJson.js";
export type { PackageJson } from "./fs/readPackageJson.js";
export { readLockfile, getResolvedVersion, getAllResolvedVersions } from "./fs/readLockfile.js";
export type { Lockfile, LockfilePackage } from "./fs/readLockfile.js";
export { writePackageJson, removeOverride } from "./fs/writePackageJson.js";
export { createTempWorkspace } from "./fs/tempWorkspace.js";
export type { TempWorkspace } from "./fs/tempWorkspace.js";

export { npmInstall, checkNpmAvailable, getNpmVersion } from "./npm/install.js";
export type { InstallOptions } from "./npm/install.js";
export { npmExplain, hasDependents } from "./npm/explain.js";
export type { NpmExplainNode, NpmExplainDependent, ExplainOptions } from "./npm/explain.js";
export { npmLs, extractVersionsFromLs } from "./npm/ls.js";
export type { NpmLsDependency, NpmLsResult, LsOptions } from "./npm/ls.js";

export { processInPool } from "./util/processInPool.js";

export {
  versionsMatch,
  overrideAffectsResolution,
  describeChange,
} from "./compare/compareResolution.js";
export { diffLockfiles, filterDiffsByPackage, hasChangesForPackage } from "./compare/diffTree.js";
export type { DiffEntry } from "./compare/diffTree.js";

export { reportToConsole } from "./report/consoleReporter.js";

export type {
  OverrideVerdict,
  OverrideAnalysisResult,
  AnalysisReport,
  AnalyzerOptions,
} from "./analyzer/types.js";
