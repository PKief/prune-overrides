import type { DependencyResolver, ResolvedGraph } from "../resolver/types.js";
import type { PackageJson } from "../fs/readPackageJson.js";
import type { OverrideRule } from "./overrideRule.js";
import type { OverrideAnalysisResult, SafetyPolicy } from "./types.js";
import { removeOverride } from "../fs/writePackageJson.js";
import { compareGraphs, graphVersions } from "../compare/graphs.js";
import { findMinVersion } from "../util/semver.js";
import { processInPool } from "../util/processInPool.js";

function removeRules(packageJson: PackageJson, rules: OverrideRule[]): PackageJson {
  return rules.reduce(
    (manifest, rule) => removeOverride(manifest, rule.key, rule.path),
    packageJson
  );
}

function result(
  rule: OverrideRule,
  before: ResolvedGraph,
  after: ResolvedGraph | undefined,
  verdict: OverrideAnalysisResult["verdict"],
  reason: string
): OverrideAnalysisResult {
  return {
    name: rule.key,
    packageName: rule.packageName,
    ...(rule.path.length ? { overridePath: rule.path } : {}),
    overrideValue: rule.value,
    before: findMinVersion(graphVersions(before, rule.packageName)),
    after: after ? findMinVersion(graphVersions(after, rule.packageName)) : null,
    verdict,
    reason,
  };
}

export async function analyzeWithResolver(
  resolver: DependencyResolver,
  cwd: string,
  packageJson: PackageJson,
  rules: OverrideRule[],
  policy: SafetyPolicy,
  concurrency: number
): Promise<OverrideAnalysisResult[]> {
  const baselineOutcome = await resolver.loadBaseline({ cwd });
  if (baselineOutcome.status !== "resolved" || !baselineOutcome.graph) {
    const reason =
      baselineOutcome.diagnostics[0]?.message ?? "Could not load baseline dependency graph";
    return rules.map((rule) => ({
      name: rule.key,
      packageName: rule.packageName,
      ...(rule.path.length ? { overridePath: rule.path } : {}),
      overrideValue: rule.value,
      before: null,
      after: null,
      verdict: "unknown",
      reason,
    }));
  }
  const baseline = baselineOutcome.graph;

  const batch = await resolver.resolve(removeRules(packageJson, rules), { cwd });
  if (batch.status === "resolved" && batch.graph) {
    const comparison = compareGraphs(
      baseline,
      batch.graph,
      rules.map((rule) => rule.packageName),
      policy
    );
    if (comparison.safe)
      return rules.map((rule) =>
        result(rule, baseline, batch.graph, "redundant", "Combined removal validated")
      );
  }

  const results = await processInPool(rules, concurrency, async (rule) => {
    const outcome = await resolver.resolve(removeRules(packageJson, [rule]), { cwd });
    if (outcome.status !== "resolved" || !outcome.graph) {
      const diagnostic = outcome.diagnostics[0];
      return result(
        rule,
        baseline,
        undefined,
        outcome.status === "conflict" ? "required" : "unknown",
        diagnostic?.message ?? "Resolution failed"
      );
    }
    const comparison = compareGraphs(baseline, outcome.graph, [rule.packageName], policy);
    return result(
      rule,
      baseline,
      outcome.graph,
      comparison.safe ? "redundant" : "required",
      comparison.reason
    );
  });

  const candidates = rules.filter((_, index) => results[index]?.verdict === "redundant");
  if (candidates.length > 1) {
    const combined = await resolver.resolve(removeRules(packageJson, candidates), { cwd });
    if (
      combined.status !== "resolved" ||
      !combined.graph ||
      !compareGraphs(
        baseline,
        combined.graph,
        candidates.map((rule) => rule.packageName),
        policy
      ).safe
    ) {
      for (const candidate of candidates) {
        const index = rules.indexOf(candidate);
        const current = results[index];
        if (current)
          results[index] = {
            ...current,
            verdict: "unknown",
            reason: "Individually safe but combined removal was not validated",
          };
      }
    }
  }
  return results;
}
