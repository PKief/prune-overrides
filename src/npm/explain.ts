import { execSafe } from "../util/exec.js";
import { logger } from "../util/logger.js";

export interface NpmExplainNode {
  name: string;
  version: string;
  location: string;
  dependents: NpmExplainDependent[];
}

export interface NpmExplainDependent {
  type: string;
  name: string;
  spec: string;
  from?: NpmExplainNode;
}

export interface ExplainOptions {
  cwd: string;
  packageName: string;
}

export async function npmExplain(options: ExplainOptions): Promise<NpmExplainNode[] | null> {
  const { cwd, packageName } = options;

  const command = `npm explain ${packageName} --json`;
  logger.debug(`Running: ${command} in ${cwd}`);

  const result = await execSafe(command, { cwd });

  if (!result.success || !result.stdout) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout) as NpmExplainNode[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    logger.debug(`Failed to parse npm explain output: ${result.stdout}`);
    return null;
  }
}

export function hasDependents(explainResult: NpmExplainNode[]): boolean {
  return explainResult.some((node) => node.dependents.length > 0);
}
