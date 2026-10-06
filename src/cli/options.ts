import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DEFAULT_CONCURRENCY } from "../config/constants.js";
import type { SafetyPolicy } from "../analyzer/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
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
  policy: SafetyPolicy;
  cache: boolean;
}

function printHelp(): void {
  console.log(`Usage: prune-overrides [options]\n\n${packageJson.description}\n
Options:
  -V, --version               Output version number
  -h, --help                  Display help for command
      --dry-run               Analyze without making changes (default)
      --fix                   Remove redundant overrides
      --include <rules...>    Analyze package names or full rule paths
      --exclude <rules...>    Exclude package names or full rule paths
      --cwd <path>            Working directory
  -v, --verbose               Enable verbose output
  -c, --concurrency <number>  Parallel npm processes (default: ${String(DEFAULT_CONCURRENCY)})
      --policy <policy>       no-downgrade (default), exact, or full-tree
      --no-cache              Disable persistent analysis cache`);
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
      policy: { type: "string", default: "no-downgrade" },
      cache: { type: "boolean", default: true },
      help: { type: "boolean", default: false, short: "h" },
      version: { type: "boolean", default: false, short: "V" },
    },
    strict: true,
    allowNegative: true,
  });
  if (values.help) {
    printHelp();
    process.exit(0);
  }
  if (values.version) {
    console.log(packageJson.version);
    process.exit(0);
  }
  if (!(["exact", "no-downgrade", "full-tree"] as string[]).includes(values.policy)) {
    throw new Error(`Invalid policy: ${values.policy}`);
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
    policy: values.policy as SafetyPolicy,
    cache: values.cache,
  };
}
