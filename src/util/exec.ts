import { exec as execCallback } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(execCallback);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
}

/**
 * Execute a shell command and return the result.
 * All child_process usage should go through this module.
 */
export async function exec(command: string, options: ExecOptions = {}): Promise<ExecResult> {
  const { cwd, env, timeout = 120000 } = options;

  const result = await execAsync(command, {
    cwd,
    env: { ...process.env, ...env },
    timeout,
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
  });

  return {
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

/**
 * Execute a command and return success/failure without throwing.
 */
export async function execSafe(
  command: string,
  options: ExecOptions = {}
): Promise<ExecResult & { success: boolean }> {
  try {
    const result = await exec(command, options);
    return { ...result, success: true };
  } catch (error) {
    const execError = error as Error & { stdout?: string; stderr?: string };
    return {
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? execError.message,
      success: false,
    };
  }
}
