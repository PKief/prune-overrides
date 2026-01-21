# AI Agent Instructions

This document provides guidance for AI agents working on the prune-overrides codebase.

## Quick Start

1. **Read the architecture first**: [docs/architecture.md](./docs/architecture.md)
2. **Understand the core algorithm**: The tool analyzes npm overrides by testing removal in isolated temp workspaces
3. **Key principle**: Never mark an override as redundant if removing it would introduce ANY older version anywhere in the dependency tree

## Project Overview

prune-overrides is a CLI tool that:

- Analyzes npm `overrides` in package.json
- Determines if each override is still needed
- Can automatically remove redundant overrides with `--fix`

## Critical Design Decisions

### 1. Full Tree Version Checking

**DO NOT** only check root-level package versions. The tool must check ALL versions across the entire dependency tree.

```typescript
// WRONG - only checks root
const beforeVersion = getResolvedVersion(lockfile, pkg);
const afterVersion = getResolvedVersion(newLockfile, pkg);

// CORRECT - checks all versions in tree
const beforeVersions = getAllResolvedVersions(lockfile, pkg);
const afterVersions = getAllResolvedVersions(newLockfile, pkg);
```

This was a critical bug that caused the tool to incorrectly mark overrides as redundant when nested dependencies would revert to older versions.

### 2. Conservative Verdicts

An override should only be marked **redundant** if we are 100% certain removing it is safe:

- Same versions resolve with and without override
- OR all versions are equal/newer without override

When in doubt, mark as **required**.

### 3. Isolated Testing

All analysis happens in temporary workspaces:

- Copy package.json and package-lock.json to temp dir
- Modify temp package.json (remove override)
- Run `npm install --package-lock-only`
- Compare lockfiles
- Clean up temp dir

**Never** modify the user's actual project during analysis.

## Code Organization

```
src/
├── analyzer/     # Core logic - START HERE for algorithm changes
├── cli/          # Command-line interface
├── compare/      # Version comparison utilities
├── config/       # Constants and configuration
├── fs/           # File system operations
├── npm/          # npm command wrappers
├── report/       # Output formatting
└── util/         # Shared utilities (exec, logger, errors, semver)
```

## Key Files

| File                               | Purpose                                          |
| ---------------------------------- | ------------------------------------------------ |
| `src/analyzer/analyzeSingle.ts`    | Core algorithm for analyzing one override        |
| `src/analyzer/analyzeOverrides.ts` | Orchestrates analysis of all overrides           |
| `src/fs/readLockfile.ts`           | Extracts versions from package-lock.json         |
| `src/util/semver.ts`               | Version comparison using official semver package |
| `src/cli/run.ts`                   | Main CLI execution and fix mode                  |

## Common Tasks

### Adding a New CLI Option

1. Add option in `src/cli/options.ts` (both Command setup and CliOptions interface)
2. Handle option in `src/cli/run.ts`
3. Update README.md with new option

### Modifying the Analysis Algorithm

1. Make changes in `src/analyzer/analyzeSingle.ts`
2. Add tests in `tests/analyzer/`
3. Test manually with `--verbose` flag on a real project
4. Update architecture docs if behavior changes

### Adding a New Error Type

1. Add error class in `src/util/errors.ts`
2. Export from `src/index.ts`
3. Use in relevant module

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/util/semver.test.ts

# Run with coverage
npm run test:coverage

# Manual testing with verbose output
node dist/bin/prune-overrides.js --verbose --cwd /path/to/project
```

## Important Patterns

### Error Handling

Use custom error classes from `src/util/errors.ts`:

```typescript
import { PackageJsonError } from "../util/errors.js";

if (!packageJson.overrides) {
  throw new PackageJsonError("No overrides found");
}
```

### Logging

Use the logger from `src/util/logger.ts`:

```typescript
import { logger } from "../util/logger.js";

logger.debug("Detailed info"); // Only shown with --verbose
logger.info("Normal output");
logger.success("✓ Something worked");
logger.warn("⚠ Warning");
logger.error("✗ Error");
```

### Child Process Execution

Always use `src/util/exec.ts`, never call child_process directly:

```typescript
import { exec, execSafe } from "../util/exec.js";

// Throws on failure
const result = await exec("npm ls", { cwd: "/path" });

// Returns success: false on failure
const result = await execSafe("npm ls", { cwd: "/path" });
```

## Gotchas

1. **ESM imports need .js extension** - Even for .ts files, use `.js` in imports
2. **package.json path in CLI** - Located at `../../../package.json` from `dist/src/cli/`
3. **Lockfile format** - We only support lockfileVersion 2+ (npm 7+)
4. **Semver edge cases** - Use the official `semver` package, not custom parsing

## Before Submitting Changes

1. Run `npm run lint` - Must pass with no errors
2. Run `npm test` - All tests must pass
3. Run `npm run typecheck` - No TypeScript errors
4. Test manually on a real project with overrides
5. Update documentation if behavior changes

## References

- [Architecture Documentation](./docs/architecture.md)
- [npm overrides documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides)
- [semver package](https://www.npmjs.com/package/semver)
