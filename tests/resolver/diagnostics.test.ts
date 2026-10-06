import { classifyResolverError } from "../../src/resolver/diagnostics.js";

describe("resolver diagnostics", () => {
  it("classifies dependency conflicts", () => {
    const error = Object.assign(new Error("unable to resolve dependency tree"), {
      code: "ERESOLVE",
    });
    expect(classifyResolverError(error)).toMatchObject({
      status: "conflict",
      diagnostics: [{ category: "conflict" }],
    });
  });

  it("classifies network failures as infrastructure errors", () => {
    const error = Object.assign(new Error("network unavailable"), { code: "ENOTFOUND" });
    expect(classifyResolverError(error)).toMatchObject({
      status: "infrastructure-error",
      diagnostics: [{ category: "network" }],
    });
  });
});
