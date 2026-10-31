export class PruneOverridesError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
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
  public readonly command: string;
  public readonly stderr?: string;

  constructor(message: string, command: string, stderr?: string) {
    super(message, "NPM_ERROR");
    this.command = command;
    this.stderr = stderr;
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
