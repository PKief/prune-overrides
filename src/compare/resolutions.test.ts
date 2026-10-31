import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareLockfiles, indexResolutions } from "./resolutions.js";
import type { Lockfile } from "../fs/readLockfile.js";

const lock = (packages: Lockfile["packages"]): Lockfile => ({
  lockfileVersion: 3,
  packages,
});

describe("resolution safety", () => {
  it("indexes every nested instance", () => {
    const index = indexResolutions(
      lock({
        "node_modules/x": { version: "2.0.0" },
        "node_modules/a/node_modules/x": { version: "1.0.0" },
      }),
    );
    assert.deepStrictEqual(
      index.get("x")?.map((entry) => entry.version),
      ["1.0.0", "2.0.0"],
    );
  });

  it("detects source changes with the same version", () => {
    const before = lock({
      "node_modules/x": { version: "1.0.0", resolved: "https://a/x.tgz" },
    });
    const after = lock({
      "node_modules/x": { version: "1.0.0", resolved: "https://b/x.tgz" },
    });
    assert.strictEqual(
      compareLockfiles(before, after, "x", "exact").safe,
      false,
    );
  });

  it("rejects package disappearance", () => {
    assert.strictEqual(
      compareLockfiles(
        lock({ "node_modules/x": { version: "1.0.0" } }),
        lock({}),
        "x",
        "no-downgrade",
      ).safe,
      false,
    );
  });

  it("allows additional instances when none are older", () => {
    const before = lock({ "node_modules/x": { version: "2.0.0" } });
    const after = lock({
      "node_modules/x": { version: "2.0.0" },
      "node_modules/a/node_modules/x": { version: "3.0.0" },
    });
    assert.deepStrictEqual(
      compareLockfiles(before, after, "x", "no-downgrade"),
      {
        safe: true,
        reason:
          "npm resolves no older versions without the override: 2.0.0, 3.0.0",
      },
    );
  });

  it("rejects a newly introduced version older than the highest baseline version", () => {
    const before = lock({
      "node_modules/x": { version: "2.0.0" },
      "node_modules/b/node_modules/x": { version: "1.0.0" },
    });
    const after = lock({
      "node_modules/x": { version: "2.0.0" },
      "node_modules/b/node_modules/x": { version: "1.0.0" },
      "node_modules/a/node_modules/x": { version: "1.5.0" },
    });
    assert.deepStrictEqual(
      compareLockfiles(before, after, "x", "no-downgrade"),
      {
        safe: false,
        reason: "Removing the override introduces older versions: 1.5.0",
      },
    );
  });

  it("rejects an older nested instance", () => {
    const before = lock({ "node_modules/x": { version: "2.0.0" } });
    const after = lock({
      "node_modules/x": { version: "2.0.0" },
      "node_modules/a/node_modules/x": { version: "1.5.0" },
    });
    assert.deepStrictEqual(
      compareLockfiles(before, after, "x", "no-downgrade"),
      {
        safe: false,
        reason: "Removing the override introduces older versions: 1.5.0",
      },
    );
  });

  it("rejects non-semver changes under no-downgrade", () => {
    const before = lock({ "node_modules/x": { version: "git-a" } });
    const after = lock({ "node_modules/x": { version: "git-b" } });
    assert.strictEqual(
      compareLockfiles(before, after, "x", "no-downgrade").safe,
      false,
    );
  });

  it("checks unrelated packages under full-tree", () => {
    const before = lock({
      "node_modules/x": { version: "1.0.0" },
      "node_modules/y": { version: "1.0.0" },
    });
    const after = lock({
      "node_modules/x": { version: "1.0.0" },
      "node_modules/y": { version: "2.0.0" },
    });
    assert.strictEqual(
      compareLockfiles(before, after, "x", "full-tree").safe,
      false,
    );
  });
});
