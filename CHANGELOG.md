# Changelog

## v0.3.1

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.3.0...v0.3.1)

### Fixes

- Validate override removals with fresh resolutions ([015f5331](https://github.com/PKief/prune-overrides/commit/015f5331766cd16c527f4396273b6721d6abdc99))

### Refactors

- Split docs styles into nested CSS modules ([b18a1bb3](https://github.com/PKief/prune-overrides/commit/b18a1bb385934863e90b05029a01c22e28f3e61d))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.3.0

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.2.2...v0.3.0)

### Enhancements

- Add arborist resolver and safety policies ([d3c00c01](https://github.com/PKief/prune-overrides/commit/d3c00c0145bc112f8f9728c8f06ddd6fe784ccf7))

### Fixes

- Adjust README.md ([88a50fab](https://github.com/PKief/prune-overrides/commit/88a50fab31bfd490d77368807e76d94264b0ec8d))
- Update changelog ([002c25b0](https://github.com/PKief/prune-overrides/commit/002c25b067f758da123ca40e9054f726545c0be8))

### Refactors

- Modernize npm CLI integration and improve abort signal handling ([35675f4e](https://github.com/PKief/prune-overrides/commit/35675f4e7889dd056f2c94e48225462661920ee1))
- Simplify CLI, tooling, tests and docs ([9182f270](https://github.com/PKief/prune-overrides/commit/9182f270cb66a62b7f591358cabd80fbe37e34f3))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.2.2

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.2.1...v0.2.2)

### Enhancements

- Remove unused web ui ([5e75b240](https://github.com/PKief/prune-overrides/commit/5e75b2402532193bdf063d440197277cb53d6bd6))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.2.1

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.9...v0.2.1)

### Enhancements

- Support nested overrides and concurrent analysis ([9d6df50c](https://github.com/PKief/prune-overrides/commit/9d6df50c830adffb86d08fe0a5816973e44181cc))

### Performance

- Eliminate redundant I/O in parallel override analysis ([e99d4fe4](https://github.com/PKief/prune-overrides/commit/e99d4fe4165c269d8315c39b598bd7e99034b4cf))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.9

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.8...v0.1.9)

### Enhancements

- Refactor share module and CLI utilities ([162a9101](https://github.com/PKief/prune-overrides/commit/162a91011b037e3a5873da1fcdd4822992de897c))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.8

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.7...v0.1.8)

### Enhancements

- Add README and LICENSE to CLI package and update NPM publish step ([308415b9](https://github.com/PKief/prune-overrides/commit/308415b9e3a218409951f5c8867b10f9489bce97))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.7

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.6...v0.1.7)

### Enhancements

- Update release workflow to amend commits and sync workspace versions ([43d6fb7c](https://github.com/PKief/prune-overrides/commit/43d6fb7c6e48ae6993f74a84e999317d1831918f))

### Chores

- Sync workspace versions to 0.1.6 ([99650053](https://github.com/PKief/prune-overrides/commit/996500533404cbb0a9de7231b394b20730f37591))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))
- github-actions\[bot\] ([@github-actions\[bot\]](https://github.com/apps/github-actions))

## v0.1.6

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.5...v0.1.6)

### Enhancements

- Add step to sync workspace package versions during release ([2390f26b](https://github.com/PKief/prune-overrides/commit/2390f26b00430958e5d3f5f410acd382e7ceac7c))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.5

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.4...v0.1.5)

### Fixes

- Specify workspace for npm publish in release workflow ([5b0f2dd4](https://github.com/PKief/prune-overrides/commit/5b0f2dd4e2acf2e1a9bf7588af88d79287f0f1f8))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.4

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.3...v0.1.4)

### Enhancements

- Add ui to share results ([116b5fb5](https://github.com/PKief/prune-overrides/commit/116b5fb51001bc9217f2d13b7524f63fd09ff558))

### Fixes

- Refine reason handling in fromPayloadV2 function ([01e8590b](https://github.com/PKief/prune-overrides/commit/01e8590b73c4b745e9037b5ae77e752352c35dac))
- Move build step to correct position in workflow ([77618e2b](https://github.com/PKief/prune-overrides/commit/77618e2b59702b9d86aca1d67b7ab4da6126f412))
- Correct indentation in deploy job configuration ([acb48001](https://github.com/PKief/prune-overrides/commit/acb480015f640d8680e4896228970fa51244b824))
- Remove unnecessary environment configuration from deploy job ([bbc0b04d](https://github.com/PKief/prune-overrides/commit/bbc0b04d05ddd93cf06cc9b952fcc8fc36836f5a))
- Update build script to specify workspaces for individual packages ([d54986eb](https://github.com/PKief/prune-overrides/commit/d54986ebc436e3e5da72a533850001d78274920e))
- Remove redundant tsc command from typecheck script ([21c817c2](https://github.com/PKief/prune-overrides/commit/21c817c2661f76f8967df254b6e0220420347847))

### Documentation

- Update architecture documentation with package details and shareable results encoding ([f0c86645](https://github.com/PKief/prune-overrides/commit/f0c86645c6823806b4f6289dea4199dbb75f3c1f))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.3

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.2...v0.1.3)

### Chores

- Fix release pipeline ([75d63aee](https://github.com/PKief/prune-overrides/commit/75d63aee71f4de782e42dc86238f54b66c492c36))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v0.1.2

[compare changes](https://github.com/PKief/prune-overrides/compare/v0.1.1...v0.1.2)

### Enhancements

- Add nanospinner for improved CLI feedback and implement spinner utility ([59073797](https://github.com/PKief/prune-overrides/commit/590737970376d80024972f54a3e8b9bdb9b98276))

### Fixes

- **deps:** Bump commander from 12.1.0 to 14.0.2 ([#5](https://github.com/PKief/prune-overrides/pull/5))

### Documentation

- Update AGENTS.md and add patterns.md and recipes.md for improved documentation ([e2e2414a](https://github.com/PKief/prune-overrides/commit/e2e2414a31ed16f169ef0475bf58bf9a2aa654be))

### Chores

- Update NPM registry authentication command ([9f3d71eb](https://github.com/PKief/prune-overrides/commit/9f3d71eb68c16d5ad77608333b1d80a6cc9ca8e4))
- Add dependabot configuration for npm updates ([42152fd5](https://github.com/PKief/prune-overrides/commit/42152fd5e0bf016d7b2f6c23ce805b81561e15f4))
- **deps:** Bump actions/checkout from 4.2.2 to 6.0.1 ([#2](https://github.com/PKief/prune-overrides/pull/2))
- **deps-dev:** Bump jest and @types/jest ([#3](https://github.com/PKief/prune-overrides/pull/3))
- **deps-dev:** Bump prettier from 3.8.0 to 3.8.1 ([#4](https://github.com/PKief/prune-overrides/pull/4))
- **deps-dev:** Bump lint-staged from 15.5.2 to 16.2.7 ([#7](https://github.com/PKief/prune-overrides/pull/7))
- **deps-dev:** Bump @types/node from 22.19.7 to 25.0.10 ([#8](https://github.com/PKief/prune-overrides/pull/8))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))
- dependabot\[bot\] ([@dependabot\[bot\]](https://github.com/apps/dependabot))

## v0.1.1

### Enhancements

- Add utility modules and constants ([623fac7b](https://github.com/PKief/prune-overrides/commit/623fac7b9e0884188792a15e5cdcdfa4441cdf0d))
- Add filesystem utilities for package.json and lockfile ([8f56a174](https://github.com/PKief/prune-overrides/commit/8f56a174f1697d77fe1570fa50bcb526071c61d9))
- Add npm command wrappers ([a4d405d1](https://github.com/PKief/prune-overrides/commit/a4d405d1002bdfa51dc0e62365394571c54d5482))
- Add version comparison utilities ([97e98000](https://github.com/PKief/prune-overrides/commit/97e980009cd7da8e8b766e4d47ccfd027a322409))
- Add override analyzer with full tree version checking ([5637a779](https://github.com/PKief/prune-overrides/commit/5637a7793188eb3bce655a0128dc804f85dba561))
- Add console and JSON reporters ([668b56dc](https://github.com/PKief/prune-overrides/commit/668b56dce649df4121e388fd1ccc7cb4ee94b8c7))
- Add CLI with commander.js ([faf769d0](https://github.com/PKief/prune-overrides/commit/faf769d0a2a6557f4381303b32f25e0cbe3cb35f))

### Fixes

- Add author name to package.json ([f2ac61b5](https://github.com/PKief/prune-overrides/commit/f2ac61b595e60ba46295c7840bc09e8841f82ab7))
- Correct package.json path resolution in CLI ([e5d324d5](https://github.com/PKief/prune-overrides/commit/e5d324d5035e03ab4a2f105c46e4dcdf17a43dbf))
- Add peer field to dependencies in package-lock.json ([fcc4c35f](https://github.com/PKief/prune-overrides/commit/fcc4c35fb34a789ad48248bf4c9c69455b9b87af))

### Documentation

- Add README with usage examples and documentation ([f18456b8](https://github.com/PKief/prune-overrides/commit/f18456b85aad678110c331e92b81b2386d912532))
- Improve README and add MIT LICENSE ([7a3953b2](https://github.com/PKief/prune-overrides/commit/7a3953b24ad225a5f131ccec0b7787611898dde6))
- Add architecture documentation and AI agent instructions ([9cd7f767](https://github.com/PKief/prune-overrides/commit/9cd7f767c3039cd798ef26c55f2c4c036bb15181))
- Remove future improvements section from architecture documentation ([3a5bbf52](https://github.com/PKief/prune-overrides/commit/3a5bbf52445dc5bfcd4cb058c8f94e03a0ab7e18))
- Remove incorrect .npmrc limitation ([7f3ea142](https://github.com/PKief/prune-overrides/commit/7f3ea14276a51a9304361855a7871e80b0f6a2cc))

### Refactors

- Use official semver package for version comparison ([556ee303](https://github.com/PKief/prune-overrides/commit/556ee30383eca1172eebec29b3aeffbe33d67798))

### Tests

- Add unit tests for analyzer, compare, and semver utilities ([7de25e13](https://github.com/PKief/prune-overrides/commit/7de25e13ec5368e315a041432bccf020144e0772))

### CI

- Add GitHub Actions workflows and dependabot config ([75bad508](https://github.com/PKief/prune-overrides/commit/75bad508f435083f4f913c4a3e342a824ef6fa53))

### Chores

- Initialize project with package.json and TypeScript config ([5cbe1b60](https://github.com/PKief/prune-overrides/commit/5cbe1b607c93453ec12745e8bcd39993b03dc391))
- Add ESLint 9, Prettier, and Jest configuration ([147f5bfa](https://github.com/PKief/prune-overrides/commit/147f5bfa0be70252712521c19e29d9cd561fcc33))
- Add package-lock.json ([6fd5f1db](https://github.com/PKief/prune-overrides/commit/6fd5f1db5500c49c4ce658d7aee0344b6634d4c7))
- Add husky and lint-staged for pre-commit hooks ([f1c68bc8](https://github.com/PKief/prune-overrides/commit/f1c68bc884fec7d39ae48cbca788235800bc0cec))
- Remove Node.js setup steps from workflows and update NPM publish command ([ef23a9c6](https://github.com/PKief/prune-overrides/commit/ef23a9c60776be99aadd0bdee0aa4605c6b62d7a))
- Add meta information to package.json ([98bae858](https://github.com/PKief/prune-overrides/commit/98bae8584a0e127c862125f5c71be1413b36c0c3))

### Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))
