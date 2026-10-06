import type { SafetyPolicy } from "../compare/resolutions.js";

export type OverrideVerdict = "redundant" | "required" | "unknown";

export interface OverrideAnalysisResult {
  /** Exact override key (which may include a selector or be "."). */
  name: string;
  /** Actual target package name. */
  packageName?: string;
  overridePath?: string[];
  overrideValue: string;
  before: string | null;
  after: string | null;
  verdict: OverrideVerdict;
  reason: string;
  cached?: boolean;
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
  unknown: number;
  results: OverrideAnalysisResult[];
  duration: number;
  resolver?: string;
  resolverVersion?: string;
  platform: string;
}

export interface AnalyzerOptions {
  cwd: string;
  include?: string[];
  exclude?: string[];
  verbose?: boolean;
  concurrency?: number;
  policy?: SafetyPolicy;
  cache?: boolean;
  signal?: AbortSignal;
}

export type { SafetyPolicy };
