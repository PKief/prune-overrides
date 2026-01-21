# Architecture

This document describes the architecture, design decisions, and implementation details of **prune-overrides**.

## Overview

prune-overrides is a CLI tool that analyzes npm `overrides` entries and determines whether they are still required or can be safely removed. It uses a safe, isolated approach to test each override without affecting the user's actual project.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI (bin/)                              │
│                    commander.js parsing                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Analyzer (src/analyzer/)                    │
│              Orchestrates override analysis                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌───────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   FS Utilities    │ │  NPM Wrappers   │ │ Version Compare │
│   (src/fs/)       │ │  (src/npm/)     │ │ (src/compare/)  │
└───────────────────┘ └─────────────────┘ └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Reporters (src/report/)                      │
│               Console and JSON output                           │
└─────────────────────────────────────────────────────────────────┘
```

## Core Design Principles

### 1. Safety First

> Never mutate real `node_modules` or `package-lock.json` unless explicitly requested.

All analysis happens in isolated temporary workspaces. The user's project is only modified when `--fix` is explicitly passed.

### 2. Full Tree Analysis

The tool checks **ALL versions** of a package across the entire dependency tree, not just the root-level resolution. This prevents false positives where removing an override would introduce older versions in nested dependencies.

### 3. Conservative Verdicts

An override is only marked as **redundant** if:

- The exact same versions resolve with and without the override, OR
- All versions without the override are equal to or newer than before

An override is marked as **required** if:

- ANY version in the tree would become older without the override
- `npm install` fails without the override

### 4. Minimal Dependencies

The tool uses minimal production dependencies:

- `commander` - CLI argument parsing
- `picocolors` - Terminal colors
- `semver` - Version comparison (official npm package)

## Project Structure

```
prune-overrides/
├── bin/                    # CLI entry point
│   └── prune-overrides.ts
├── src/
│   ├── index.ts            # Public API exports
│   ├── cli/                # CLI implementation
│   │   ├── options.ts      # Argument parsing
│   │   └── run.ts          # Main execution
│   ├── analyzer/           # Core analysis logic
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── analyzeOverrides.ts    # Orchestrator
│   │   └── analyzeSingle.ts       # Single override analysis
│   ├── fs/                 # File system operations
│   │   ├── readPackageJson.ts
│   │   ├── writePackageJson.ts
│   │   ├── readLockfile.ts
│   │   └── tempWorkspace.ts
│   ├── npm/                # npm command wrappers
│   │   ├── install.ts
│   │   ├── ls.ts
│   │   └── explain.ts
│   ├── compare/            # Version comparison
│   │   ├── compareResolution.ts
│   │   └── diffTree.ts
│   ├── report/             # Output formatting
│   │   ├── consoleReporter.ts
│   │   └── jsonReporter.ts
│   ├── util/               # Shared utilities
│   │   ├── exec.ts         # Child process wrapper
│   │   ├── logger.ts       # Logging
│   │   ├── errors.ts       # Custom error classes
│   │   └── semver.ts       # Version utilities
│   └── config/
│       └── constants.ts    # Exit codes, timeouts
└── tests/                  # Test files mirror src/ structure
```

### File Guidelines

- **Small files** - Each file should be <150 lines of code
- **Single responsibility** - One module, one purpose
- **No direct child_process** - All subprocess calls go through `util/exec.ts`

## Core Algorithm

For each override entry `K`:

```
1. READ baseline lockfile
   └─> Get ALL versions of K in current tree (with override)

2. CREATE temporary workspace
   └─> Copy package.json and package-lock.json

3. REMOVE override K from temp package.json

4. RUN npm install --package-lock-only --ignore-scripts
   └─> If fails: K is REQUIRED (install breaks without it)

5. READ new lockfile
   └─> Get ALL versions of K in new tree (without override)

6. COMPARE version sets
   └─> If ANY version in 'after' < min version in 'before':
       K is REQUIRED
   └─> Otherwise:
       K is REDUNDANT

7. CLEANUP temporary workspace
```

### Why Package-Lock-Only?

We use `npm install --package-lock-only` because:

- It doesn't download packages (fast)
- It doesn't run scripts (safe)
- It still performs full dependency resolution
- It updates the lockfile with what _would_ be installed

## Version Comparison Strategy

We use the official `semver` npm package for version comparison to handle:

- Build metadata (`1.0.0+build123`)
- Numeric prerelease identifiers (`1.0.0-alpha.10` vs `1.0.0-alpha.2`)
- Loose version formats (`v1.0.0`)
- Invalid versions (graceful fallback to string comparison)

### Key Function: `wouldIntroduceOlderVersions`

```typescript
function wouldIntroduceOlderVersions(before: string[], after: string[]): boolean {
  const minBefore = findMinVersion(before);

  for (const version of after) {
    if (isOlderVersion(version, minBefore)) {
      return true; // Would introduce older version!
    }
  }

  return false; // Safe to remove override
}
```

## Error Handling

Custom error classes in `src/util/errors.ts`:

| Error Class        | When Used                              |
| ------------------ | -------------------------------------- |
| `PackageJsonError` | package.json not found or invalid      |
| `LockfileError`    | package-lock.json not found or invalid |
| `NpmError`         | npm command failed                     |
| `WorkspaceError`   | Temp workspace creation failed         |
| `ConfigError`      | Invalid CLI options                    |

## Exit Codes

| Code | Constant          | Meaning                               |
| ---- | ----------------- | ------------------------------------- |
| 0    | `SUCCESS`         | No redundant overrides (or all fixed) |
| 1    | `REDUNDANT_FOUND` | Redundant overrides found (dry-run)   |
| 2    | `ERROR`           | An error occurred                     |

## Testing Strategy

- **Unit tests** - Pure functions (semver, comparison)
- **Integration tests** - File system operations with fixtures
- **Fixtures** - Sample package.json files in `tests/fixtures/`

Tests use Jest with SWC for fast ESM-compatible execution.

## Known Limitations

1. **npm only** - Does not support yarn or pnpm
2. **Simple overrides only** - Nested overrides like `{ "foo": { "bar": "1.0.0" } }` are skipped
3. **No .npmrc copying** - Private registries may not work correctly
4. **No workspace support** - npm workspaces not handled
5. **Sequential analysis** - Overrides analyzed one at a time (no parallelism)

## Future Improvements

See [GitHub Issues](https://github.com/PKief/prune-overrides/issues) for planned improvements:

- Parallel analysis for faster execution
- Progress indicator for large projects
- Timeout handling for npm commands
- .npmrc support for private registries
- Nested override support
- npm workspace support
