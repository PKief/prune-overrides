import pc from "picocolors";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  verbose?: boolean;
  silent?: boolean;
}

class Logger {
  private verbose = false;
  private silent = false;

  configure(options: LoggerOptions): void {
    this.verbose = options.verbose ?? false;
    this.silent = options.silent ?? false;
  }

  isSilent(): boolean {
    return this.silent;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.verbose && !this.silent) {
      console.log(pc.gray(`[DEBUG] ${message}`), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.silent) {
      console.log(message, ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (!this.silent) {
      console.log(pc.green(`✓ ${message}`), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.silent) {
      console.warn(pc.yellow(`⚠ ${message}`), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    console.error(pc.red(`✗ ${message}`), ...args);
  }

  newline(): void {
    if (!this.silent) {
      console.log();
    }
  }
}

export const logger = new Logger();
