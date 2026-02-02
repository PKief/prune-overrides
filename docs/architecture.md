# Architecture

This document describes the architecture, design decisions, and implementation details of **prune-overrides**.

## Overview

prune-overrides is a CLI tool that analyzes npm `overrides` entries and determines whether they are still required or can be safely removed. It uses a safe, isolated approach to test each override without affecting the user's actual project.

The project is structured as an npm monorepo with three packages:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Monorepo                                       │
│                         packages/                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐   │
│  │  @prune-        │   │   prune-overrides   │   │   @prune-           │   │
│  │  overrides/core │◄──│       (cli)         │   │   overrides/ui      │   │
│  │                 │   │                     │   │                     │   │
│  │  Shared types,  │   │  CLI entry point,   │   │  React web app for  │   │
│  │  utilities,     │   │  analyzer logic,    │   │  viewing shared     │   │
│  │  URL encoding   │   │  npm wrappers,      │   │  analysis results   │   │
│  │                 │   │  reporters          │   │                     │   │
│  └─────────────────┘   └─────────────────────┘   └─────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Package Architecture

### @prune-overrides/core

Shared, dependency-light package containing:

- **Types** - `OverrideVerdict`, `AnalysisReport`, etc.
- **Utilities** - Logger, spinner, exec wrapper, semver helpers
- **URL Encoding** - LZ-string compression for shareable results
- **Constants** - Exit codes, timeouts

### prune-overrides (CLI)

Main CLI package with the analysis engine:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI (bin/)                              │
│                    commander.js parsing                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Analyzer (analyzer/)                        │
│              Orchestrates override analysis                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌───────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   FS Utilities    │ │  NPM Wrappers   │ │ Version Compare │
│   (fs/)           │ │  (npm/)         │ │ (compare/)      │
└───────────────────┘ └─────────────────┘ └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Reporters (report/)                          │
│               Console and JSON output                           │
└─────────────────────────────────────────────────────────────────┘
```

### @prune-overrides/ui

React-based web application for viewing shared analysis results:

- Decodes URL-compressed analysis data
- Displays results in a user-friendly format
- Deployed to GitHub Pages
- Supports multiple payload versions (v1, v2, v3) for backwards compatibility

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
├── packages/
│   ├── core/                       # @prune-overrides/core
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts            # Public API exports
│   │       ├── analyzer/
│   │       │   └── types.ts        # TypeScript interfaces
│   │       ├── share/              # URL encoding for shareable results
│   │       │   ├── index.ts
│   │       │   ├── types.ts        # Compact payload types
│   │       │   └── urlCodec.ts     # LZ-string encode/decode
│   │       ├── util/               # Shared utilities
│   │       │   ├── errors.ts       # Custom error classes
│   │       │   ├── exec.ts         # Child process wrapper
│   │       │   ├── logger.ts       # Logging
│   │       │   ├── semver.ts       # Version utilities
│   │       │   └── spinner.ts      # Terminal spinner
│   │       └── config/
│   │           └── constants.ts    # Exit codes, timeouts
│   │
│   ├── cli/                        # prune-overrides (main CLI)
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts            # Public API exports
│   │       ├── bin/
│   │       │   └── prune-overrides.ts  # CLI entry point
│   │       ├── cli/                # CLI implementation
│   │       │   ├── options.ts      # Argument parsing
│   │       │   └── run.ts          # Main execution
│   │       ├── analyzer/           # Core analysis logic
│   │       │   ├── analyzeOverrides.ts    # Orchestrator
│   │       │   └── analyzeSingle.ts       # Single override analysis
│   │       ├── fs/                 # File system operations
│   │       │   ├── readPackageJson.ts
│   │       │   ├── writePackageJson.ts
│   │       │   ├── readLockfile.ts
│   │       │   └── tempWorkspace.ts
│   │       ├── npm/                # npm command wrappers
│   │       │   ├── install.ts
│   │       │   ├── ls.ts
│   │       │   └── explain.ts
│   │       ├── compare/            # Version comparison
│   │       │   ├── compareResolution.ts
│   │       │   └── diffTree.ts
│   │       └── report/             # Output formatting
│   │           ├── consoleReporter.ts
│   │           └── jsonReporter.ts
│   │
│   └── ui/                         # @prune-overrides/ui
│       ├── package.json
│       └── src/
│           ├── main.tsx            # React entry point
│           ├── App.tsx             # Main application
│           ├── index.css           # Tailwind CSS
│           ├── components/
│           │   ├── EmptyState.tsx  # No data view
│           │   └── ResultsView.tsx # Analysis results display
│           └── hooks/
│               └── useUrlState.ts  # URL decoding hook
│
├── docs/                           # Documentation
│   ├── architecture.md
│   ├── patterns.md
│   └── recipes.md
│
└── tests/                          # Test files (in cli package)
    └── packages/cli/tests/
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

Custom error classes in `packages/core/src/util/errors.ts`:

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

## Shareable Results

Analysis results can be encoded into a compact URL for sharing via the web UI.

### Encoding Pipeline

```
AnalysisReport
    │
    ▼ toShareableResult()
EncodedPayload (compact array format)
    │
    ▼ JSON.stringify()
JSON string
    │
    ▼ LZString.compressToEncodedURIComponent()
URL-safe compressed string
    │
    ▼ Append to UI URL
https://pkief.github.io/prune-overrides/?d=<compressed>
```

### Payload Format (v3)

```typescript
type EncodedPayload = [
  string, // projectName
  string[], // redundant override names
  string[], // required override names
];
```

The UI supports backwards-compatible decoding of older payload formats (v1, v2).

## Testing Strategy

- **Unit tests** - Pure functions (semver, comparison)
- **Integration tests** - File system operations with fixtures
- **Fixtures** - Sample package.json files in `packages/cli/tests/fixtures/`

Tests use Jest with SWC for fast ESM-compatible execution.

## Known Limitations

1. **npm only** - Does not support yarn or pnpm
2. **Simple overrides only** - Nested overrides like `{ "foo": { "bar": "1.0.0" } }` are skipped
3. **No workspace support** - npm workspaces not handled
4. **Sequential analysis** - Overrides analyzed one at a time (no parallelism)
5. **Lockfile version 2+ only** - Older npm lockfiles (v1) not supported
