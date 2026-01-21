/**
 * Verdict for an override analysis
 */
export type OverrideVerdict = "redundant" | "required";

/**
 * Result of analyzing a single override
 */
export interface OverrideAnalysisResult {
  /** The override key (package name) */
  name: string;
  /** The override value (version constraint) */
  overrideValue: string;
  /** Minimum resolved version with the override (across entire tree) */
  before: string | null;
  /** Minimum resolved version without the override (across entire tree) */
  after: string | null;
  /** Whether the override is redundant or required */
  verdict: OverrideVerdict;
  /** Reason for the verdict */
  reason: string;
}

/**
 * Overall analysis result
 */
export interface AnalysisReport {
  /** Total number of overrides analyzed */
  total: number;
  /** Number of redundant overrides */
  redundant: number;
  /** Number of required overrides */
  required: number;
  /** Individual results */
  results: OverrideAnalysisResult[];
  /** Analysis duration in milliseconds */
  duration: number;
}

/**
 * Options for the analyzer
 */
export interface AnalyzerOptions {
  /** Working directory containing package.json */
  cwd: string;
  /** Only analyze specific overrides */
  include?: string[];
  /** Exclude specific overrides from analysis */
  exclude?: string[];
  /** Enable verbose logging */
  verbose?: boolean;
}
