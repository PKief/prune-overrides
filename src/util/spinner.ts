import { createSpinner as createNanoSpinner } from "nanospinner";
import pc from "picocolors";

export interface SpinnerOptions {
  silent?: boolean;
}

export interface SpinnerInstance {
  start(text?: string): void;
  update(text: string): void;
  success(text?: string): void;
  error(text?: string): void;
  stop(): void;
}

/**
 * Check if we're in an interactive TTY environment.
 * Returns false in CI/CD environments or when stdout is piped.
 */
function checkIsInteractive(): boolean {
  if (!process.stdout.isTTY) {
    return false;
  }
  if (process.env.CI) {
    return false;
  }
  return true;
}

const isInteractive = checkIsInteractive();

/**
 * Creates a no-op spinner for silent mode.
 * All methods are empty functions that do nothing.
 */
function createSilentSpinner(): SpinnerInstance {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = (): void => {};
  return {
    start: noop,
    update: noop,
    success: noop,
    error: noop,
    stop: noop,
  };
}

/**
 * Creates a simple fallback spinner for non-TTY environments.
 * Instead of animations, it just logs text to stdout.
 */
function createFallbackSpinner(initialText: string): SpinnerInstance {
  return {
    start(text?: string): void {
      console.log(text ?? initialText);
    },
    update(text: string): void {
      console.log(text);
    },
    success(text?: string): void {
      if (text) {
        console.log(pc.green(`✓ ${text}`));
      }
    },
    error(text?: string): void {
      if (text) {
        console.error(pc.red(`✗ ${text}`));
      }
    },
    stop(): void {
      // No-op for fallback
    },
  };
}

/**
 * Creates a spinner instance for CLI feedback.
 *
 * The spinner respects silent mode and non-TTY environments:
 * - In silent mode: returns a no-op spinner (no output)
 * - In non-TTY (CI/CD, piped): returns a simple logger without animation
 * - In interactive TTY: returns a real animated spinner
 *
 * @param text - Initial spinner text
 * @param options - Spinner options
 * @returns SpinnerInstance with start/update/success/error/stop methods
 */
export function createSpinner(text: string, options?: SpinnerOptions): SpinnerInstance {
  // Silent mode: return no-op spinner
  if (options?.silent) {
    return createSilentSpinner();
  }

  // Non-interactive environment: return fallback logger
  if (!isInteractive) {
    return createFallbackSpinner(text);
  }

  // Interactive TTY: use real nanospinner
  const spinner = createNanoSpinner(text);

  return {
    start(startText?: string): void {
      if (startText) {
        spinner.start({ text: startText });
      } else {
        spinner.start();
      }
    },
    update(updateText: string): void {
      spinner.update({ text: updateText });
    },
    success(successText?: string): void {
      spinner.success({ text: successText });
    },
    error(errorText?: string): void {
      spinner.error({ text: errorText });
    },
    stop(): void {
      spinner.stop();
    },
  };
}
