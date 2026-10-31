const sourceRoot = new URL("../src/", import.meta.url).href;

export function resolve(specifier, context, nextResolve) {
  if (
    specifier.startsWith(".") &&
    specifier.endsWith(".js") &&
    context.parentURL?.startsWith(sourceRoot)
  ) {
    const tsSpecifier = specifier.slice(0, -3) + ".ts";
    try {
      return nextResolve(tsSpecifier, context);
    } catch (error) {
      if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
    }
  }

  return nextResolve(specifier, context);
}
