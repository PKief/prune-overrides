import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as { version: string; description: string };

export interface CliOptions {
  fix: boolean;
  help: boolean;
  version: boolean;
}

export function printHelp(): void {
  console.log(`Usage: prune-overrides [--fix | --help | --version]

${packageJson.description}

Run in the project directory to scan all overrides without changing files.
Use --fix to remove safely redundant overrides and update package-lock.json.

Options:
  --fix       Remove redundant overrides
  --help      Display this help
  --version   Output version number`);
}

export function printVersion(): void {
  console.log(packageJson.version);
}

export function parseOptions(
  args: string[] = process.argv.slice(2),
): CliOptions {
  const { values } = parseArgs({
    args,
    options: {
      fix: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
      version: { type: "boolean", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  return { fix: values.fix, help: values.help, version: values.version };
}
