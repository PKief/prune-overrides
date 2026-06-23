import { removeOverride } from "../../src/fs/writePackageJson.js";
import type { PackageJson } from "../../src/fs/readPackageJson.js";

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
      expect(result.overrides).toEqual({ react: "18.2.0" });
    });

    it("should remove overrides key when last override is removed", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          lodash: "4.17.21",
        },
      };

      const result = removeOverride(pkg, "lodash");
      expect(result.overrides).toBeUndefined();
    });

    it("should return unchanged if no overrides exist", () => {
      const pkg: PackageJson = { name: "test" };

      const result = removeOverride(pkg, "lodash");
      expect(result).toEqual({ name: "test" });
    });
  });

  describe("nested overrides", () => {
    it("should remove a nested sub-entry", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          "@sap/eslint-plugin-cds": {
            "@sap/cds": "$@sap/cds",
            "other-pkg": "1.0.0",
          },
        },
      };

      const result = removeOverride(pkg, "@sap/cds", ["@sap/eslint-plugin-cds"]);
      expect(result.overrides).toEqual({
        "@sap/eslint-plugin-cds": {
          "other-pkg": "1.0.0",
        },
      });
    });

    it("should remove parent key when last nested entry is removed", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          "@sap/eslint-plugin-cds": {
            "@sap/cds": "$@sap/cds",
          },
          lodash: "4.17.21",
        },
      };

      const result = removeOverride(pkg, "@sap/cds", ["@sap/eslint-plugin-cds"]);
      expect(result.overrides).toEqual({ lodash: "4.17.21" });
    });

    it("should remove overrides key when last nested entry in last parent is removed", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          "@sap/eslint-plugin-cds": {
            "@sap/cds": "$@sap/cds",
          },
        },
      };

      const result = removeOverride(pkg, "@sap/cds", ["@sap/eslint-plugin-cds"]);
      expect(result.overrides).toBeUndefined();
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
      expect(result.overrides).toEqual({
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
      expect(result.overrides).toBeUndefined();
    });

    it("should handle non-existent path gracefully", () => {
      const pkg: PackageJson = {
        name: "test",
        overrides: {
          lodash: "4.17.21",
        },
      };

      const result = removeOverride(pkg, "baz", ["nonexistent"]);
      expect(result.overrides).toEqual({ lodash: "4.17.21" });
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
      expect(result.overrides).toEqual({
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
      expect(pkg.overrides).toEqual({
        foo: {
          bar: "1.0.0",
          baz: "2.0.0",
        },
      });
    });
  });
});
