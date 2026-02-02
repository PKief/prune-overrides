import pc from "picocolors";
import type { AnalysisReport } from "@prune-overrides/core";

/**
 * Format and print analysis results to console
 */
export function reportToConsole(report: AnalysisReport): void {
  console.log();
  console.log(pc.bold("Analysis Summary"));
  console.log("─".repeat(40));
  console.log(`  Total overrides:    ${String(report.total)}`);
  console.log(`  ${pc.green("Redundant:")}          ${String(report.redundant)}`);
  console.log(`  ${pc.blue("Required:")}           ${String(report.required)}`);
  console.log(`  Duration:           ${formatDuration(report.duration)}`);
  console.log();

  if (report.redundant > 0) {
    console.log(pc.bold(pc.yellow("Redundant overrides that can be removed:")));
    console.log();

    for (const result of report.results) {
      if (result.verdict === "redundant") {
        console.log(`  ${pc.yellow("•")} ${pc.bold(result.name)}`);
        console.log(`    Override: ${pc.dim(result.overrideValue)}`);
        console.log(`    Reason:   ${pc.dim(result.reason)}`);
        console.log();
      }
    }
  }

  if (report.required > 0 && report.redundant > 0) {
    console.log(pc.bold("Required overrides (keep these):"));
    console.log();

    for (const result of report.results) {
      if (result.verdict === "required") {
        console.log(`  ${pc.blue("•")} ${pc.bold(result.name)}`);
        console.log(`    Reason: ${pc.dim(result.reason)}`);
        console.log();
      }
    }
  }

  // Final message
  if (report.redundant > 0) {
    console.log(
      pc.yellow(
        `Run with ${pc.bold("--fix")} to automatically remove ${String(report.redundant)} redundant override(s).`
      )
    );
  } else if (report.total > 0) {
    console.log(pc.green("All overrides are required. No cleanup needed."));
  }
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${String(ms)}ms`;
  }
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}
