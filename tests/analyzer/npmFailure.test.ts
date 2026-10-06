import { classifyNpmFailure } from "../../src/analyzer/npmFailure.js";
import { NpmError } from "../../src/util/errors.js";

describe("classifyNpmFailure", () => {
  it("classifies genuine dependency conflicts", () => {
    expect(classifyNpmFailure(new NpmError("failed", "npm install", "npm ERR! ERESOLVE"))).toEqual({
      kind: "conflict",
      reason: "npm cannot resolve the dependency tree without this override",
    });
  });

  it("does not classify authentication failures as required", () => {
    expect(classifyNpmFailure(new NpmError("failed", "npm install", "npm ERR! code E401"))).toEqual(
      {
        kind: "infrastructure",
        reason: "npm resolution failed due to registry authentication",
      }
    );
  });
});
