import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseOptions } from "./options.js";

describe("CLI options", () => {
  it("defaults to a read-only scan", () => {
    assert.deepStrictEqual(parseOptions([]), {
      fix: false,
      help: false,
      version: false,
    });
  });

  for (const option of ["fix", "help", "version"] as const) {
    it(`accepts --${option}`, () => {
      assert.deepStrictEqual(parseOptions([`--${option}`]), {
        fix: option === "fix",
        help: option === "help",
        version: option === "version",
      });
    });
  }

  for (const args of [
    ["--dry-run"],
    ["--verbose"],
    ["--include", "example"],
    ["--exclude", "example"],
    ["--cwd", "/tmp"],
    ["--concurrency", "2"],
    ["--policy", "exact"],
    ["--cache"],
    ["--no-cache"],
    ["--no-fix"],
    ["-h"],
    ["-V"],
    ["project"],
  ]) {
    it(`rejects ${args.join(" ")}`, () => {
      assert.throws(() => parseOptions(args));
    });
  }
});
