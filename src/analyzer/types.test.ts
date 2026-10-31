import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type OverrideVerdict,
  type OverrideAnalysisResult,
  getOverrideDisplayName,
} from "./types.js";

describe("analyzer types", () => {
  it("should allow valid verdict values", () => {
    const redundant: OverrideVerdict = "redundant";
    const required: OverrideVerdict = "required";

    assert.strictEqual(redundant, "redundant");
    assert.strictEqual(required, "required");
  });

  it("should allow valid analysis result structure", () => {
    const result: OverrideAnalysisResult = {
      name: "lodash",
      overrideValue: "4.17.21",
      before: "4.17.20",
      after: "4.17.21",
      verdict: "required",
      reason: "Version changes without override",
    };

    assert.strictEqual(result.name, "lodash");
    assert.strictEqual(result.verdict, "required");
  });

  it("should allow null before/after versions", () => {
    const result: OverrideAnalysisResult = {
      name: "minimist",
      overrideValue: "^1.2.8",
      before: null,
      after: null,
      verdict: "redundant",
      reason: "Package not in dependency tree",
    };

    assert.strictEqual(result.before, null);
    assert.strictEqual(result.after, null);
  });

  it("should allow overridePath for nested overrides", () => {
    const result: OverrideAnalysisResult = {
      name: "@example/core",
      overridePath: ["@example/eslint-plugin"],
      overrideValue: "$@example/core",
      before: "7.0.0",
      after: "6.0.0",
      verdict: "required",
      reason: "Would introduce older version(s)",
    };

    assert.deepStrictEqual(result.overridePath, ["@example/eslint-plugin"]);
  });

  it("should allow deep overridePath", () => {
    const result: OverrideAnalysisResult = {
      name: "baz",
      overridePath: ["foo", "bar"],
      overrideValue: "1.0.0",
      before: null,
      after: null,
      verdict: "redundant",
      reason: "Package not found in dependency tree",
    };

    assert.deepStrictEqual(result.overridePath, ["foo", "bar"]);
  });
});

describe("getOverrideDisplayName", () => {
  it("should return name for simple overrides", () => {
    const result: OverrideAnalysisResult = {
      name: "lodash",
      overrideValue: "4.17.21",
      before: null,
      after: null,
      verdict: "redundant",
      reason: "test",
    };

    assert.strictEqual(getOverrideDisplayName(result), "lodash");
  });

  it("should return name when overridePath is undefined", () => {
    const result: OverrideAnalysisResult = {
      name: "lodash",
      overridePath: undefined,
      overrideValue: "4.17.21",
      before: null,
      after: null,
      verdict: "redundant",
      reason: "test",
    };

    assert.strictEqual(getOverrideDisplayName(result), "lodash");
  });

  it("should return name when overridePath is empty", () => {
    const result: OverrideAnalysisResult = {
      name: "lodash",
      overridePath: [],
      overrideValue: "4.17.21",
      before: null,
      after: null,
      verdict: "redundant",
      reason: "test",
    };

    assert.strictEqual(getOverrideDisplayName(result), "lodash");
  });

  it("should return parent > child for single-level nesting", () => {
    const result: OverrideAnalysisResult = {
      name: "@example/core",
      overridePath: ["@example/eslint-plugin"],
      overrideValue: "$@example/core",
      before: null,
      after: null,
      verdict: "required",
      reason: "test",
    };

    assert.strictEqual(
      getOverrideDisplayName(result),
      "@example/eslint-plugin > @example/core",
    );
  });

  it("should return full path for deep nesting", () => {
    const result: OverrideAnalysisResult = {
      name: "baz",
      overridePath: ["foo", "bar"],
      overrideValue: "1.0.0",
      before: null,
      after: null,
      verdict: "redundant",
      reason: "test",
    };

    assert.strictEqual(getOverrideDisplayName(result), "foo > bar > baz");
  });
});
