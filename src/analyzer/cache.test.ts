import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "node:test";
import { AnalysisCache } from "./cache.js";

it("ignores cached verdicts from before clean-resolution validation", async (t) => {
  const cwd = await mkdtemp(join(tmpdir(), "prune-cache-test-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const directory = join(cwd, "node_modules", ".cache", "prune-overrides");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "results.json"), JSON.stringify({
    version: 2,
    entries: { stale: { verdict: "redundant" } },
  }));
  const cache = new AnalysisCache(cwd);
  await cache.load();
  assert.strictEqual(cache.get("stale"), undefined);
});
