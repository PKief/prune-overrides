import type { DependencyResolver, ResolverName } from "./types.js";

export async function createResolver(name: ResolverName): Promise<DependencyResolver> {
  if (name === "arborist") {
    const { ArboristResolver } = await import("./arboristResolver.js");
    return new ArboristResolver();
  }
  const { NpmCliResolver } = await import("./npmCliResolver.js");
  return NpmCliResolver.create();
}
