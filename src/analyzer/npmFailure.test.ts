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
