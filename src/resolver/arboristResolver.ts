import Arborist from "@npmcli/arborist";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PackageJson } from "../fs/readPackageJson.js";
import { createTempWorkspace } from "../fs/tempWorkspace.js";
import { writePackageJson } from "../fs/writePackageJson.js";
import { classifyResolverError } from "./diagnostics.js";
import type {
  DependencyResolver,
  ResolutionOutcome,
  ResolvedGraph,
  ResolverOptions,
} from "./types.js";

const ownPackageJson = JSON.parse(
  await readFile(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json"), "utf8")
) as { dependencies?: Record<string, string> };

export class ArboristResolver implements DependencyResolver {
  readonly name = "arborist" as const;
  readonly version = ownPackageJson.dependencies?.["@npmcli/arborist"] ?? "unknown";

  async loadBaseline(options: ResolverOptions): Promise<ResolutionOutcome> {
    try {
      const tree = await new Arborist({ path: options.cwd }).loadVirtual();
      return { status: "resolved", graph: graphFromTree(tree), diagnostics: [] };
    } catch (error) {
      return classifyResolverError(error);
    }
  }

  async resolve(manifest: PackageJson, options: ResolverOptions): Promise<ResolutionOutcome> {
    const workspace = await createTempWorkspace(options.cwd);
    try {
      await writePackageJson(workspace.path, manifest);
      try {
        const tree = await new Arborist({
          path: workspace.path,
          audit: false,
          ignoreScripts: true,
          packageLockOnly: true,
          workspacesEnabled: true,
        }).buildIdealTree();
        return { status: "resolved", graph: graphFromTree(tree), diagnostics: [] };
      } catch (error) {
        return classifyResolverError(error);
      }
    } finally {
      await workspace.cleanup();
    }
  }
}

export function graphFromTree(tree: Arborist.Node): ResolvedGraph {
  const nodes = new Map<string, ResolvedGraph["nodes"] extends Map<string, infer N> ? N : never>();
  const edges: ResolvedGraph["edges"] = [];
  for (const node of tree.inventory.values()) {
    const id = node.location || ".";
    nodes.set(id, {
      id,
      name: node.packageName,
      version: node.version,
      ...(node.resolved ? { resolved: node.resolved } : {}),
      ...(node.integrity ? { integrity: node.integrity } : {}),
      dev: node.dev,
      optional: node.optional,
      peer: node.peer,
      workspace: node.isWorkspace,
    });
    for (const edge of node.edgesOut.values()) {
      edges.push({
        from: id,
        to: edge.to ? edge.to.location || "." : null,
        name: edge.name,
        spec: edge.spec,
        type: edge.type,
        valid: edge.valid,
      });
    }
  }
  edges.sort((a, b) =>
    `${a.from}\0${a.name}\0${a.type}`.localeCompare(`${b.from}\0${b.name}\0${b.type}`)
  );
  return { root: ".", nodes, edges };
}
