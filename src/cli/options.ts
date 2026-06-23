import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DEFAULT_CONCURRENCY } from "../config/constants.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Navigate from dist/cli/ to package root
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "package.json"), "utf-8")
) as { version: string; description: string };

export interface CliOptions {
  dryRun: boolean;
  fix: boolean;
  include: string[];
  exclude: string[];
  cwd: string;
  verbose: boolean;
  concurrency: number;
}

function printHelp(): void {
  console.log(`Usage: prune-overrides [options]

${packageJson.description}

Options:
  -V, --version               Output version number
  -h, --help                  Display help for command
      --dry-run               Analyze without making changes (default)
      --fix                   Remove redundant overrides from package.json
      --include <packages...> Only analyze specific packages
      --exclude <packages...> Exclude specific packages from analysis
      --cwd <path>            Working directory (default: cwd)
  -v, --verbose               Enable verbose output
  -c, --concurrency <number>  Number of overrides to analyze in parallel (default: ${String(DEFAULT_CONCURRENCY)})`);
}

export function parseOptions(): CliOptions {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: true },
      fix: { type: "boolean", default: false },
      include: { type: "string", multiple: true },
      exclude: { type: "string", multiple: true },
      cwd: { type: "string", default: process.cwd() },
      verbose: { type: "boolean", default: false, short: "v" },
      concurrency: { type: "string", short: "c" },
      help: { type: "boolean", default: false, short: "h" },
      version: { type: "boolean", default: false, short: "V" },
    },
    strict: true,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (values.version) {
    console.log(packageJson.version);
    process.exit(0);
  }

  return {
    dryRun: !values.fix,
    fix: values.fix,
    include: values.include ?? [],
    exclude: values.exclude ?? [],
    cwd: values.cwd,
    verbose: values.verbose,
    concurrency: Math.max(
      1,
      parseInt(values.concurrency ?? String(DEFAULT_CONCURRENCY), 10) || DEFAULT_CONCURRENCY
    ),
  };
}
