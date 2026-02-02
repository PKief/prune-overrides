import { type OverrideVerdict, type OverrideAnalysisResult } from "@prune-overrides/core";

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
});
