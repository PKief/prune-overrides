import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { removeOverride } from "./writePackageJson.js";
import type { PackageJson } from "./readPackageJson.js";

describe("removeOverride", () => {
  describe("simple overrides", () => {
    it("should remove a top-level override", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          lodash: "4.17.21",
          react: "18.2.0",
        },
      };

      const result = removeOverride(pkg, "lodash");
      assert.deepStrictEqual(result.overrides, { react: "18.2.0" });
    });

    it("should remove overrides key when last override is removed", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          lodash: "4.17.21",
        },
      };

      const result = removeOverride(pkg, "lodash");
      assert.strictEqual(result.overrides, undefined);
    });

    it("should return unchanged if no overrides exist", () => {
      const pkg: PackageJson = { name: "test" };

      const result = removeOverride(pkg, "lodash");
      assert.deepStrictEqual(result, { name: "test" });
    });
  });

  describe("nested overrides", () => {
    it("should remove a nested sub-entry", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          "@example/eslint-plugin": {
            "@example/core": "$@example/core",
            "other-pkg": "1.0.0",
          },
        },
      };

      const result = removeOverride(pkg, "@example/core", [
        "@example/eslint-plugin",
      ]);
      assert.deepStrictEqual(result.overrides, {
        "@example/eslint-plugin": {
          "other-pkg": "1.0.0",
        },
      });
    });

    it("should remove parent key when last nested entry is removed", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          "@example/eslint-plugin": {
            "@example/core": "$@example/core",
          },
          lodash: "4.17.21",
        },
      };

      const result = removeOverride(pkg, "@example/core", [
        "@example/eslint-plugin",
      ]);
      assert.deepStrictEqual(result.overrides, { lodash: "4.17.21" });
    });

    it("should remove overrides key when last nested entry in last parent is removed", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          "@example/eslint-plugin": {
            "@example/core": "$@example/core",
          },
        },
      };

      const result = removeOverride(pkg, "@example/core", [
        "@example/eslint-plugin",
      ]);
      assert.strictEqual(result.overrides, undefined);
    });

    it("should handle deep nesting (2 levels)", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          foo: {
            bar: {
              baz: "1.0.0",
              qux: "2.0.0",
            },
          },
        },
      };

      const result = removeOverride(pkg, "baz", ["foo", "bar"]);
      assert.deepStrictEqual(result.overrides, {
        foo: {
          bar: {
            qux: "2.0.0",
          },
        },
      });
    });

    it("should clean up all empty parents in deep nesting", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          foo: {
            bar: {
              baz: "1.0.0",
            },
          },
        },
      };

      const result = removeOverride(pkg, "baz", ["foo", "bar"]);
      assert.strictEqual(result.overrides, undefined);
    });

    it("should handle non-existent path gracefully", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          lodash: "4.17.21",
        },
      };

      const result = removeOverride(pkg, "baz", ["nonexistent"]);
      assert.deepStrictEqual(result.overrides, { lodash: "4.17.21" });
    });

    it("should handle non-existent leaf key gracefully", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          foo: {
            bar: "1.0.0",
          },
        },
      };

      const result = removeOverride(pkg, "nonexistent", ["foo"]);
      assert.deepStrictEqual(result.overrides, {
        foo: {
          bar: "1.0.0",
        },
      });
    });

    it("should not mutate the original package.json", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          foo: {
            bar: "1.0.0",
            baz: "2.0.0",
          },
        },
      };

      removeOverride(pkg, "bar", ["foo"]);
      assert.deepStrictEqual(pkg.overrides, {
        foo: {
          bar: "1.0.0",
          baz: "2.0.0",
        },
      });
    });
  });
});
