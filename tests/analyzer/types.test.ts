import {
  type OverrideVerdict,
  type OverrideAnalysisResult,
  getOverrideDisplayName,
} from "../../src/analyzer/types.js";

describe("analyzer types", () => {
  it("should allow valid verdict values", () => {
    const redundant: OverrideVerdict = "redundant";
    const required: OverrideVerdict = "required";

    expect(redundant).toBe("redundant");
    expect(required).toBe("required");
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

    expect(result.name).toBe("lodash");
    expect(result.verdict).toBe("required");
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

    expect(result.before).toBeNull();
    expect(result.after).toBeNull();
  });

  it("should allow overridePath for nested overrides", () => {
    const result: OverrideAnalysisResult = {
      name: "@sap/cds",
      overridePath: ["@sap/eslint-plugin-cds"],
      overrideValue: "$@sap/cds",
      before: "7.0.0",
      after: "6.0.0",
      verdict: "required",
      reason: "Would introduce older version(s)",
    };

    expect(result.overridePath).toEqual(["@sap/eslint-plugin-cds"]);
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

    expect(result.overridePath).toEqual(["foo", "bar"]);
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

    expect(getOverrideDisplayName(result)).toBe("lodash");
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

    expect(getOverrideDisplayName(result)).toBe("lodash");
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

    expect(getOverrideDisplayName(result)).toBe("lodash");
  });

  it("should return parent > child for single-level nesting", () => {
    const result: OverrideAnalysisResult = {
      name: "@sap/cds",
      overridePath: ["@sap/eslint-plugin-cds"],
      overrideValue: "$@sap/cds",
      before: null,
      after: null,
      verdict: "required",
      reason: "test",
    };

    expect(getOverrideDisplayName(result)).toBe("@sap/eslint-plugin-cds > @sap/cds");
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

    expect(getOverrideDisplayName(result)).toBe("foo > bar > baz");
  });
});
