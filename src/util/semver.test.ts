import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareVersions,
  isOlderVersion,
  findMinVersion,
  findMaxVersion,
  wouldIntroduceOlderVersions,
  getOlderVersions,
} from "./semver.js";

describe("semver utilities", () => {
  describe("compareVersions", () => {
    it("should return 0 for equal versions", () => {
      assert.strictEqual(compareVersions("1.0.0", "1.0.0"), 0);
      assert.strictEqual(compareVersions("1.2.3", "1.2.3"), 0);
    });

    it("should compare major versions", () => {
      assert.strictEqual(compareVersions("1.0.0", "2.0.0"), -1);
      assert.strictEqual(compareVersions("2.0.0", "1.0.0"), 1);
    });

    it("should compare minor versions", () => {
      assert.strictEqual(compareVersions("1.1.0", "1.2.0"), -1);
      assert.strictEqual(compareVersions("1.2.0", "1.1.0"), 1);
    });

    it("should compare patch versions", () => {
      assert.strictEqual(compareVersions("1.0.1", "1.0.2"), -1);
      assert.strictEqual(compareVersions("1.0.2", "1.0.1"), 1);
    });

    it("should handle prerelease versions correctly", () => {
      // No prerelease > prerelease
      assert.strictEqual(compareVersions("1.0.0", "1.0.0-beta"), 1);
      assert.strictEqual(compareVersions("1.0.0-beta", "1.0.0"), -1);

      // Prerelease ordering
      assert.strictEqual(compareVersions("1.0.0-alpha", "1.0.0-beta"), -1);
      assert.strictEqual(compareVersions("1.0.0-beta", "1.0.0-alpha"), 1);
    });

    it("should handle numeric prerelease identifiers correctly", () => {
      // This was a bug in our custom implementation!
      // alpha.10 > alpha.2 (numeric comparison)
      assert.strictEqual(
        compareVersions("1.0.0-alpha.2", "1.0.0-alpha.10"),
        -1,
      );
      assert.strictEqual(compareVersions("1.0.0-alpha.10", "1.0.0-alpha.2"), 1);
    });

    it("should handle build metadata (ignored in comparison)", () => {
      // Build metadata should be ignored for precedence
      assert.strictEqual(compareVersions("1.0.0+build1", "1.0.0+build2"), 0);
      assert.strictEqual(compareVersions("1.0.0+build", "1.0.0"), 0);
    });

    it("should handle real-world versions", () => {
      assert.strictEqual(compareVersions("1.28.0", "1.37.0"), -1);
      assert.strictEqual(compareVersions("1.37.0", "1.28.0"), 1);
      assert.strictEqual(compareVersions("9.6.0", "9.12.0"), -1);
      assert.strictEqual(compareVersions("0.57.2", "0.206.0"), -1);
    });

    it("should handle versions with v prefix (loose mode)", () => {
      assert.strictEqual(compareVersions("v1.0.0", "1.0.0"), 0);
      assert.strictEqual(compareVersions("v1.0.0", "v2.0.0"), -1);
    });

    it("should fall back to string comparison for invalid versions", () => {
      // These aren't valid semver, but we should handle them gracefully
      assert.strictEqual(compareVersions("latest", "latest"), 0);
      assert.strictEqual(compareVersions("abc", "def"), -1);
    });
  });

  describe("isOlderVersion", () => {
    it("should return true if a is older than b", () => {
      assert.strictEqual(isOlderVersion("1.0.0", "2.0.0"), true);
      assert.strictEqual(isOlderVersion("1.28.0", "1.37.0"), true);
    });

    it("should return false if a is not older than b", () => {
      assert.strictEqual(isOlderVersion("2.0.0", "1.0.0"), false);
      assert.strictEqual(isOlderVersion("1.0.0", "1.0.0"), false);
    });

    it("should handle prerelease versions", () => {
      assert.strictEqual(isOlderVersion("1.0.0-alpha", "1.0.0"), true);
      assert.strictEqual(isOlderVersion("1.0.0", "1.0.0-alpha"), false);
    });
  });

  describe("findMinVersion", () => {
    it("should find minimum version", () => {
      assert.strictEqual(findMinVersion(["1.0.0", "2.0.0", "1.5.0"]), "1.0.0");
      assert.strictEqual(
        findMinVersion(["1.28.0", "1.30.0", "1.37.0"]),
        "1.28.0",
      );
    });

    it("should return null for empty array", () => {
      assert.strictEqual(findMinVersion([]), null);
    });

    it("should handle single version", () => {
      assert.strictEqual(findMinVersion(["1.0.0"]), "1.0.0");
    });

    it("should handle prerelease versions", () => {
      assert.strictEqual(
        findMinVersion(["1.0.0", "1.0.0-beta", "1.0.0-alpha"]),
        "1.0.0-alpha",
      );
    });

    it("should handle numeric prerelease identifiers", () => {
      assert.strictEqual(
        findMinVersion(["1.0.0-alpha.10", "1.0.0-alpha.2", "1.0.0-alpha.1"]),
        "1.0.0-alpha.1",
      );
    });
  });

  describe("findMaxVersion", () => {
    it("should find maximum version", () => {
      assert.strictEqual(findMaxVersion(["1.0.0", "2.0.0", "1.5.0"]), "2.0.0");
      assert.strictEqual(
        findMaxVersion(["1.28.0", "1.30.0", "1.37.0"]),
        "1.37.0",
      );
    });

    it("should return null for empty array", () => {
      assert.strictEqual(findMaxVersion([]), null);
    });

    it("should handle prerelease versions", () => {
      assert.strictEqual(
        findMaxVersion(["1.0.0", "1.0.0-beta", "1.0.0-alpha"]),
        "1.0.0",
      );
    });
  });

  describe("wouldIntroduceOlderVersions", () => {
    it("should return true when older versions would be introduced", () => {
      // Before: all at 1.37.0, After: includes 1.28.0
      assert.strictEqual(
        wouldIntroduceOlderVersions(["1.37.0"], ["1.37.0", "1.28.0", "1.30.0"]),
        true,
      );
    });

    it("should return false when no older versions would be introduced", () => {
      // Before: 1.37.0, After: also 1.37.0
      assert.strictEqual(
        wouldIntroduceOlderVersions(["1.37.0"], ["1.37.0"]),
        false,
      );

      // Before: 1.0.0, After: 1.0.0 and 2.0.0 (newer is fine)
      assert.strictEqual(
        wouldIntroduceOlderVersions(["1.0.0"], ["1.0.0", "2.0.0"]),
        false,
      );
    });

    it("should handle empty arrays", () => {
      assert.strictEqual(wouldIntroduceOlderVersions([], ["1.0.0"]), false);
      assert.strictEqual(wouldIntroduceOlderVersions(["1.0.0"], []), false);
    });

    it("should handle the opentelemetry case", () => {
      // This is the real-world case that was failing
      const before = ["1.37.0"]; // With override, all versions are 1.37.0
      const after = ["1.37.0", "1.28.0", "1.30.0"]; // Without override, older versions appear

      assert.strictEqual(wouldIntroduceOlderVersions(before, after), true);
    });

    it("should handle prerelease versions", () => {
      // Introducing a prerelease when we had stable is a downgrade
      assert.strictEqual(
        wouldIntroduceOlderVersions(["1.0.0"], ["1.0.0-beta"]),
        true,
      );
    });
  });

  describe("getOlderVersions", () => {
    it("should return versions older than reference", () => {
      assert.deepStrictEqual(
        getOlderVersions(["1.28.0", "1.30.0", "1.37.0"], "1.37.0"),
        ["1.28.0", "1.30.0"],
      );
    });

    it("should return empty array when no older versions", () => {
      assert.deepStrictEqual(
        getOlderVersions(["1.37.0", "2.0.0"], "1.37.0"),
        [],
      );
    });

    it("should handle prerelease as older than stable", () => {
      assert.deepStrictEqual(
        getOlderVersions(["1.0.0-alpha", "1.0.0-beta", "1.0.0"], "1.0.0"),
        ["1.0.0-alpha", "1.0.0-beta"],
      );
    });
  });
});
