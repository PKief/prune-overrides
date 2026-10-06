import type { PackageJson } from "../fs/readPackageJson.js";
import type { Lockfile } from "../fs/readLockfile.js";
import { readLockfile } from "../fs/readLockfile.js";
import { writePackageJson } from "../fs/writePackageJson.js";
import { createTempWorkspace } from "../fs/tempWorkspace.js";
import { npmInstall } from "../npm/install.js";
import { compareLockfiles } from "../compare/resolutions.js";

export async function validateBaseline(
  cwd: string,
  packageJson: PackageJson,
  baseline: Lockfile
): Promise<{ valid: boolean; reason: string }> {
  const workspace = await createTempWorkspace(cwd);
  try {
    await writePackageJson(workspace.path, packageJson);
    try {
      await npmInstall({ cwd: workspace.path });
    } catch {
      return { valid: false, reason: "Baseline package-lock.json cannot be reproduced by npm" };
    }
    const regenerated = await readLockfile(workspace.path);
    const result = compareLockfiles(baseline, regenerated, "", "full-tree");
    return result.safe
      ? { valid: true, reason: "Baseline lockfile validated" }
      : {
          valid: false,
          reason: `Baseline lockfile is stale or environment-dependent: ${result.reason}`,
        };
  } finally {
    await workspace.cleanup();
  }
}
