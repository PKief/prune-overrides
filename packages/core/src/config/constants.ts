/**
 * Exit codes for the CLI
 */
export const ExitCode = {
  /** No redundant overrides found */
  SUCCESS: 0,
  /** Redundant overrides were found */
  REDUNDANT_FOUND: 1,
  /** An error occurred */
  ERROR: 2,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

/**
 * Default timeout for npm operations in milliseconds
 */
export const DEFAULT_NPM_TIMEOUT = 120000;

/**
 * Temp directory prefix for workspaces
 */
export const TEMP_DIR_PREFIX = "prune-overrides-";
