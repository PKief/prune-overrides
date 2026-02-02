// Types
export type {
  OverrideVerdict,
  OverrideAnalysisResult,
  AnalysisReport,
  AnalyzerOptions,
} from "./analyzer/types.js";

// NOTE: analyzeOverrides and analyzeSingle have external dependencies on fs/npm modules
// They remain in the main src/ directory and are not part of @prune-overrides/core
// The CLI package will import from both core (for types/utils) and the main analyzer

// URL encoding/decoding
export { encodeReport, decodeReport, toBase64Url, fromBase64Url } from "./share/urlCodec.js";
export type {
  ShareableResult,
  CompactResult,
  EncodedPayload,
  ShareableReport,
  DecodedReport,
} from "./share/types.js";
export {
  toShareableResult,
  fromShareableResult,
  VERDICT_TO_NUMBER,
  NUMBER_TO_VERDICT,
} from "./share/types.js";

// Utilities
export {
  PruneOverridesError,
  PackageJsonError,
  LockfileError,
  NpmError,
  WorkspaceError,
  ConfigError,
} from "./util/errors.js";
export { logger, type LogLevel } from "./util/logger.js";
export { createSpinner, type SpinnerInstance, type SpinnerOptions } from "./util/spinner.js";
export { exec, execSafe, type ExecResult, type ExecOptions } from "./util/exec.js";
export {
  compareVersions,
  isOlderVersion,
  findMinVersion,
  findMaxVersion,
  wouldIntroduceOlderVersions,
  getOlderVersions,
} from "./util/semver.js";

// Constants
export { ExitCode, DEFAULT_NPM_TIMEOUT, TEMP_DIR_PREFIX } from "./config/constants.js";
