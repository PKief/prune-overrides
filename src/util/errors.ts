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

export class PackageJsonError extends PruneOverridesError {
  constructor(message: string) {
    super(message, "PACKAGE_JSON_ERROR");
    this.name = "PackageJsonError";
  }
}

export class LockfileError extends PruneOverridesError {
  constructor(message: string) {
    super(message, "LOCKFILE_ERROR");
    this.name = "LockfileError";
  }
}

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

export class WorkspaceError extends PruneOverridesError {
  constructor(message: string) {
    super(message, "WORKSPACE_ERROR");
    this.name = "WorkspaceError";
  }
}

export class ConfigError extends PruneOverridesError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}
