// Main exports for programmatic usage
export { analyzeOverrides } from "./analyzer/analyzeOverrides.js";
export { analyzeSingleOverride } from "./analyzer/analyzeSingle.js";
export type {
  AnalysisReport,
  AnalyzerOptions,
  OverrideAnalysisResult,
  OverrideVerdict,
} from "./analyzer/types.js";

// File system utilities
export { readPackageJson, getOverrideKeys } from "./fs/readPackageJson.js";
export type { PackageJson } from "./fs/readPackageJson.js";
export { writePackageJson, removeOverride } from "./fs/writePackageJson.js";
export { readLockfile, getResolvedVersion, getAllResolvedVersions } from "./fs/readLockfile.js";
export type { Lockfile, LockfilePackage } from "./fs/readLockfile.js";

// Comparison utilities
export { versionsMatch, overrideAffectsResolution, describeChange } from "./compare/compareResolution.js";
export { diffLockfiles, filterDiffsByPackage, hasChangesForPackage } from "./compare/diffTree.js";
export type { DiffEntry } from "./compare/diffTree.js";

// Semver utilities
export {
  compareVersions,
  isOlderVersion,
  findMinVersion,
  findMaxVersion,
  wouldIntroduceOlderVersions,
  getOlderVersions,
} from "./util/semver.js";

// Reporters
export { reportToConsole } from "./report/consoleReporter.js";
export { reportToJson, printJsonReport } from "./report/jsonReporter.js";
export type { JsonReport } from "./report/jsonReporter.js";

// Errors
export {
  PruneOverridesError,
  PackageJsonError,
  LockfileError,
  NpmError,
  WorkspaceError,
  ConfigError,
} from "./util/errors.js";

// Constants
export { ExitCode } from "./config/constants.js";
