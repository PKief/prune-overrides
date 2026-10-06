import type { ResolutionOutcome, ResolverDiagnostic } from "./types.js";

interface CodedError extends Error {
  code?: string;
}

export function classifyResolverError(error: unknown): ResolutionOutcome {
  const value: CodedError = error instanceof Error ? error : new Error(String(error));
  const code = value.code;
  const text = `${code ?? ""} ${value.message}`.toLowerCase();
  let category: ResolverDiagnostic["category"] = "internal";
  let status: ResolutionOutcome["status"] = "infrastructure-error";

  if (/eresolve|edeps|peer dep|conflict/.test(text)) {
    category = "conflict";
    status = "conflict";
  } else if (/e401|e403|unauth|forbidden|credential/.test(text)) {
    category = "authentication";
  } else if (/timeout|etimedout|abort/.test(text)) {
    category = "timeout";
  } else if (/enotfound|econn|network|fetch|registry/.test(text)) {
    category = "network";
  } else if (/config|npmrc|certificate|ssl/.test(text)) {
    category = "configuration";
  }

  return {
    status,
    diagnostics: [{ category, message: value.message, ...(code ? { code } : {}) }],
  };
}
