import { styleText } from "node:util";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  verbose?: boolean;
}

class Logger {
  private verbose = false;

  configure(options: LoggerOptions): void {
    this.verbose = options.verbose ?? false;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log(styleText("gray", `[DEBUG] ${message}`), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.log(message, ...args);
  }

  success(message: string, ...args: unknown[]): void {
    console.log(styleText("green", `✓ ${message}`), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(styleText("yellow", `⚠ ${message}`), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(styleText("red", `✗ ${message}`), ...args);
  }

  newline(): void {
    console.log();
  }
}

export const logger = new Logger();
