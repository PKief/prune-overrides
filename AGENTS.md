# AI Agent Instructions

CLI tool that analyzes npm `overrides` in package.json and determines which ones can be safely removed.

## Start Here

- [How It Works](./docs/architecture.html) - Algorithm and safety checks
- [Development](./docs/recipes.html) - Build, test, and maintain the project
- [Code Patterns](./docs/patterns.html) - Errors, logging, and subprocesses

## Critical Warning

**Always check ALL versions across the entire dependency tree, not just root-level packages.**

```typescript
// WRONG - only checks root
const beforeVersion = getResolvedVersion(lockfile, pkg);

// CORRECT - checks all versions in tree
const beforeVersions = getAllResolvedVersions(lockfile, pkg);
```

This was a critical bug that caused false "redundant" verdicts when nested dependencies would revert to older versions.

## Gotchas

1. **ESM imports need .js extension** - Even for .ts files, use `.js` in imports
2. **Lockfile format** - Only lockfileVersion 2+ supported (npm 7+)
3. **Semver** - Always use the official `semver` package, never custom parsing
