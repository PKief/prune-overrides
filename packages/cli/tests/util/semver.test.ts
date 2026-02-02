import {
  compareVersions,
  isOlderVersion,
  findMinVersion,
  findMaxVersion,
  wouldIntroduceOlderVersions,
  getOlderVersions,
} from "@prune-overrides/core";

describe("semver utilities", () => {
  describe("compareVersions", () => {
    it("should return 0 for equal versions", () => {
      expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
      expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
    });

    it("should compare major versions", () => {
      expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
      expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
    });

    it("should compare minor versions", () => {
      expect(compareVersions("1.1.0", "1.2.0")).toBe(-1);
      expect(compareVersions("1.2.0", "1.1.0")).toBe(1);
    });

    it("should compare patch versions", () => {
      expect(compareVersions("1.0.1", "1.0.2")).toBe(-1);
      expect(compareVersions("1.0.2", "1.0.1")).toBe(1);
    });

    it("should handle prerelease versions correctly", () => {
      // No prerelease > prerelease
      expect(compareVersions("1.0.0", "1.0.0-beta")).toBe(1);
      expect(compareVersions("1.0.0-beta", "1.0.0")).toBe(-1);

      // Prerelease ordering
      expect(compareVersions("1.0.0-alpha", "1.0.0-beta")).toBe(-1);
      expect(compareVersions("1.0.0-beta", "1.0.0-alpha")).toBe(1);
    });

    it("should handle numeric prerelease identifiers correctly", () => {
      // This was a bug in our custom implementation!
      // alpha.10 > alpha.2 (numeric comparison)
      expect(compareVersions("1.0.0-alpha.2", "1.0.0-alpha.10")).toBe(-1);
      expect(compareVersions("1.0.0-alpha.10", "1.0.0-alpha.2")).toBe(1);
    });

    it("should handle build metadata (ignored in comparison)", () => {
      // Build metadata should be ignored for precedence
      expect(compareVersions("1.0.0+build1", "1.0.0+build2")).toBe(0);
      expect(compareVersions("1.0.0+build", "1.0.0")).toBe(0);
    });

    it("should handle real-world versions", () => {
      expect(compareVersions("1.28.0", "1.37.0")).toBe(-1);
      expect(compareVersions("1.37.0", "1.28.0")).toBe(1);
      expect(compareVersions("9.6.0", "9.12.0")).toBe(-1);
      expect(compareVersions("0.57.2", "0.206.0")).toBe(-1);
    });

    it("should handle versions with v prefix (loose mode)", () => {
      expect(compareVersions("v1.0.0", "1.0.0")).toBe(0);
      expect(compareVersions("v1.0.0", "v2.0.0")).toBe(-1);
    });

    it("should fall back to string comparison for invalid versions", () => {
      // These aren't valid semver, but we should handle them gracefully
      expect(compareVersions("latest", "latest")).toBe(0);
      expect(compareVersions("abc", "def")).toBe(-1);
    });
  });

  describe("isOlderVersion", () => {
    it("should return true if a is older than b", () => {
      expect(isOlderVersion("1.0.0", "2.0.0")).toBe(true);
      expect(isOlderVersion("1.28.0", "1.37.0")).toBe(true);
    });

    it("should return false if a is not older than b", () => {
      expect(isOlderVersion("2.0.0", "1.0.0")).toBe(false);
      expect(isOlderVersion("1.0.0", "1.0.0")).toBe(false);
    });

    it("should handle prerelease versions", () => {
      expect(isOlderVersion("1.0.0-alpha", "1.0.0")).toBe(true);
      expect(isOlderVersion("1.0.0", "1.0.0-alpha")).toBe(false);
    });
  });

  describe("findMinVersion", () => {
    it("should find minimum version", () => {
      expect(findMinVersion(["1.0.0", "2.0.0", "1.5.0"])).toBe("1.0.0");
      expect(findMinVersion(["1.28.0", "1.30.0", "1.37.0"])).toBe("1.28.0");
    });

    it("should return null for empty array", () => {
      expect(findMinVersion([])).toBeNull();
    });

    it("should handle single version", () => {
      expect(findMinVersion(["1.0.0"])).toBe("1.0.0");
    });

    it("should handle prerelease versions", () => {
      expect(findMinVersion(["1.0.0", "1.0.0-beta", "1.0.0-alpha"])).toBe("1.0.0-alpha");
    });

    it("should handle numeric prerelease identifiers", () => {
      expect(findMinVersion(["1.0.0-alpha.10", "1.0.0-alpha.2", "1.0.0-alpha.1"])).toBe(
        "1.0.0-alpha.1"
      );
    });
  });

  describe("findMaxVersion", () => {
    it("should find maximum version", () => {
      expect(findMaxVersion(["1.0.0", "2.0.0", "1.5.0"])).toBe("2.0.0");
      expect(findMaxVersion(["1.28.0", "1.30.0", "1.37.0"])).toBe("1.37.0");
    });

    it("should return null for empty array", () => {
      expect(findMaxVersion([])).toBeNull();
    });

    it("should handle prerelease versions", () => {
      expect(findMaxVersion(["1.0.0", "1.0.0-beta", "1.0.0-alpha"])).toBe("1.0.0");
    });
  });

  describe("wouldIntroduceOlderVersions", () => {
    it("should return true when older versions would be introduced", () => {
      // Before: all at 1.37.0, After: includes 1.28.0
      expect(wouldIntroduceOlderVersions(["1.37.0"], ["1.37.0", "1.28.0", "1.30.0"])).toBe(true);
    });

    it("should return false when no older versions would be introduced", () => {
      // Before: 1.37.0, After: also 1.37.0
      expect(wouldIntroduceOlderVersions(["1.37.0"], ["1.37.0"])).toBe(false);

      // Before: 1.0.0, After: 1.0.0 and 2.0.0 (newer is fine)
      expect(wouldIntroduceOlderVersions(["1.0.0"], ["1.0.0", "2.0.0"])).toBe(false);
    });

    it("should handle empty arrays", () => {
      expect(wouldIntroduceOlderVersions([], ["1.0.0"])).toBe(false);
      expect(wouldIntroduceOlderVersions(["1.0.0"], [])).toBe(false);
    });

    it("should handle the opentelemetry case", () => {
      // This is the real-world case that was failing
      const before = ["1.37.0"]; // With override, all versions are 1.37.0
      const after = ["1.37.0", "1.28.0", "1.30.0"]; // Without override, older versions appear

      expect(wouldIntroduceOlderVersions(before, after)).toBe(true);
    });

    it("should handle prerelease versions", () => {
      // Introducing a prerelease when we had stable is a downgrade
      expect(wouldIntroduceOlderVersions(["1.0.0"], ["1.0.0-beta"])).toBe(true);
    });
  });

  describe("getOlderVersions", () => {
    it("should return versions older than reference", () => {
      expect(getOlderVersions(["1.28.0", "1.30.0", "1.37.0"], "1.37.0")).toEqual([
        "1.28.0",
        "1.30.0",
      ]);
    });

    it("should return empty array when no older versions", () => {
      expect(getOlderVersions(["1.37.0", "2.0.0"], "1.37.0")).toEqual([]);
    });

    it("should handle prerelease as older than stable", () => {
      expect(getOlderVersions(["1.0.0-alpha", "1.0.0-beta", "1.0.0"], "1.0.0")).toEqual([
        "1.0.0-alpha",
        "1.0.0-beta",
      ]);
    });
  });
});
