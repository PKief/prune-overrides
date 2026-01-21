import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Navigate from dist/src/cli/ to project root
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "..", "package.json"), "utf-8")
) as { version: string; description: string };

export interface CliOptions {
  /** Dry run mode (default) */
  dryRun: boolean;
  /** Fix mode - remove redundant overrides */
  fix: boolean;
  /** Output JSON format */
  json: boolean;
  /** Only analyze specific packages */
  include: string[];
  /** Exclude specific packages */
  exclude: string[];
  /** Working directory */
  cwd: string;
  /** Verbose output */
  verbose: boolean;
}

/**
 * Create and configure the CLI program
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name("prune-overrides")
    .description(packageJson.description)
    .version(packageJson.version)
    .option("--dry-run", "Analyze without making changes (default)", true)
    .option("--fix", "Remove redundant overrides from package.json")
    .option("--json", "Output results as JSON")
    .option("--include <packages...>", "Only analyze specific packages")
    .option("--exclude <packages...>", "Exclude specific packages from analysis")
    .option("--cwd <path>", "Working directory", process.cwd())
    .option("-v, --verbose", "Enable verbose output");

  return program;
}

/**
 * Parse CLI options from command arguments
 */
export function parseOptions(program: Command): CliOptions {
  const opts = program.opts<{
    dryRun?: boolean;
    fix?: boolean;
    json?: boolean;
    include?: string[];
    exclude?: string[];
    cwd?: string;
    verbose?: boolean;
  }>();

  return {
    dryRun: !opts.fix,
    fix: opts.fix ?? false,
    json: opts.json ?? false,
    include: opts.include ?? [],
    exclude: opts.exclude ?? [],
    cwd: opts.cwd ?? process.cwd(),
    verbose: opts.verbose ?? false,
  };
}
