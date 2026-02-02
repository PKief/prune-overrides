import { jest } from "@jest/globals";
import { createSpinner, type SpinnerInstance } from "@prune-overrides/core";

describe("spinner utility", () => {
  describe("createSpinner", () => {
    it("should return a SpinnerInstance with all required methods", () => {
      const spinner = createSpinner("Test spinner", { silent: true });

      expect(spinner).toBeDefined();
      expect(typeof spinner.start).toBe("function");
      expect(typeof spinner.update).toBe("function");
      expect(typeof spinner.success).toBe("function");
      expect(typeof spinner.error).toBe("function");
      expect(typeof spinner.stop).toBe("function");
    });

    it("should accept text parameter", () => {
      const spinner = createSpinner("Loading...", { silent: true });
      expect(spinner).toBeDefined();
    });

    it("should accept options parameter", () => {
      const spinner = createSpinner("Loading...", { silent: true });
      expect(spinner).toBeDefined();
    });

    it("should work without options parameter", () => {
      // This will use fallback spinner in test environment (non-TTY)
      const spinner = createSpinner("Loading...");
      expect(spinner).toBeDefined();
      expect(typeof spinner.start).toBe("function");
    });
  });

  describe("silent mode", () => {
    let spinner: SpinnerInstance;

    beforeEach(() => {
      spinner = createSpinner("Silent spinner", { silent: true });
    });

    it("should return a no-op spinner in silent mode", () => {
      expect(spinner).toBeDefined();
    });

    it("should not throw when calling start()", () => {
      expect(() => spinner.start()).not.toThrow();
      expect(() => spinner.start("Starting...")).not.toThrow();
    });

    it("should not throw when calling update()", () => {
      expect(() => spinner.update("Updating...")).not.toThrow();
    });

    it("should not throw when calling success()", () => {
      expect(() => spinner.success()).not.toThrow();
      expect(() => spinner.success("Success!")).not.toThrow();
    });

    it("should not throw when calling error()", () => {
      expect(() => spinner.error()).not.toThrow();
      expect(() => spinner.error("Error!")).not.toThrow();
    });

    it("should not throw when calling stop()", () => {
      expect(() => spinner.stop()).not.toThrow();
    });

    it("should allow chaining all methods without errors", () => {
      expect(() => {
        spinner.start("Starting...");
        spinner.update("Processing...");
        spinner.success("Done!");
        spinner.stop();
      }).not.toThrow();
    });
  });

  describe("non-TTY fallback behavior", () => {
    // In test environment, process.stdout.isTTY is typically false,
    // so we get the fallback spinner unless silent mode is used
    let consoleSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "log").mockImplementation();
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should return a spinner with all methods in non-TTY environment", () => {
      const spinner = createSpinner("Fallback test");

      expect(spinner).toBeDefined();
      expect(typeof spinner.start).toBe("function");
      expect(typeof spinner.update).toBe("function");
      expect(typeof spinner.success).toBe("function");
      expect(typeof spinner.error).toBe("function");
      expect(typeof spinner.stop).toBe("function");
    });

    it("should log text on start() in non-TTY environment", () => {
      const spinner = createSpinner("Initial text");
      spinner.start();

      expect(consoleSpy).toHaveBeenCalledWith("Initial text");
    });

    it("should log custom text on start() when provided", () => {
      const spinner = createSpinner("Initial text");
      spinner.start("Custom start text");

      expect(consoleSpy).toHaveBeenCalledWith("Custom start text");
    });

    it("should log text on update() in non-TTY environment", () => {
      const spinner = createSpinner("Initial text");
      spinner.update("Updated text");

      expect(consoleSpy).toHaveBeenCalledWith("Updated text");
    });

    it("should log success message with checkmark on success()", () => {
      const spinner = createSpinner("Initial text");
      spinner.success("Task completed");

      // The success message includes a green checkmark
      expect(consoleSpy).toHaveBeenCalled();
      const callArg = consoleSpy.mock.calls[0][0];
      expect(callArg).toContain("Task completed");
    });

    it("should not log anything on success() without text", () => {
      const spinner = createSpinner("Initial text");
      spinner.success();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should log error message with cross mark on error()", () => {
      const spinner = createSpinner("Initial text");
      spinner.error("Task failed");

      // The error message includes a red cross mark
      expect(consoleErrorSpy).toHaveBeenCalled();
      const callArg = consoleErrorSpy.mock.calls[0][0];
      expect(callArg).toContain("Task failed");
    });

    it("should not log anything on error() without text", () => {
      const spinner = createSpinner("Initial text");
      spinner.error();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should not throw on stop() in non-TTY environment", () => {
      const spinner = createSpinner("Initial text");
      expect(() => spinner.stop()).not.toThrow();
    });

    it("should handle full lifecycle in non-TTY environment", () => {
      const spinner = createSpinner("Processing");

      expect(() => {
        spinner.start();
        spinner.update("Step 1");
        spinner.update("Step 2");
        spinner.success("All done");
        spinner.stop();
      }).not.toThrow();

      // Verify the expected calls
      expect(consoleSpy).toHaveBeenCalledWith("Processing");
      expect(consoleSpy).toHaveBeenCalledWith("Step 1");
      expect(consoleSpy).toHaveBeenCalledWith("Step 2");
    });
  });

  describe("SpinnerInstance interface compliance", () => {
    it("should return object matching SpinnerInstance interface", () => {
      const spinner: SpinnerInstance = createSpinner("Test", { silent: true });

      // TypeScript will catch interface mismatches at compile time,
      // but we also verify at runtime
      const methods: (keyof SpinnerInstance)[] = ["start", "update", "success", "error", "stop"];

      methods.forEach((method) => {
        expect(spinner[method]).toBeDefined();
        expect(typeof spinner[method]).toBe("function");
      });
    });

    it("should handle undefined options gracefully", () => {
      const spinner = createSpinner("Test");
      expect(spinner).toBeDefined();
    });

    it("should handle empty options object", () => {
      const spinner = createSpinner("Test", {});
      expect(spinner).toBeDefined();
    });

    it("should handle silent: false explicitly", () => {
      const spinner = createSpinner("Test", { silent: false });
      expect(spinner).toBeDefined();
    });
  });
});
