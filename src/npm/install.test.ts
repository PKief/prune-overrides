import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { npmInstall } from "./install.js";
import { NpmError } from "../util/errors.js";

interface Call {
  args: string[];
  lockfile: boolean;
  cacheExists: boolean;
}

async function fixture(
  t: { after: (fn: () => void | Promise<void>) => void },
  failures: string[],
) {
  const cwd = await mkdtemp(join(tmpdir(), "prune-npm-test-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const bin = join(cwd, "bin");
  await mkdir(bin);
  await writeFile(join(cwd, "failures.json"), JSON.stringify(failures));
  const executable = join(bin, "npm");
  await writeFile(executable, `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
const cache = args.find(arg => arg.startsWith("--cache="))?.slice(8);
const calls = fs.existsSync("calls.json") ? JSON.parse(fs.readFileSync("calls.json", "utf8")) : [];
const failure = JSON.parse(fs.readFileSync("failures.json", "utf8"))[calls.length];
calls.push({ args, lockfile: fs.existsSync("package-lock.json"), cacheExists: !!cache && fs.existsSync(cache) });
fs.writeFileSync("calls.json", JSON.stringify(calls));
// A failed install may leave a partially generated lockfile.
fs.writeFileSync("package-lock.json", "{}");
if (failure) { console.error(failure); process.exit(1); }
`);
  await chmod(executable, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}:${originalPath ?? ""}`;
  t.after(() => {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  });
  return {
    cwd,
    calls: async () => JSON.parse(await readFile(join(cwd, "calls.json"), "utf8")) as Call[],
  };
}

const missing = "npm error code ETARGET\nnpm error notarget No matching version found for example@2.0.0.";

async function assertCacheRemoved(call: Call) {
  assert.strictEqual(call.cacheExists, true);
  const cache = call.args.find(arg => arg.startsWith("--cache="))?.slice(8);
  assert.ok(cache);
  await assert.rejects(stat(cache), { code: "ENOENT" });
}

describe("npmInstall", () => {
  it("explicitly refreshes metadata instead of preferring offline caches", async (t) => {
    const { cwd, calls } = await fixture(t, []);
    await npmInstall({ cwd });
    const attempts = await calls();
    assert.strictEqual(attempts.length, 1);
    assert.ok(attempts[0]!.args.includes("--prefer-online"));
    assert.ok(attempts[0]!.args.includes("--prefer-offline=false"));
    assert.ok(attempts[0]!.args.includes("--offline=false"));
    assert.ok(attempts[0]!.args.includes("--ignore-scripts"));
    assert.ok(attempts[0]!.args.includes("--package-lock-only"));
  });

  it("retries ETARGET with an isolated cache and restarts fresh resolution", async (t) => {
    const { cwd, calls } = await fixture(t, [missing]);
    await writeFile(join(cwd, "package-lock.json"), "{}");
    await npmInstall({ cwd, freshResolution: true });
    const attempts = await calls();
    assert.strictEqual(attempts.length, 2);
    assert.deepStrictEqual(attempts.map(call => call.lockfile), [false, false]);
    assert.strictEqual(attempts[0]!.cacheExists, false);
    await assertCacheRemoved(attempts[1]!);
  });

  it("preserves the lockfile for installs that do not request fresh resolution", async (t) => {
    const { cwd, calls } = await fixture(t, [missing]);
    await writeFile(join(cwd, "package-lock.json"), "{}");
    await npmInstall({ cwd });
    assert.deepStrictEqual((await calls()).map(call => call.lockfile), [true, true]);
  });

  it("retries only once and cleans the cache when the version is genuinely missing", async (t) => {
    const secondFailure = missing.replace("example@2.0.0", "other@3.0.0");
    const { cwd, calls } = await fixture(t, [missing, secondFailure]);
    await assert.rejects(npmInstall({ cwd }), (error: unknown) => {
      assert.ok(error instanceof NpmError);
      assert.strictEqual(error.stderr?.trim(), secondFailure);
      return true;
    });
    const attempts = await calls();
    assert.strictEqual(attempts.length, 2);
    await assertCacheRemoved(attempts[1]!);
  });

  for (const code of ["ERESOLVE", "E401", "ENOTFOUND"]) {
    it(`does not retry ${code} as a stale-cache failure`, async (t) => {
      const { cwd, calls } = await fixture(t, [`npm error code ${code}`]);
      await assert.rejects(npmInstall({ cwd }), NpmError);
      assert.strictEqual((await calls()).length, 1);
    });
  }
});
