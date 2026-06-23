export const ExitCode = {
  SUCCESS: 0,
  REDUNDANT_FOUND: 1,
  ERROR: 2,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

export const DEFAULT_NPM_TIMEOUT = 120000;

export const DEFAULT_CONCURRENCY = 5;

export const TEMP_DIR_PREFIX = "prune-overrides-";
