import { NpmError } from "../util/errors.js";

export type NpmFailureKind = "conflict" | "infrastructure";

export function classifyNpmFailure(error: unknown): {
  kind: NpmFailureKind;
  reason: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const stderr = error instanceof NpmError ? (error.stderr ?? "") : "";
  const text = `${message}\n${stderr}`;

  if (
    /\bERESOLVE\b|unable to resolve dependency tree|conflicting peer dependency/i.test(
      text,
    )
  ) {
    return {
      kind: "conflict",
      reason: "npm cannot resolve the dependency tree without this override",
    };
  }
  if (/\bE401\b|\bE403\b|unauthorized|forbidden|credential/i.test(text)) {
    return {
      kind: "infrastructure",
      reason: "npm resolution failed due to registry authentication",
    };
  }
  if (/\bETIMEDOUT\b|timeout|aborted?/i.test(text)) {
    return { kind: "infrastructure", reason: "npm resolution timed out" };
  }
  if (
    /\bENOTFOUND\b|\bECONN(?:RESET|REFUSED)\b|network|fetch failed/i.test(text)
  ) {
    return {
      kind: "infrastructure",
      reason: "npm resolution failed due to a network error",
    };
  }
  return {
    kind: "infrastructure",
    reason: `npm resolution failed: ${firstLine(stderr || message)}`,
  };
}

function firstLine(value: string): string {
  return (
    value
      .split("\n")
      .find((line) => line.trim().length > 0)
      ?.trim() ?? "unknown error"
  );
}
