import {
  diffLockfiles,
  filterDiffsByPackage,
  hasChangesForPackage,
} from "../../src/compare/diffTree.js";
import { type Lockfile } from "../../src/fs/readLockfile.js";

describe("diffTree", () => {
  const createLockfile = (packages: Record<string, { version: string }>): Lockfile => ({
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

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
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

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
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

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
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

      expect(diffs).toHaveLength(0);
    });

    it("should handle scoped packages", () => {
      const before = createLockfile({});
      const after = createLockfile({
        "node_modules/@types/node": { version: "18.0.0" },
      });

      const diffs = diffLockfiles(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]?.packageName).toBe("@types/node");
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

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.packageName).toBe("lodash");
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

      expect(hasChangesForPackage(diffs, "lodash")).toBe(true);
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

      expect(hasChangesForPackage(diffs, "lodash")).toBe(false);
    });
  });
});
