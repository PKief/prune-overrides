# prune-overrides

CLI tool that analyzes npm `overrides` entries and determines whether they are still required or can be safely removed.

## Why?

npm overrides are useful for fixing security vulnerabilities or compatibility issues in nested dependencies. However, over time these overrides can become outdated:

- The upstream package may have updated to include the fix
- Dependencies may have changed, making the override unnecessary
- You might forget why an override was added in the first place

`prune-overrides` automatically detects which overrides are still needed and which can be safely removed, keeping your `package.json` clean.

## Features

- **Safe by default** - scanning shows results without modifying project files
- **Full tree analysis** - checks ALL versions across the entire dependency tree, not just root
- **No false positives** - only marks an override as redundant if removing it won't introduce ANY older versions
- **Fast** - uses `--package-lock-only` to avoid downloading packages
- **Simple CLI** - scan, fix, help, and version, with meaningful exit codes

## Installation

```bash
npm install -g prune-overrides
```

Or run directly with npx:

```bash
npx prune-overrides
```

## Usage

Run in the directory containing your project's package.json and package-lock.json:

```bash
# Scan all overrides and show results without changing project files
prune-overrides

# Remove safely redundant overrides and regenerate package-lock.json
prune-overrides --fix

# Show help or version
prune-overrides --help
prune-overrides --version
```

These are the only supported CLI options. Scanning uses isolated temporary workspaces
and does not write a project cache. Fixing revalidates the combined removal set
before updating files and rolls back if lockfile regeneration fails.

## Options

| Option      | Description                                                    |
| ----------- | -------------------------------------------------------------- |
| `--fix`     | Remove safely redundant overrides and update package-lock.json |
| `--help`    | Display help                                                   |
| `--version` | Output version number                                          |

## Exit Codes

| Code | Meaning                                              |
| ---- | ---------------------------------------------------- |
| 0    | No redundant overrides (or all removed with `--fix`) |
| 1    | Redundant overrides found (scan only)                |
| 2    | Error                                                |

## How It Works

For each override entry:

1. **Collect baseline versions** - Get ALL resolved versions of the package across the entire dependency tree from `package-lock.json`
2. **Create temporary workspace** - Copy `package.json` and `package-lock.json` to an isolated temp directory
3. **Remove the override** - Modify the temp `package.json` to remove only this specific override
4. **Regenerate lockfile** - Run `npm install --package-lock-only --ignore-scripts`
5. **Collect new versions** - Get ALL resolved versions from the new lockfile
6. **Compare version sets** - Determine if removing the override would introduce older versions

### Verdict Logic

Under the default `no-downgrade` policy, an override is **REDUNDANT** only if:

- The same versions resolve without the override, OR
- It does not introduce any additional version older than the highest override-enabled version

A changed package-instance count is not unsafe by itself; every resulting version is inspected.

An override is **REQUIRED** if:

- ANY version in the tree would become older without the override
- npm reports a genuine dependency conflict without the override

Infrastructure failures such as registry authentication, network errors, and timeouts are reported as **UNKNOWN**, never as safe removals.

This ensures that removing an override will **never** cause older versions to be installed anywhere in your dependency tree.

## Programmatic Usage

```typescript
import { analyzeOverrides } from "prune-overrides";

const report = await analyzeOverrides({
  cwd: process.cwd(),
  verbose: true,
});

console.log(`Found ${report.redundant} redundant overrides`);

for (const result of report.results) {
  if (result.verdict === "redundant") {
    console.log(`${result.name} can be removed: ${result.reason}`);
  }
}
```

## Requirements

- Node.js 22.22.2+, 24.15.0+, or 26+
- npm (for dependency resolution)

## Limitations

- **npm only** - Does not support yarn or pnpm (yet)
- **Local/workspace dependencies** - These are reported as `unknown` because isolated resolution may change relative paths
- **Platform-specific** - Results apply to the OS and architecture shown in the report
- **No CVE checking** - Does not verify if versions have known vulnerabilities

## Development

Use Node.js 26+ (`nvm use`) and npm. `npm ci` and npm scripts enforce this with `devEngines`. Tests run TypeScript directly; coverage still uses Node’s experimental coverage flag.

## Documentation

Open [docs/index.html](./docs/index.html) locally, or publish `/docs` with GitHub Pages. No build step needed.

## License

MIT
