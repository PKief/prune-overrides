export type OverrideVerdict = "redundant" | "required";

export interface OverrideAnalysisResult {
  name: string;
  /** Parent chain for nested overrides (e.g., ["@sap/eslint-plugin-cds"] for a sub-entry) */
  overridePath?: string[];
  overrideValue: string;
  /** Minimum resolved version with the override (across entire tree) */
  before: string | null;
  /** Minimum resolved version without the override (across entire tree) */
  after: string | null;
  verdict: OverrideVerdict;
  reason: string;
}

export function getOverrideDisplayName(result: OverrideAnalysisResult): string {
  if (result.overridePath && result.overridePath.length > 0) {
    return [...result.overridePath, result.name].join(" > ");
  }
  return result.name;
}

export interface AnalysisReport {
  total: number;
  redundant: number;
  required: number;
  results: OverrideAnalysisResult[];
  /** Analysis duration in milliseconds */
  duration: number;
}

export interface AnalyzerOptions {
  cwd: string;
  include?: string[];
  exclude?: string[];
  verbose?: boolean;
  concurrency?: number;
}
