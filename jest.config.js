/** @type {import('jest').Config} */
const config = {
  projects: [
    {
      displayName: "cli",
      rootDir: "packages/cli",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/**/*.test.ts"],
      extensionsToTreatAsEsm: [".ts"],
      transform: {
        "^.+\\.tsx?$": [
          "@swc/jest",
          {
            jsc: {
              parser: {
                syntax: "typescript",
              },
              target: "es2022",
            },
            module: {
              type: "es6",
            },
          },
        ],
      },
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "^@prune-overrides/core$": "<rootDir>/../core/src/index.ts",
      },
      clearMocks: true,
      restoreMocks: true,
    },
  ],
  collectCoverageFrom: ["packages/*/src/**/*.ts", "!packages/*/src/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};

export default config;
