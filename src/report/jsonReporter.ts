import type { AnalysisReport } from "../analyzer/types.js";

/**
 * JSON output format
 */
export interface JsonReport {
  summary: {
    total: number;
    redundant: number;
    required: number;
    durationMs: number;
  };
  overrides: {
    name: string;
    value: string;
    verdict: "redundant" | "required";
    before: string | null;
    after: string | null;
    reason: string;
  }[];
}

/**
 * Convert analysis report to JSON format
 */
export function reportToJson(report: AnalysisReport): JsonReport {
  return {
    summary: {
      total: report.total,
      redundant: report.redundant,
      required: report.required,
      durationMs: report.duration,
    },
    overrides: report.results.map((result) => ({
      name: result.name,
      value: result.overrideValue,
      verdict: result.verdict,
      before: result.before,
      after: result.after,
      reason: result.reason,
    })),
  };
}

/**
 * Print JSON report to stdout
 */
export function printJsonReport(report: AnalysisReport): void {
  const jsonReport = reportToJson(report);
  console.log(JSON.stringify(jsonReport, null, 2));
}
