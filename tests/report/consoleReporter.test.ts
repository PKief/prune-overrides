import { jest } from "@jest/globals";
import { reportToConsole } from "../../src/report/consoleReporter.js";
import type { AnalysisReport } from "../../src/analyzer/types.js";

describe("reportToConsole", () => {
  it("lists required overrides when all overrides are required", () => {
    const output = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const report: AnalysisReport = {
      total: 1,
      redundant: 0,
      required: 1,
      unknown: 0,
      duration: 10,
      platform: "test",
      results: [
        {
          name: "example",
          overrideValue: "1.0.0",
          before: "1.0.0",
          after: "0.9.0",
          verdict: "required",
          reason: "an older version is introduced",
        },
      ],
    };

    reportToConsole(report);

    expect(output.mock.calls.flat().join("\n")).toContain("Required overrides (keep these):");
    expect(output.mock.calls.flat().join("\n")).toContain("example");
    expect(output.mock.calls.flat().join("\n")).toContain("an older version is introduced");
  });
});
