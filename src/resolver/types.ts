import type { PackageJson } from "../fs/readPackageJson.js";

export type ResolverName = "npm" | "arborist";
export type ResolutionStatus = "resolved" | "conflict" | "infrastructure-error";
export type DependencyType = "prod" | "dev" | "optional" | "peer" | "peerOptional";

export interface ResolvedNode {
  id: string;
  name: string;
  version: string;
  resolved?: string;
  integrity?: string;
  dev: boolean;
  optional: boolean;
  peer: boolean;
  workspace: boolean;
}

export interface ResolvedEdge {
  from: string;
  to: string | null;
  name: string;
  spec: string;
  type: DependencyType;
  valid: boolean;
}

export interface ResolvedGraph {
  root: string;
  nodes: Map<string, ResolvedNode>;
  edges: ResolvedEdge[];
}

export interface ResolverDiagnostic {
  category: "conflict" | "network" | "authentication" | "timeout" | "configuration" | "internal";
  message: string;
  code?: string;
}

export interface ResolutionOutcome {
  status: ResolutionStatus;
  graph?: ResolvedGraph;
  diagnostics: ResolverDiagnostic[];
}

export interface ResolverOptions {
  cwd: string;
  signal?: AbortSignal;
}

export interface DependencyResolver {
  readonly name: ResolverName;
  readonly version: string;
  loadBaseline(options: ResolverOptions): Promise<ResolutionOutcome>;
  resolve(manifest: PackageJson, options: ResolverOptions): Promise<ResolutionOutcome>;
}
