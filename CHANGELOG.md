# Changelog

## v0.1.7

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.6...v0.1.7)

### 🚀 Enhancements

- Update release workflow to amend commits and sync workspace versions ([3ec9f95](https://github.com/PKief/prune-overrides/commit/3ec9f95))

### 🏡 Chore

- Sync workspace versions to 0.1.6 ([253709e](https://github.com/PKief/prune-overrides/commit/253709e))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.6

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.5...v0.1.6)

### 🚀 Enhancements

- Add step to sync workspace package versions during release ([1852c83](https://github.com/PKief/prune-overrides/commit/1852c83))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.5

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.4...v0.1.5)

### 🩹 Fixes

- Specify workspace for npm publish in release workflow ([a538db5](https://github.com/PKief/prune-overrides/commit/a538db5))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.4

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.3...v0.1.4)

### 🚀 Enhancements

- Add ui to share results ([f133c3b](https://github.com/PKief/prune-overrides/commit/f133c3b))

### 🩹 Fixes

- Refine reason handling in fromPayloadV2 function ([6a0af66](https://github.com/PKief/prune-overrides/commit/6a0af66))
- Move build step to correct position in workflow ([2eb7e34](https://github.com/PKief/prune-overrides/commit/2eb7e34))
- Correct indentation in deploy job configuration ([ede4546](https://github.com/PKief/prune-overrides/commit/ede4546))
- Remove unnecessary environment configuration from deploy job ([11c6d88](https://github.com/PKief/prune-overrides/commit/11c6d88))
- Update build script to specify workspaces for individual packages ([21c8844](https://github.com/PKief/prune-overrides/commit/21c8844))
- Remove redundant tsc command from typecheck script ([0754013](https://github.com/PKief/prune-overrides/commit/0754013))

### 📖 Documentation

- Update architecture documentation with package details and shareable results encoding ([502d3a0](https://github.com/PKief/prune-overrides/commit/502d3a0))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.3

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.2...v0.1.3)

### 🏡 Chore

- Fix release pipeline ([f424e77](https://github.com/PKief/prune-overrides/commit/f424e77))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.2

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.1...v0.1.2)

### 🚀 Enhancements

- Add nanospinner for improved CLI feedback and implement spinner utility ([75016ea](https://github.com/PKief/prune-overrides/commit/75016ea))

### 🩹 Fixes

- **deps:** Bump commander from 12.1.0 to 14.0.2 ([#5](https://github.com/PKief/prune-overrides/pull/5))

### 📖 Documentation

- Update AGENTS.md and add patterns.md and recipes.md for improved documentation ([d8b63d9](https://github.com/PKief/prune-overrides/commit/d8b63d9))

### 🏡 Chore

- Update NPM registry authentication command ([524f2b4](https://github.com/PKief/prune-overrides/commit/524f2b4))
- Add dependabot configuration for npm updates ([fce2180](https://github.com/PKief/prune-overrides/commit/fce2180))
- **deps-dev:** Bump jest and @types/jest ([#3](https://github.com/PKief/prune-overrides/pull/3))
- **deps-dev:** Bump prettier from 3.8.0 to 3.8.1 ([#4](https://github.com/PKief/prune-overrides/pull/4))
- **deps-dev:** Bump lint-staged from 15.5.2 to 16.2.7 ([#7](https://github.com/PKief/prune-overrides/pull/7))
- **deps-dev:** Bump @types/node from 22.19.7 to 25.0.10 ([#8](https://github.com/PKief/prune-overrides/pull/8))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.1

### 🚀 Enhancements

- Add utility modules and constants ([5064167](https://github.com/PKief/prune-overrides/commit/5064167))
- Add filesystem utilities for package.json and lockfile ([8a4a191](https://github.com/PKief/prune-overrides/commit/8a4a191))
- Add npm command wrappers ([8f11133](https://github.com/PKief/prune-overrides/commit/8f11133))
- Add version comparison utilities ([cc04d7a](https://github.com/PKief/prune-overrides/commit/cc04d7a))
- Add override analyzer with full tree version checking ([9720f3e](https://github.com/PKief/prune-overrides/commit/9720f3e))
- Add console and JSON reporters ([a3049e2](https://github.com/PKief/prune-overrides/commit/a3049e2))
- Add CLI with commander.js ([8c852ae](https://github.com/PKief/prune-overrides/commit/8c852ae))

### 🩹 Fixes

- Add author name to package.json ([a1acc95](https://github.com/PKief/prune-overrides/commit/a1acc95))
- Correct package.json path resolution in CLI ([88bba65](https://github.com/PKief/prune-overrides/commit/88bba65))
- Add peer field to dependencies in package-lock.json ([55cadb6](https://github.com/PKief/prune-overrides/commit/55cadb6))

### 💅 Refactors

- Use official semver package for version comparison ([4a9c2e7](https://github.com/PKief/prune-overrides/commit/4a9c2e7))

### 📖 Documentation

- Add README with usage examples and documentation ([a503630](https://github.com/PKief/prune-overrides/commit/a503630))
- Improve README and add MIT LICENSE ([718c892](https://github.com/PKief/prune-overrides/commit/718c892))
- Add architecture documentation and AI agent instructions ([89081f2](https://github.com/PKief/prune-overrides/commit/89081f2))
- Remove future improvements section from architecture documentation ([87a06a1](https://github.com/PKief/prune-overrides/commit/87a06a1))
- Remove incorrect .npmrc limitation ([b9a7bac](https://github.com/PKief/prune-overrides/commit/b9a7bac))

### 🏡 Chore

- Initialize project with package.json and TypeScript config ([5c7564f](https://github.com/PKief/prune-overrides/commit/5c7564f))
- Add ESLint 9, Prettier, and Jest configuration ([fb22e12](https://github.com/PKief/prune-overrides/commit/fb22e12))
- Add package-lock.json ([54acea8](https://github.com/PKief/prune-overrides/commit/54acea8))
- Add husky and lint-staged for pre-commit hooks ([2bb792c](https://github.com/PKief/prune-overrides/commit/2bb792c))
- Remove Node.js setup steps from workflows and update NPM publish command ([d85e84d](https://github.com/PKief/prune-overrides/commit/d85e84d))
- Add meta information to package.json ([8a1ad82](https://github.com/PKief/prune-overrides/commit/8a1ad82))

### ✅ Tests

- Add unit tests for analyzer, compare, and semver utilities ([5b91121](https://github.com/PKief/prune-overrides/commit/5b91121))

### 🤖 CI

- Add GitHub Actions workflows and dependabot config ([43f3664](https://github.com/PKief/prune-overrides/commit/43f3664))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))
