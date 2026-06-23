import { styleText } from "node:util";

export interface SpinnerInstance {
  start(text?: string): void;
  update(text: string): void;
  success(text?: string): void;
  error(text?: string): void;
  stop(): void;
}

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
        console.log(styleText("green", `✓ ${text}`));
      }
    },
    error(text?: string): void {
      if (text) {
        console.error(styleText("red", `✗ ${text}`));
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    stop(): void {},
  };
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;

function createInteractiveSpinner(initialText: string): SpinnerInstance {
  let frameIndex = 0;
  let currentText = initialText;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function render(): void {
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length] ?? "⠋";
    process.stdout.write(`\r\x1b[K${frame} ${currentText}`);
    frameIndex++;
  }

  function stopInterval(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return {
    start(text?: string): void {
      if (text) {
        currentText = text;
      }
      frameIndex = 0;
      render();
      intervalId = setInterval(render, SPINNER_INTERVAL_MS);
    },
    update(text: string): void {
      currentText = text;
    },
    success(text?: string): void {
      stopInterval();
      const message = text ?? currentText;
      process.stdout.write(`\r\x1b[K${styleText("green", "✓")} ${message}\n`);
    },
    error(text?: string): void {
      stopInterval();
      const message = text ?? currentText;
      process.stdout.write(`\r\x1b[K${styleText("red", "✗")} ${message}\n`);
    },
    stop(): void {
      stopInterval();
      process.stdout.write("\r\x1b[K");
    },
  };
}

export function createSpinner(text: string): SpinnerInstance {
  if (!isInteractive) {
    return createFallbackSpinner(text);
  }

  return createInteractiveSpinner(text);
}
