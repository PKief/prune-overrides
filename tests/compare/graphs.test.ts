import { compareGraphs } from "../../src/compare/graphs.js";
import type { ResolvedGraph, ResolvedNode } from "../../src/resolver/types.js";

const node = (id: string, name: string, version: string): ResolvedNode => ({
  id,
  name,
  version,
  dev: false,
  optional: false,
  peer: false,
  workspace: false,
});
const graph = (...nodes: ResolvedNode[]): ResolvedGraph => ({
  root: ".",
  nodes: new Map(nodes.map((value) => [value.id, value])),
  edges: [],
});

describe("compareGraphs", () => {
  it("allows harmless location changes in exact mode", () => {
    expect(
      compareGraphs(
        graph(node("node_modules/a/node_modules/x", "x", "1.0.0")),
        graph(node("node_modules/x", "x", "1.0.0")),
        ["x"],
        "exact"
      ).safe
    ).toBe(true);
  });

  it("checks dependency edges in full-tree mode", () => {
    const before = graph(node(".", "root", "1.0.0"), node("node_modules/x", "x", "1.0.0"));
    const after = graph(node(".", "root", "1.0.0"), node("node_modules/x", "x", "1.0.0"));
    before.edges.push({
      from: ".",
      to: "node_modules/x",
      name: "x",
      spec: "^1",
      type: "prod",
      valid: true,
    });
    expect(compareGraphs(before, after, ["x"], "full-tree").safe).toBe(false);
  });
});
