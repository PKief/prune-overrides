/**
 * Base error class for prune-overrides
 */
export class PruneOverridesError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "PruneOverridesError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error when package.json cannot be found or read
 */
export class PackageJsonError extends PruneOverridesError {
  constructor(message: string) {
    super(message, "PACKAGE_JSON_ERROR");
    this.name = "PackageJsonError";
  }
}

/**
 * Error when package-lock.json cannot be found or read
 */
export class LockfileError extends PruneOverridesError {
  constructor(message: string) {
    super(message, "LOCKFILE_ERROR");
    this.name = "LockfileError";
  }
}

/**
 * Error when npm command fails
 */
export class NpmError extends PruneOverridesError {
  constructor(
    message: string,
    public readonly command: string,
    public readonly stderr?: string
  ) {
    super(message, "NPM_ERROR");
    this.name = "NpmError";
  }
}

/**
 * Error when workspace operations fail
 */
export class WorkspaceError extends PruneOverridesError {
  constructor(message: string) {
    super(message, "WORKSPACE_ERROR");
    this.name = "WorkspaceError";
  }
}

/**
 * Error for invalid configuration or options
 */
export class ConfigError extends PruneOverridesError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}
