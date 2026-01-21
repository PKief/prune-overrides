import {
  parseVersion,
  compareVersions,
  isOlderVersion,
  findMinVersion,
  findMaxVersion,
  wouldIntroduceOlderVersions,
  getOlderVersions,
} from "../../src/util/semver.js";

describe("semver utilities", () => {
  describe("parseVersion", () => {
    it("should parse simple version", () => {
      expect(parseVersion("1.2.3")).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "",
      });
    });

    it("should parse version with prerelease", () => {
      expect(parseVersion("1.2.3-beta.1")).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "beta.1",
      });
    });

    it("should return null for invalid version", () => {
      expect(parseVersion("invalid")).toBeNull();
      expect(parseVersion("1.2")).toBeNull();
    });
  });

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

    it("should handle prerelease versions", () => {
      // No prerelease > prerelease
      expect(compareVersions("1.0.0", "1.0.0-beta")).toBe(1);
      expect(compareVersions("1.0.0-beta", "1.0.0")).toBe(-1);
      // Compare prereleases alphabetically
      expect(compareVersions("1.0.0-alpha", "1.0.0-beta")).toBe(-1);
    });

    it("should handle real-world versions", () => {
      expect(compareVersions("1.28.0", "1.37.0")).toBe(-1);
      expect(compareVersions("1.37.0", "1.28.0")).toBe(1);
      expect(compareVersions("9.6.0", "9.12.0")).toBe(-1);
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
  });

  describe("findMaxVersion", () => {
    it("should find maximum version", () => {
      expect(findMaxVersion(["1.0.0", "2.0.0", "1.5.0"])).toBe("2.0.0");
      expect(findMaxVersion(["1.28.0", "1.30.0", "1.37.0"])).toBe("1.37.0");
    });

    it("should return null for empty array", () => {
      expect(findMaxVersion([])).toBeNull();
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
  });
});
