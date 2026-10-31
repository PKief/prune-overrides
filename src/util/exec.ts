import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFileCallback);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  signal?: AbortSignal;
}

export async function execFile(
  file: string,
  args: string[] = [],
  options: ExecOptions = {},
): Promise<ExecResult> {
  const { cwd, env, timeout = 120000, signal } = options;
  const result = await execFileAsync(file, args, {
    cwd,
    env: { ...process.env, ...env },
    timeout,
    signal,
    maxBuffer: 1024 * 1024 * 10,
  });
  return { stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

export async function execFileSafe(
  file: string,
  args: string[] = [],
  options: ExecOptions = {},
): Promise<ExecResult & { success: boolean }> {
  try {
    return { ...(await execFile(file, args, options)), success: true };
  } catch (error) {
    const execError = error as Error & { stdout?: string; stderr?: string };
    return {
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? execError.message,
      success: false,
    };
  }
}
