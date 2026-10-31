import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  flattenOverrideRules,
  parseOverridePackageName,
} from "./overrideRule.js";

describe("override rules", () => {
  for (const [input, expected] of [
    ["foo", "foo"],
    ["foo@^2", "foo"],
    ["@scope/pkg", "@scope/pkg"],
    ["@scope/pkg@^2", "@scope/pkg"],
    [".", null],
  ] as const) {
    it(`parses ${input}`, () =>
      assert.strictEqual(parseOverridePackageName(input), expected));
  }

  it("handles npm's dot key", () => {
    assert.deepStrictEqual(
      flattenOverrideRules({ "foo@^2": { ".": "2.1.0", bar: "3.0.0" } }),
      [
        { key: ".", packageName: "foo", value: "2.1.0", path: ["foo@^2"] },
        { key: "bar", packageName: "bar", value: "3.0.0", path: ["foo@^2"] },
      ],
    );
  });
});

const flattenOverrides = (
  overrides: Parameters<typeof flattenOverrideRules>[0],
) =>
  flattenOverrideRules(overrides).map(({ key, value, path }) => ({
    key,
    value,
    path,
  }));

describe("flattenOverrideRules", () => {
  it("should flatten simple string overrides", () => {
    const overrides = {
      lodash: "4.17.21",
      react: "18.2.0",
    };

    const result = flattenOverrides(overrides);
    assert.deepStrictEqual(result, [
      { key: "lodash", value: "4.17.21", path: [] },
      { key: "react", value: "18.2.0", path: [] },
    ]);
  });

  it("should flatten single-level nested overrides", () => {
    const overrides = {
      "@example/eslint-plugin": {
        "@example/core": "$@example/core",
      },
    };

    const result = flattenOverrides(overrides);
    assert.deepStrictEqual(result, [
      {
        key: "@example/core",
        value: "$@example/core",
        path: ["@example/eslint-plugin"],
      },
    ]);
  });

  it("should flatten mixed simple and nested overrides", () => {
    const overrides = {
      lodash: "4.17.23",
      minimatch: "10.2.4",
      "@example/eslint-plugin": {
        "@example/core": "$@example/core",
      },
    };

    const result = flattenOverrides(overrides);
    assert.deepStrictEqual(result, [
      { key: "lodash", value: "4.17.23", path: [] },
      { key: "minimatch", value: "10.2.4", path: [] },
      {
        key: "@example/core",
        value: "$@example/core",
        path: ["@example/eslint-plugin"],
      },
    ]);
  });

  it("should flatten deeply nested overrides", () => {
    const overrides = {
      foo: {
        bar: {
          baz: "1.0.0",
        },
      },
    };

    const result = flattenOverrides(overrides);
    assert.deepStrictEqual(result, [
      { key: "baz", value: "1.0.0", path: ["foo", "bar"] },
    ]);
  });

  it("should flatten multiple entries within a nested override", () => {
    const overrides = {
      "@example/eslint-plugin": {
        "@example/core": "$@example/core",
        "other-pkg": "2.0.0",
      },
    };

    const result = flattenOverrides(overrides);
    assert.deepStrictEqual(result, [
      {
        key: "@example/core",
        value: "$@example/core",
        path: ["@example/eslint-plugin"],
      },
      { key: "other-pkg", value: "2.0.0", path: ["@example/eslint-plugin"] },
    ]);
  });

  it("should handle empty overrides", () => {
    const result = flattenOverrides({});
    assert.deepStrictEqual(result, []);
  });

  it("should handle the user's exact example", () => {
    const overrides = {
      "@opentelemetry/semantic-conventions": "1.40.0",
      "@opentelemetry/otlp-transformer": "0.213.0",
      qs: "6.15.0",
      lodash: "4.17.23",
      minimatch: "10.2.4",
      "@example/eslint-plugin": {
        "@example/core": "$@example/core",
      },
    };

    const result = flattenOverrides(overrides);
    assert.strictEqual(result.length, 6);
    assert.deepStrictEqual(result[5], {
      key: "@example/core",
      value: "$@example/core",
      path: ["@example/eslint-plugin"],
    });
  });
});
