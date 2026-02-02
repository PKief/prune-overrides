// CLI entrypoint and options
export { run } from "./cli/run.js";
export { createProgram, parseOptions } from "./cli/options.js";
export type { CliOptions } from "./cli/options.js";

// Analyzer
export { analyzeOverrides } from "./analyzer/analyzeOverrides.js";
export { analyzeSingleOverride } from "./analyzer/analyzeSingle.js";
export type { AnalyzeSingleOptions } from "./analyzer/analyzeSingle.js";

// FS utilities
export { readPackageJson, getOverrideKeys } from "./fs/readPackageJson.js";
export type { PackageJson } from "./fs/readPackageJson.js";
export { readLockfile, getResolvedVersion, getAllResolvedVersions } from "./fs/readLockfile.js";
export type { Lockfile, LockfilePackage } from "./fs/readLockfile.js";
export { writePackageJson, removeOverride } from "./fs/writePackageJson.js";
export { createTempWorkspace } from "./fs/tempWorkspace.js";
export type { TempWorkspace } from "./fs/tempWorkspace.js";

// NPM utilities
export { npmInstall, checkNpmAvailable, getNpmVersion } from "./npm/install.js";
export type { InstallOptions } from "./npm/install.js";
export { npmExplain, hasDependents } from "./npm/explain.js";
export type { NpmExplainNode, NpmExplainDependent, ExplainOptions } from "./npm/explain.js";
export { npmLs, extractVersionsFromLs } from "./npm/ls.js";
export type { NpmLsDependency, NpmLsResult, LsOptions } from "./npm/ls.js";

// Compare utilities
export {
  versionsMatch,
  overrideAffectsResolution,
  describeChange,
} from "./compare/compareResolution.js";
export { diffLockfiles, filterDiffsByPackage, hasChangesForPackage } from "./compare/diffTree.js";
export type { DiffEntry } from "./compare/diffTree.js";

// Reporters
export { reportToConsole } from "./report/consoleReporter.js";
export { reportToJson, printJsonReport } from "./report/jsonReporter.js";
export type { JsonReport } from "./report/jsonReporter.js";

// Re-export core types for convenience
export type {
  OverrideVerdict,
  OverrideAnalysisResult,
  AnalysisReport,
  AnalyzerOptions,
} from "@prune-overrides/core";
