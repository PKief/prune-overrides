import { mkdir, rm, cp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { TEMP_DIR_PREFIX } from "../config/constants.js";
import { WorkspaceError } from "../util/errors.js";

export interface TempWorkspace {
  /** Path to the temporary workspace */
  path: string;
  /** Clean up the workspace when done */
  cleanup: () => Promise<void>;
}

/**
 * Create a temporary workspace for testing override removal
 */
export async function createTempWorkspace(sourceDir: string): Promise<TempWorkspace> {
  const workspacePath = join(tmpdir(), `${TEMP_DIR_PREFIX}${randomUUID()}`);

  try {
    await mkdir(workspacePath, { recursive: true });

    // Copy package.json
    await cp(join(sourceDir, "package.json"), join(workspacePath, "package.json"));

    // Copy package-lock.json if it exists
    try {
      await cp(join(sourceDir, "package-lock.json"), join(workspacePath, "package-lock.json"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
      // It's OK if lockfile doesn't exist
    }

    return {
      path: workspacePath,
      cleanup: async () => {
        await cleanupWorkspace(workspacePath);
      },
    };
  } catch (error) {
    // Clean up on error
    await cleanupWorkspace(workspacePath);
    throw new WorkspaceError(
      `Failed to create temp workspace: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Clean up a temporary workspace
 */
async function cleanupWorkspace(workspacePath: string): Promise<void> {
  try {
    await rm(workspacePath, { recursive: true, force: true });
  } catch {
    // Best effort cleanup, don't throw
  }
}
