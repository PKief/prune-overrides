import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  versionsMatch,
  overrideAffectsResolution,
  describeChange,
} from "./compareResolution.js";

describe("compareResolution", () => {
  describe("versionsMatch", () => {
    it("should return true when both versions are the same", () => {
      assert.strictEqual(versionsMatch("1.0.0", "1.0.0"), true);
    });

    it("should return false when versions differ", () => {
      assert.strictEqual(versionsMatch("1.0.0", "2.0.0"), false);
    });

    it("should return true when both are null", () => {
      assert.strictEqual(versionsMatch(null, null), true);
    });

    it("should return false when only before is null", () => {
      assert.strictEqual(versionsMatch(null, "1.0.0"), false);
    });

    it("should return false when only after is null", () => {
      assert.strictEqual(versionsMatch("1.0.0", null), false);
    });
  });

  describe("overrideAffectsResolution", () => {
    it("should return false when versions match", () => {
      assert.strictEqual(overrideAffectsResolution("1.0.0", "1.0.0"), false);
    });

    it("should return true when versions differ", () => {
      assert.strictEqual(overrideAffectsResolution("1.0.0", "2.0.0"), true);
    });

    it("should return true when package would be added", () => {
      assert.strictEqual(overrideAffectsResolution(null, "1.0.0"), true);
    });

    it("should return true when package would be removed", () => {
      assert.strictEqual(overrideAffectsResolution("1.0.0", null), true);
    });
  });

  describe("describeChange", () => {
    it("should describe no change", () => {
      assert.strictEqual(describeChange("1.0.0", "1.0.0"), "No change: 1.0.0");
    });

    it("should describe version change", () => {
      assert.strictEqual(describeChange("1.0.0", "2.0.0"), "1.0.0 → 2.0.0");
    });

    it("should describe package not in tree", () => {
      assert.strictEqual(
        describeChange(null, null),
        "Package not in dependency tree",
      );
    });

    it("should describe package addition", () => {
      assert.strictEqual(
        describeChange(null, "1.0.0"),
        "Package would be added: 1.0.0",
      );
    });

    it("should describe package removal", () => {
      assert.strictEqual(
        describeChange("1.0.0", null),
        "Package would be removed (was 1.0.0)",
      );
    });
  });
});
