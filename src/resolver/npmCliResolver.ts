import type { PackageJson } from "../fs/readPackageJson.js";
import { readLockfile } from "../fs/readLockfile.js";
import { createTempWorkspace } from "../fs/tempWorkspace.js";
import { writePackageJson } from "../fs/writePackageJson.js";
import { npmInstall, getNpmVersion } from "../npm/install.js";
import { indexResolutions } from "../compare/resolutions.js";
import { classifyResolverError } from "./diagnostics.js";
import type {
  DependencyResolver,
  ResolutionOutcome,
  ResolvedGraph,
  ResolverOptions,
} from "./types.js";

export class NpmCliResolver implements DependencyResolver {
  readonly name = "npm" as const;
  readonly version: string;

  private constructor(version: string) {
    this.version = version;
  }

  static async create(): Promise<NpmCliResolver> {
    return new NpmCliResolver(await getNpmVersion());
  }

  async loadBaseline(options: ResolverOptions): Promise<ResolutionOutcome> {
    try {
      return {
        status: "resolved",
        graph: graphFromLockfile(await readLockfile(options.cwd)),
        diagnostics: [],
      };
    } catch (error) {
      return classifyResolverError(error);
    }
  }

  async resolve(manifest: PackageJson, options: ResolverOptions): Promise<ResolutionOutcome> {
    const workspace = await createTempWorkspace(options.cwd);
    try {
      await writePackageJson(workspace.path, manifest);
      await npmInstall({ cwd: workspace.path });
      return {
        status: "resolved",
        graph: graphFromLockfile(await readLockfile(workspace.path)),
        diagnostics: [],
      };
    } catch (error) {
      return classifyResolverError(error);
    } finally {
      await workspace.cleanup();
    }
  }
}

function graphFromLockfile(lockfile: Awaited<ReturnType<typeof readLockfile>>): ResolvedGraph {
  const nodes: ResolvedGraph["nodes"] = new Map();
  nodes.set(".", {
    id: ".",
    name: lockfile.name ?? "",
    version: lockfile.version ?? "",
    dev: false,
    optional: false,
    peer: false,
    workspace: false,
  });
  for (const resolutions of indexResolutions(lockfile).values()) {
    for (const item of resolutions) {
      const pkg = lockfile.packages[item.path];
      if (!pkg) continue;
      nodes.set(item.path, {
        id: item.path,
        name: item.name,
        version: item.version,
        ...(item.resolved ? { resolved: item.resolved } : {}),
        ...(item.integrity ? { integrity: item.integrity } : {}),
        dev: pkg.dev === true,
        optional: pkg.optional === true,
        peer: pkg.peer === true,
        workspace: Boolean(pkg.link),
      });
    }
  }
  return { root: ".", nodes, edges: [] };
}
