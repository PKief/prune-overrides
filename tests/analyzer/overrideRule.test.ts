import { flattenOverrideRules, parseOverridePackageName } from "../../src/analyzer/overrideRule.js";

describe("override rules", () => {
  test.each([
    ["foo", "foo"],
    ["foo@^2", "foo"],
    ["@scope/pkg", "@scope/pkg"],
    ["@scope/pkg@^2", "@scope/pkg"],
    [".", null],
  ])("parses %s", (input, expected) => expect(parseOverridePackageName(input)).toBe(expected));

  it("handles npm's dot key", () => {
    expect(flattenOverrideRules({ "foo@^2": { ".": "2.1.0", bar: "3.0.0" } })).toEqual([
      { key: ".", packageName: "foo", value: "2.1.0", path: ["foo@^2"] },
      { key: "bar", packageName: "bar", value: "3.0.0", path: ["foo@^2"] },
    ]);
  });
});
