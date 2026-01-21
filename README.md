# prune-overrides

CLI tool that analyzes npm `overrides` entries and determines whether they are still required or can be safely removed.

## Features

- Detect overrides that are no longer necessary
- Safe-by-default (`--dry-run`)
- Deterministic and reproducible results
- ESM-first, TypeScript-based

## Installation

```bash
npm install -g prune-overrides
```

Or run directly with npx:

```bash
npx prune-overrides
```

## Usage

```bash
# Analyze overrides (dry-run by default)
prune-overrides

# Output results as JSON
prune-overrides --json

# Remove redundant overrides
prune-overrides --fix

# Analyze specific packages only
prune-overrides --include lodash minimist

# Exclude specific packages
prune-overrides --exclude lodash

# Analyze a different directory
prune-overrides --cwd /path/to/project

# Verbose output
prune-overrides --verbose
```

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Analyze without making changes (default) |
| `--fix` | Remove redundant overrides from package.json |
| `--json` | Output results as JSON |
| `--include <packages...>` | Only analyze specific packages |
| `--exclude <packages...>` | Exclude specific packages from analysis |
| `--cwd <path>` | Working directory |
| `-v, --verbose` | Enable verbose output |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No redundant overrides |
| 1 | Redundant overrides found |
| 2 | Error |

## How It Works

For each override entry:

1. Read baseline resolution from `package-lock.json`
2. Create temporary workspace
3. Copy `package.json` and `package-lock.json`
4. Remove only the specific override
5. Run `npm install --package-lock-only --ignore-scripts`
6. Compare resolved versions
7. Determine verdict:
   - Same version → **REDUNDANT** (can be removed)
   - Different version → **REQUIRED** (keep it)
   - Install error → **REQUIRED** (keep it)

## Programmatic Usage

```typescript
import { analyzeOverrides } from 'prune-overrides';

const report = await analyzeOverrides({
  cwd: process.cwd(),
  verbose: true,
});

console.log(`Found ${report.redundant} redundant overrides`);

for (const result of report.results) {
  if (result.verdict === 'redundant') {
    console.log(`${result.name} can be removed: ${result.reason}`);
  }
}
```

## Requirements

- Node.js >= 18
- npm (for dependency resolution)

## License

MIT
