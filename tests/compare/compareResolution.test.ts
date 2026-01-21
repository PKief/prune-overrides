import {
  versionsMatch,
  overrideAffectsResolution,
  describeChange,
} from "../../src/compare/compareResolution.js";

describe("compareResolution", () => {
  describe("versionsMatch", () => {
    it("should return true when both versions are the same", () => {
      expect(versionsMatch("1.0.0", "1.0.0")).toBe(true);
    });

    it("should return false when versions differ", () => {
      expect(versionsMatch("1.0.0", "2.0.0")).toBe(false);
    });

    it("should return true when both are null", () => {
      expect(versionsMatch(null, null)).toBe(true);
    });

    it("should return false when only before is null", () => {
      expect(versionsMatch(null, "1.0.0")).toBe(false);
    });

    it("should return false when only after is null", () => {
      expect(versionsMatch("1.0.0", null)).toBe(false);
    });
  });

  describe("overrideAffectsResolution", () => {
    it("should return false when versions match", () => {
      expect(overrideAffectsResolution("1.0.0", "1.0.0")).toBe(false);
    });

    it("should return true when versions differ", () => {
      expect(overrideAffectsResolution("1.0.0", "2.0.0")).toBe(true);
    });

    it("should return true when package would be added", () => {
      expect(overrideAffectsResolution(null, "1.0.0")).toBe(true);
    });

    it("should return true when package would be removed", () => {
      expect(overrideAffectsResolution("1.0.0", null)).toBe(true);
    });
  });

  describe("describeChange", () => {
    it("should describe no change", () => {
      expect(describeChange("1.0.0", "1.0.0")).toBe("No change: 1.0.0");
    });

    it("should describe version change", () => {
      expect(describeChange("1.0.0", "2.0.0")).toBe("1.0.0 → 2.0.0");
    });

    it("should describe package not in tree", () => {
      expect(describeChange(null, null)).toBe("Package not in dependency tree");
    });

    it("should describe package addition", () => {
      expect(describeChange(null, "1.0.0")).toBe("Package would be added: 1.0.0");
    });

    it("should describe package removal", () => {
      expect(describeChange("1.0.0", null)).toBe("Package would be removed (was 1.0.0)");
    });
  });
});
