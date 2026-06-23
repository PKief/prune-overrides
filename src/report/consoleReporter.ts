import { styleText } from "node:util";
import type { AnalysisReport } from "../analyzer/types.js";
import { getOverrideDisplayName } from "../analyzer/types.js";

export function reportToConsole(report: AnalysisReport): void {
  console.log();
  console.log(styleText("bold", "Analysis Summary"));
  console.log("─".repeat(40));
  console.log(`  Total overrides:    ${String(report.total)}`);
  console.log(`  ${styleText("green", "Redundant:")}          ${String(report.redundant)}`);
  console.log(`  ${styleText("blue", "Required:")}           ${String(report.required)}`);
  console.log(`  Duration:           ${formatDuration(report.duration)}`);
  console.log();

  if (report.redundant > 0) {
    console.log(styleText(["bold", "yellow"], "Redundant overrides that can be removed:"));
    console.log();

    for (const result of report.results) {
      if (result.verdict === "redundant") {
        console.log(
          `  ${styleText("yellow", "•")} ${styleText("bold", getOverrideDisplayName(result))}`
        );
        console.log(`    Override: ${styleText("dim", result.overrideValue)}`);
        console.log(`    Reason:   ${styleText("dim", result.reason)}`);
        console.log();
      }
    }
  }

  if (report.required > 0 && report.redundant > 0) {
    console.log(styleText("bold", "Required overrides (keep these):"));
    console.log();

    for (const result of report.results) {
      if (result.verdict === "required") {
        console.log(
          `  ${styleText("blue", "•")} ${styleText("bold", getOverrideDisplayName(result))}`
        );
        console.log(`    Reason: ${styleText("dim", result.reason)}`);
        console.log();
      }
    }
  }

  if (report.redundant > 0) {
    console.log(
      styleText(
        "yellow",
        `Run with ${styleText("bold", "--fix")} to automatically remove ${String(report.redundant)} redundant override(s).`
      )
    );
  } else if (report.total > 0) {
    console.log(styleText("green", "All overrides are required. No cleanup needed."));
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${String(ms)}ms`;
  }
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}
