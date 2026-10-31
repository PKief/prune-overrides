import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reportToConsole } from "./consoleReporter.js";
import type { AnalysisReport } from "../analyzer/types.js";

describe("reportToConsole", () => {
  it("lists required overrides when all overrides are required", (t) => {
    const output = t.mock.method(console, "log", () => undefined);
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

    const text = output.mock.calls
      .flatMap(({ arguments: args }) => args)
      .join("\n");
    assert.ok(text.includes("Required overrides (keep these):"));
    assert.ok(text.includes("example"));
    assert.ok(text.includes("an older version is introduced"));
  });
});
