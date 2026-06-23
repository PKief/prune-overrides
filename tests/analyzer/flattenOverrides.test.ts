import { flattenOverrides } from "../../src/analyzer/analyzeOverrides.js";

describe("flattenOverrides", () => {
  it("should flatten simple string overrides", () => {
    const overrides = {
      lodash: "4.17.21",
      react: "18.2.0",
    };

    const result = flattenOverrides(overrides);
    expect(result).toEqual([
      { key: "lodash", value: "4.17.21", path: [] },
      { key: "react", value: "18.2.0", path: [] },
    ]);
  });

  it("should flatten single-level nested overrides", () => {
    const overrides = {
      "@sap/eslint-plugin-cds": {
        "@sap/cds": "$@sap/cds",
      },
    };

    const result = flattenOverrides(overrides);
    expect(result).toEqual([
      { key: "@sap/cds", value: "$@sap/cds", path: ["@sap/eslint-plugin-cds"] },
    ]);
  });

  it("should flatten mixed simple and nested overrides", () => {
    const overrides = {
      lodash: "4.17.23",
      minimatch: "10.2.4",
      "@sap/eslint-plugin-cds": {
        "@sap/cds": "$@sap/cds",
      },
    };

    const result = flattenOverrides(overrides);
    expect(result).toEqual([
      { key: "lodash", value: "4.17.23", path: [] },
      { key: "minimatch", value: "10.2.4", path: [] },
      { key: "@sap/cds", value: "$@sap/cds", path: ["@sap/eslint-plugin-cds"] },
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
    expect(result).toEqual([{ key: "baz", value: "1.0.0", path: ["foo", "bar"] }]);
  });

  it("should flatten multiple entries within a nested override", () => {
    const overrides = {
      "@sap/eslint-plugin-cds": {
        "@sap/cds": "$@sap/cds",
        "other-pkg": "2.0.0",
      },
    };

    const result = flattenOverrides(overrides);
    expect(result).toEqual([
      { key: "@sap/cds", value: "$@sap/cds", path: ["@sap/eslint-plugin-cds"] },
      { key: "other-pkg", value: "2.0.0", path: ["@sap/eslint-plugin-cds"] },
    ]);
  });

  it("should handle empty overrides", () => {
    const result = flattenOverrides({});
    expect(result).toEqual([]);
  });

  it("should handle the user's exact example", () => {
    const overrides = {
      "@opentelemetry/semantic-conventions": "1.40.0",
      "@opentelemetry/otlp-transformer": "0.213.0",
      qs: "6.15.0",
      lodash: "4.17.23",
      minimatch: "10.2.4",
      "@sap/eslint-plugin-cds": {
        "@sap/cds": "$@sap/cds",
      },
    };

    const result = flattenOverrides(overrides);
    expect(result).toHaveLength(6);
    expect(result[5]).toEqual({
      key: "@sap/cds",
      value: "$@sap/cds",
      path: ["@sap/eslint-plugin-cds"],
    });
  });
});
