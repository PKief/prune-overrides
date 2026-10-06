import semver from "semver";
import type { ResolvedGraph, ResolvedNode } from "../resolver/types.js";
import type { SafetyPolicy } from "./resolutions.js";
import type { SafetyResult } from "./resolutions.js";

function identity(node: ResolvedNode): string {
  return [
    node.name,
    node.version,
    node.resolved ?? "",
    node.integrity ?? "",
    node.dev,
    node.optional,
    node.peer,
    node.workspace,
  ].join("\0");
}

function nodesFor(graph: ResolvedGraph, name: string): ResolvedNode[] {
  return [...graph.nodes.values()].filter((node) => node.name === name);
}

function counts(nodes: ResolvedNode[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const node of nodes) result.set(identity(node), (result.get(identity(node)) ?? 0) + 1);
  return result;
}

function exactNodes(before: ResolvedNode[], after: ResolvedNode[]): boolean {
  const left = counts(before);
  const right = counts(after);
  return left.size === right.size && [...left].every(([key, value]) => right.get(key) === value);
}

function exactEdges(before: ResolvedGraph, after: ResolvedGraph): boolean {
  const serialize = (graph: ResolvedGraph): string[] =>
    graph.edges
      .map((edge) =>
        [edge.from, edge.to ?? "", edge.name, edge.spec, edge.type, edge.valid].join("\0")
      )
      .sort();
  const left = serialize(before);
  const right = serialize(after);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function compareGraphs(
  before: ResolvedGraph,
  after: ResolvedGraph,
  packageNames: string[],
  policy: SafetyPolicy
): SafetyResult {
  if (policy === "full-tree") {
    const allBefore = [...before.nodes.values()];
    const allAfter = [...after.nodes.values()];
    return exactNodes(allBefore, allAfter) && exactEdges(before, after)
      ? { safe: true, reason: "Entire logical dependency graph is unchanged" }
      : { safe: false, reason: "Logical dependency graph changes" };
  }

  for (const name of new Set(packageNames)) {
    const left = nodesFor(before, name);
    const right = nodesFor(after, name);
    if (left.length !== right.length)
      return { safe: false, reason: `${name}: package instance count changes` };
    if (policy === "exact") {
      if (!exactNodes(left, right))
        return { safe: false, reason: `${name}: versions, sources, or flags change` };
      continue;
    }
    const baseline = left.map((node) => semver.valid(node.version, { loose: true }));
    const candidate = right.map((node) => semver.valid(node.version, { loose: true }));
    if (baseline.some((version) => !version) || candidate.some((version) => !version)) {
      if (!exactNodes(left, right))
        return { safe: false, reason: `${name}: non-semver resolution changes` };
      continue;
    }
    const minimum = semver.minSatisfying(baseline as string[], ">=0.0.0-0", {
      loose: true,
      includePrerelease: true,
    });
    if (!minimum || right.some((node) => semver.lt(node.version, minimum, { loose: true }))) {
      return { safe: false, reason: `${name}: an older version is introduced` };
    }
  }
  return {
    safe: true,
    reason:
      policy === "exact" ? "Target resolutions are unchanged" : "No older versions are introduced",
  };
}

export function graphVersions(graph: ResolvedGraph, packageName: string): string[] {
  return [...new Set(nodesFor(graph, packageName).map((node) => node.version))];
}
