import { compareLockfiles, indexResolutions } from "../../src/compare/resolutions.js";
import type { Lockfile } from "../../src/fs/readLockfile.js";

const lock = (packages: Lockfile["packages"]): Lockfile => ({ lockfileVersion: 3, packages });

describe("resolution safety", () => {
  it("indexes every nested instance", () => {
    const index = indexResolutions(
      lock({
        "node_modules/x": { version: "2.0.0" },
        "node_modules/a/node_modules/x": { version: "1.0.0" },
      })
    );
    expect(index.get("x")?.map((entry) => entry.version)).toEqual(["1.0.0", "2.0.0"]);
  });

  it("detects source changes with the same version", () => {
    const before = lock({ "node_modules/x": { version: "1.0.0", resolved: "https://a/x.tgz" } });
    const after = lock({ "node_modules/x": { version: "1.0.0", resolved: "https://b/x.tgz" } });
    expect(compareLockfiles(before, after, "x", "exact").safe).toBe(false);
  });

  it("rejects package disappearance", () => {
    expect(
      compareLockfiles(
        lock({ "node_modules/x": { version: "1.0.0" } }),
        lock({}),
        "x",
        "no-downgrade"
      ).safe
    ).toBe(false);
  });

  it("rejects non-semver changes under no-downgrade", () => {
    const before = lock({ "node_modules/x": { version: "git-a" } });
    const after = lock({ "node_modules/x": { version: "git-b" } });
    expect(compareLockfiles(before, after, "x", "no-downgrade").safe).toBe(false);
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
    expect(compareLockfiles(before, after, "x", "full-tree").safe).toBe(false);
  });
});
