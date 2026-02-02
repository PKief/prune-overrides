import { useState, useEffect } from "react";
import LZString from "lz-string";

export type OverrideVerdict = "redundant" | "required";

export interface OverrideAnalysisResult {
  name: string;
  overrideValue: string;
  before: string | null;
  after: string | null;
  verdict: OverrideVerdict;
  reason: string;
}

export interface AnalysisReport {
  projectName: string;
  total: number;
  redundant: number;
  required: number;
  results: OverrideAnalysisResult[];
  duration: number;
}

/**
 * v4 format: [projectName, redundantNames[], requiredNames[]]
 */
type EncodedPayloadV4 = [string, string[], string[]];

/**
 * v3 format: [redundantNames[], requiredNames[]]
 */
type EncodedPayloadV3 = [string[], string[]];

/**
 * v2 format: [customReasons | null, results[]]
 */
type CompactResultV2 = [string, string, 0 | 1, number, string?, string?];
type EncodedPayloadV2 = [Record<number, string> | null, CompactResultV2[]];

/**
 * v1 format: object with t, x, q, s, d
 */
interface CompactResultV1 {
  n: string;
  o: string;
  b?: string;
  a?: string;
  v: 0 | 1;
  r: string;
}
interface ShareableResultV1 {
  t: number;
  x: number;
  q: number;
  s: CompactResultV1[];
  d: number;
}

const NUMBER_TO_VERDICT: Record<0 | 1, OverrideVerdict> = {
  0: "redundant",
  1: "required",
};

const CODE_TO_REASON: Partial<Record<number, string>> = {
  0: "Package not found in dependency tree",
  1: "Override matches resolved version",
  2: "Override is still required",
  3: "Override prevents older version",
  4: "Override changes resolved version",
};

function buildReport(projectName: string, redundant: string[], required: string[]): AnalysisReport {
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

function fromPayloadV4(payload: EncodedPayloadV4): AnalysisReport {
  const [projectName, redundant, required] = payload;
  return buildReport(projectName, redundant, required);
}

function fromPayloadV3(payload: EncodedPayloadV3): AnalysisReport {
  const [redundant, required] = payload;
  return buildReport("", redundant, required);
}

function fromPayloadV2(payload: EncodedPayloadV2): AnalysisReport {
  const [customReasons, results] = payload;
  const ctx = customReasons ?? {};

  const fullResults = results.map(([name, overrideValue, verdict, reasonCode, before, after]) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const reason =
      CODE_TO_REASON[reasonCode] ?? ctx[reasonCode] ?? `Unknown reason (${String(reasonCode)})`;
    return {
      name,
      overrideValue,
      before: before ?? null,
      after: after ?? null,
      verdict: NUMBER_TO_VERDICT[verdict],
      reason,
    };
  });

  return {
    projectName: "",
    total: fullResults.length,
    redundant: fullResults.filter((r) => r.verdict === "redundant").length,
    required: fullResults.filter((r) => r.verdict === "required").length,
    results: fullResults,
    duration: 0,
  };
}

function fromShareableResultV1(shareable: ShareableResultV1): AnalysisReport {
  return {
    projectName: "",
    total: shareable.t,
    redundant: shareable.x,
    required: shareable.q,
    results: shareable.s.map((c) => ({
      name: c.n,
      overrideValue: c.o,
      before: c.b ?? null,
      after: c.a ?? null,
      verdict: NUMBER_TO_VERDICT[c.v],
      reason: c.r,
    })),
    duration: shareable.d,
  };
}

function decodePayload(data: unknown): AnalysisReport {
  if (!Array.isArray(data)) {
    if (data && typeof data === "object" && "t" in data && "s" in data) {
      return fromShareableResultV1(data as ShareableResultV1);
    }
    throw new Error("Unknown data format");
  }

  // v4: [projectName, redundant[], required[]] - first is string
  if (
    data.length === 3 &&
    typeof data[0] === "string" &&
    Array.isArray(data[1]) &&
    Array.isArray(data[2])
  ) {
    return fromPayloadV4(data as EncodedPayloadV4);
  }

  // v3: [redundant[], required[]] - both arrays of strings
  if (
    data.length === 2 &&
    Array.isArray(data[0]) &&
    Array.isArray(data[1]) &&
    (data[0].length === 0 || typeof data[0][0] === "string") &&
    (data[1].length === 0 || typeof data[1][0] === "string")
  ) {
    return fromPayloadV3(data as EncodedPayloadV3);
  }

  // v2: [customReasons | null, results[]]
  if (
    data.length === 2 &&
    (data[0] === null || typeof data[0] === "object") &&
    Array.isArray(data[1])
  ) {
    return fromPayloadV2(data as EncodedPayloadV2);
  }

  throw new Error("Unknown data format");
}

export interface UrlState {
  report: AnalysisReport | null;
  error: string | null;
  loading: boolean;
}

export function useUrlState(): UrlState {
  const [state, setState] = useState<UrlState>({
    report: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get("d");

      if (!encoded) {
        setState({ report: null, error: null, loading: false });
        return;
      }

      const json = LZString.decompressFromEncodedURIComponent(encoded);

      if (!json) {
        setState({
          report: null,
          error: "Failed to decompress data. The link may be corrupted.",
          loading: false,
        });
        return;
      }

      const data = JSON.parse(json) as unknown;
      const report = decodePayload(data);

      setState({ report, error: null, loading: false });
    } catch (err) {
      setState({
        report: null,
        error: err instanceof Error ? err.message : "Failed to parse URL data",
        loading: false,
      });
    }
  }, []);

  return state;
}
