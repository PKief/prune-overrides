import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyNpmFailure } from "./npmFailure.js";
import { NpmError } from "../util/errors.js";

describe("classifyNpmFailure", () => {
  it("classifies genuine dependency conflicts", () => {
    assert.deepStrictEqual(
      classifyNpmFailure(
        new NpmError("failed", "npm install", "npm ERR! ERESOLVE"),
      ),
      {
        kind: "conflict",
        reason: "npm cannot resolve the dependency tree without this override",
      },
    );
  });

  for (const prefix of ["npm error", "npm ERR!"]) {
    it(`includes the missing package/version from ${prefix} ETARGET output`, () => {
      assert.deepStrictEqual(
        classifyNpmFailure(new NpmError("failed", "npm install", [
          `${prefix} code ETARGET`,
          `${prefix} notarget No matching version found for @tsconfig/node24@24.0.6.`,
          `${prefix} notarget In most cases you or one of your dependencies are requesting`,
        ].join("\n"))),
        {
          kind: "infrastructure",
          reason: "npm resolution failed: No matching version found for @tsconfig/node24@24.0.6.",
        },
      );
    });
  }

  it("explains ETARGET even when npm omits the package detail", () => {
    assert.deepStrictEqual(
      classifyNpmFailure(new NpmError("failed", "npm install", "npm error code ETARGET")),
      {
        kind: "infrastructure",
        reason: "npm resolution failed: ETARGET (requested package version is unavailable)",
      },
    );
  });

  it("does not classify authentication failures as required", () => {
    assert.deepStrictEqual(
      classifyNpmFailure(
        new NpmError("failed", "npm install", "npm ERR! code E401"),
      ),
      {
        kind: "infrastructure",
        reason: "npm resolution failed due to registry authentication",
      },
    );
  });
});
