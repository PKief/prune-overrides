import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import { createSpinner, type SpinnerInstance } from "./spinner.js";

describe("spinner utility", () => {
  describe("createSpinner", () => {
    it("should return a SpinnerInstance with all required methods", () => {
      const spinner = createSpinner("Test spinner");

      assert.notStrictEqual(spinner, undefined);
      assert.strictEqual(typeof spinner.start, "function");
      assert.strictEqual(typeof spinner.update, "function");
      assert.strictEqual(typeof spinner.success, "function");
      assert.strictEqual(typeof spinner.error, "function");
      assert.strictEqual(typeof spinner.stop, "function");
    });

    it("should accept text parameter", () => {
      const spinner = createSpinner("Loading...");
      assert.notStrictEqual(spinner, undefined);
    });

    it("should work without options parameter", () => {
      // This will use fallback spinner in test environment (non-TTY)
      const spinner = createSpinner("Loading...");
      assert.notStrictEqual(spinner, undefined);
      assert.strictEqual(typeof spinner.start, "function");
    });
  });

  describe("non-TTY fallback behavior", () => {
    // In test environment, process.stdout.isTTY is typically false,
    // so we get the fallback spinner
    let consoleSpy: ReturnType<typeof mock.method<typeof console, "log">>;
    let consoleErrorSpy: ReturnType<
      typeof mock.method<typeof console, "error">
    >;

    beforeEach(() => {
      consoleSpy = mock.method(console, "log", () => {});
      consoleErrorSpy = mock.method(console, "error", () => {});
    });

    afterEach(() => {
      consoleSpy.mock.restore();
      consoleErrorSpy.mock.restore();
    });

    it("should return a spinner with all methods in non-TTY environment", () => {
      const spinner = createSpinner("Fallback test");

      assert.notStrictEqual(spinner, undefined);
      assert.strictEqual(typeof spinner.start, "function");
      assert.strictEqual(typeof spinner.update, "function");
      assert.strictEqual(typeof spinner.success, "function");
      assert.strictEqual(typeof spinner.error, "function");
      assert.strictEqual(typeof spinner.stop, "function");
    });

    it("should log text on start() in non-TTY environment", () => {
      const spinner = createSpinner("Initial text");
      spinner.start();

      assert.ok(
        consoleSpy.mock.calls.some(({ arguments: args }) => {
          try {
            assert.deepStrictEqual(args, ["Initial text"]);
            return true;
          } catch {
            return false;
          }
        }),
      );
    });

    it("should log custom text on start() when provided", () => {
      const spinner = createSpinner("Initial text");
      spinner.start("Custom start text");

      assert.ok(
        consoleSpy.mock.calls.some(({ arguments: args }) => {
          try {
            assert.deepStrictEqual(args, ["Custom start text"]);
            return true;
          } catch {
            return false;
          }
        }),
      );
    });

    it("should log text on update() in non-TTY environment", () => {
      const spinner = createSpinner("Initial text");
      spinner.update("Updated text");

      assert.ok(
        consoleSpy.mock.calls.some(({ arguments: args }) => {
          try {
            assert.deepStrictEqual(args, ["Updated text"]);
            return true;
          } catch {
            return false;
          }
        }),
      );
    });

    it("should log success message with checkmark on success()", () => {
      const spinner = createSpinner("Initial text");
      spinner.success("Task completed");

      // The success message includes a green checkmark
      assert.ok(consoleSpy.mock.callCount() > 0);
      const callArg = consoleSpy.mock.calls[0]?.arguments[0];
      assert.ok(callArg?.includes("Task completed"));
    });

    it("should not log anything on success() without text", () => {
      const spinner = createSpinner("Initial text");
      spinner.success();

      assert.strictEqual(consoleSpy.mock.callCount(), 0);
    });

    it("should log error message with cross mark on error()", () => {
      const spinner = createSpinner("Initial text");
      spinner.error("Task failed");

      // The error message includes a red cross mark
      assert.ok(consoleErrorSpy.mock.callCount() > 0);
      const callArg = consoleErrorSpy.mock.calls[0]?.arguments[0];
      assert.ok(callArg?.includes("Task failed"));
    });

    it("should not log anything on error() without text", () => {
      const spinner = createSpinner("Initial text");
      spinner.error();

      assert.strictEqual(consoleErrorSpy.mock.callCount(), 0);
    });

    it("should not throw on stop() in non-TTY environment", () => {
      const spinner = createSpinner("Initial text");
      assert.doesNotThrow(() => spinner.stop());
    });

    it("should handle full lifecycle in non-TTY environment", () => {
      const spinner = createSpinner("Processing");

      assert.doesNotThrow(() => {
        spinner.start();
        spinner.update("Step 1");
        spinner.update("Step 2");
        spinner.success("All done");
        spinner.stop();
      });

      // Verify the expected calls
      assert.ok(
        consoleSpy.mock.calls.some(({ arguments: args }) => {
          try {
            assert.deepStrictEqual(args, ["Processing"]);
            return true;
          } catch {
            return false;
          }
        }),
      );
      assert.ok(
        consoleSpy.mock.calls.some(({ arguments: args }) => {
          try {
            assert.deepStrictEqual(args, ["Step 1"]);
            return true;
          } catch {
            return false;
          }
        }),
      );
      assert.ok(
        consoleSpy.mock.calls.some(({ arguments: args }) => {
          try {
            assert.deepStrictEqual(args, ["Step 2"]);
            return true;
          } catch {
            return false;
          }
        }),
      );
    });
  });

  describe("SpinnerInstance interface compliance", () => {
    it("should return object matching SpinnerInstance interface", () => {
      const spinner: SpinnerInstance = createSpinner("Test");

      // TypeScript will catch interface mismatches at compile time,
      // but we also verify at runtime
      const methods: (keyof SpinnerInstance)[] = [
        "start",
        "update",
        "success",
        "error",
        "stop",
      ];

      methods.forEach((method) => {
        assert.notStrictEqual(spinner[method], undefined);
        assert.strictEqual(typeof spinner[method], "function");
      });
    });

    it("should handle spinner creation", () => {
      const spinner = createSpinner("Test");
      assert.notStrictEqual(spinner, undefined);
    });
  });
});
