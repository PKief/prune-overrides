import { mkdir, rm, copyFile, constants } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { TEMP_DIR_PREFIX } from "../config/constants.js";
import { WorkspaceError } from "../util/errors.js";

export interface TempWorkspace {
  path: string;
  reset: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export async function createTempWorkspace(sourceDir: string): Promise<TempWorkspace> {
  const workspacePath = join(tmpdir(), `${TEMP_DIR_PREFIX}${randomUUID()}`);

  async function reset(): Promise<void> {
    await mkdir(workspacePath, { recursive: true });
    await copyRequired(
      join(sourceDir, "package-lock.json"),
      join(workspacePath, "package-lock.json")
    );
    await copyOptional(join(sourceDir, ".npmrc"), join(workspacePath, ".npmrc"));
  }

  try {
    await reset();
    return {
      path: workspacePath,
      reset,
      cleanup: async () => cleanupWorkspace(workspacePath),
    };
  } catch (error) {
    await cleanupWorkspace(workspacePath);
    throw new WorkspaceError(
      `Failed to create temp workspace: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function copyRequired(source: string, destination: string): Promise<void> {
  await copyFile(source, destination, constants.COPYFILE_FICLONE);
}

async function copyOptional(source: string, destination: string): Promise<void> {
  try {
    await copyFile(source, destination, constants.COPYFILE_FICLONE);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await rm(destination, { force: true });
  }
}

async function cleanupWorkspace(workspacePath: string): Promise<void> {
  try {
    await rm(workspacePath, { recursive: true, force: true });
  } catch {
    // Best effort cleanup.
  }
}
