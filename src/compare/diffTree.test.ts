import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  diffLockfiles,
  filterDiffsByPackage,
  hasChangesForPackage,
} from "./diffTree.js";
import { type Lockfile } from "../fs/readLockfile.js";

describe("diffTree", () => {
  const createLockfile = (
    packages: Record<string, { version: string }>,
  ): Lockfile => ({
    lockfileVersion: 3,
    packages: {
      "": { version: "1.0.0" },
      ...packages,
    },
  });

  describe("diffLockfiles", () => {
    it("should detect added packages", () => {
      const before = createLockfile({});
      const after = createLockfile({
        "node_modules/lodash": { version: "4.17.21" },
      });

      const diffs = diffLockfiles(before, after);

      assert.strictEqual(diffs.length, 1);
      assert.deepStrictEqual(diffs[0], {
        packagePath: "node_modules/lodash",
        packageName: "lodash",
        beforeVersion: null,
        afterVersion: "4.17.21",
        change: "added",
      });
    });

    it("should detect removed packages", () => {
      const before = createLockfile({
        "node_modules/lodash": { version: "4.17.21" },
      });
      const after = createLockfile({});

      const diffs = diffLockfiles(before, after);

      assert.strictEqual(diffs.length, 1);
      assert.deepStrictEqual(diffs[0], {
        packagePath: "node_modules/lodash",
        packageName: "lodash",
        beforeVersion: "4.17.21",
        afterVersion: null,
        change: "removed",
      });
    });

    it("should detect changed packages", () => {
      const before = createLockfile({
        "node_modules/lodash": { version: "4.17.20" },
      });
      const after = createLockfile({
        "node_modules/lodash": { version: "4.17.21" },
      });

      const diffs = diffLockfiles(before, after);

      assert.strictEqual(diffs.length, 1);
      assert.deepStrictEqual(diffs[0], {
        packagePath: "node_modules/lodash",
        packageName: "lodash",
        beforeVersion: "4.17.20",
        afterVersion: "4.17.21",
        change: "changed",
      });
    });

    it("should not include unchanged packages", () => {
      const before = createLockfile({
        "node_modules/lodash": { version: "4.17.21" },
      });
      const after = createLockfile({
        "node_modules/lodash": { version: "4.17.21" },
      });

      const diffs = diffLockfiles(before, after);

      assert.strictEqual(diffs.length, 0);
    });

    it("should handle scoped packages", () => {
      const before = createLockfile({});
      const after = createLockfile({
        "node_modules/@types/node": { version: "18.0.0" },
      });

      const diffs = diffLockfiles(before, after);

      assert.strictEqual(diffs.length, 1);
      assert.strictEqual(diffs[0]?.packageName, "@types/node");
    });
  });

  describe("filterDiffsByPackage", () => {
    it("should filter diffs by package name", () => {
      const diffs = [
        {
          packagePath: "node_modules/lodash",
          packageName: "lodash",
          beforeVersion: "4.17.20",
          afterVersion: "4.17.21",
          change: "changed" as const,
        },
        {
          packagePath: "node_modules/foo",
          packageName: "foo",
          beforeVersion: null,
          afterVersion: "1.0.0",
          change: "added" as const,
        },
      ];

      const filtered = filterDiffsByPackage(diffs, "lodash");

      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0]?.packageName, "lodash");
    });
  });

  describe("hasChangesForPackage", () => {
    it("should return true when package has changes", () => {
      const diffs = [
        {
          packagePath: "node_modules/lodash",
          packageName: "lodash",
          beforeVersion: "4.17.20",
          afterVersion: "4.17.21",
          change: "changed" as const,
        },
      ];

      assert.strictEqual(hasChangesForPackage(diffs, "lodash"), true);
    });

    it("should return false when package has no changes", () => {
      const diffs = [
        {
          packagePath: "node_modules/foo",
          packageName: "foo",
          beforeVersion: null,
          afterVersion: "1.0.0",
          change: "added" as const,
        },
      ];

      assert.strictEqual(hasChangesForPackage(diffs, "lodash"), false);
    });
  });
});
