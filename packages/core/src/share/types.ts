/**
 * Shared types for URL state encoding/decoding
 * Ultra-compact format: project name + package names grouped by verdict
 */

import type { OverrideAnalysisResult, AnalysisReport } from "../analyzer/types.js";

/**
 * Ultra-compact payload format (v3)
 * Format: [projectName, redundantNames[], requiredNames[]]
 *
 * Example: ["my-app", ["lodash", "axios"], ["react"]]
 * Means: in project "my-app", lodash & axios are redundant, react is required
 */
export type EncodedPayload = [string, string[], string[]];

/**
 * Legacy types for backwards compatibility
 */
export type CompactResult = [string, string, 0 | 1, number, string?, string?];
export type ShareableResult = CompactResult[];

/**
 * Verdict mapping for compact encoding
 */
export const VERDICT_TO_NUMBER = { redundant: 0, required: 1 } as const;
export const NUMBER_TO_VERDICT = { 0: "redundant", 1: "required" } as const;

/**
 * Extended report with project name for sharing
 */
export interface ShareableReport extends AnalysisReport {
  projectName?: string;
}

/**
 * Convert an AnalysisReport to ultra-compact EncodedPayload
 */
export function toShareableResult(report: ShareableReport): EncodedPayload {
  const redundant: string[] = [];
  const required: string[] = [];

  for (const result of report.results) {
    if (result.verdict === "redundant") {
      redundant.push(result.name);
    } else {
      required.push(result.name);
    }
  }

  return [report.projectName ?? "", redundant, required];
}

/**
 * Decoded result with project name
 */
export interface DecodedReport extends AnalysisReport {
  projectName: string;
}

/**
 * Convert ultra-compact EncodedPayload back to AnalysisReport
 */
export function fromShareableResult(payload: EncodedPayload): DecodedReport {
  const [projectName, redundant, required] = payload;

  const results: OverrideAnalysisResult[] = [
    ...redundant.map(
      (name): OverrideAnalysisResult => ({
        name,
        overrideValue: "",
        before: null,
        after: null,
        verdict: "redundant",
        reason: "Can be safely removed",
      })
    ),
    ...required.map(
      (name): OverrideAnalysisResult => ({
        name,
        overrideValue: "",
        before: null,
        after: null,
        verdict: "required",
        reason: "Still required",
      })
    ),
  ];

  return {
    projectName,
    total: results.length,
    redundant: redundant.length,
    required: required.length,
    results,
    duration: 0,
  };
}
