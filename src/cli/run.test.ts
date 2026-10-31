import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

const exec = promisify(execFile);
const cli = new URL("../bin/prune-overrides.ts", import.meta.url);
const loader = new URL("../../scripts/loader.js", import.meta.url);

async function invoke(cwd: string, args: string[] = []) {
  try {
    const result = await exec(
      process.execPath,
      [
        "--import",
        loader.href,
        fileURLToPath(cli),
        ...args,
      ],
      { cwd },
    );
    return { ...result, code: 0 };
  } catch (error) {
    const result = error as Error & {
      code: number;
      stdout: string;
      stderr: string;
    };
    return { code: result.code, stdout: result.stdout, stderr: result.stderr };
  }
}

async function fixture(t: { after: (fn: () => Promise<void>) => void }) {
  const cwd = await mkdtemp(join(tmpdir(), "prune-cli-test-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
}

describe("CLI", () => {
  for (const flag of ["--help", "--version"]) {
    it(`${flag} works outside a project without changing files`, async (t) => {
      const cwd = await fixture(t);
      const result = await invoke(cwd, [flag]);
      assert.strictEqual(result.code, 0);
      assert.ok(
        flag === "--help"
          ? result.stdout.includes("--fix")
          : /^\d+\.\d+\.\d+\s*$/.test(result.stdout),
      );
      assert.deepStrictEqual(await readdir(cwd), []);
    });
  }

  it("reports unsupported options without starting analysis", async (t) => {
    const cwd = await fixture(t);
    const result = await invoke(cwd, ["--verbose"]);
    assert.strictEqual(result.code, 2);
    assert.ok(result.stderr.includes("--verbose"));
    assert.ok(!result.stderr.includes("at parseArgs"));
    assert.deepStrictEqual(await readdir(cwd), []);
  });

  it("scans without writes and fixes only redundant overrides", async (t) => {
    const cwd = await fixture(t);
    const packageJson =
      JSON.stringify(
        {
          name: "cli-fixture",
          version: "1.0.0",
          overrides: { "unused-package": "1.0.0" },
        },
        null,
        2,
      ) + "\n";
    const lockfile =
      JSON.stringify(
        {
          name: "cli-fixture",
          version: "1.0.0",
          lockfileVersion: 3,
          requires: true,
          packages: { "": { name: "cli-fixture", version: "1.0.0" } },
        },
        null,
        2,
      ) + "\n";
    await writeFile(join(cwd, "package.json"), packageJson);
    await writeFile(join(cwd, "package-lock.json"), lockfile);
    // No dependency downloads; keep npm isolated from user/global registry configuration.
    await writeFile(
      join(cwd, ".npmrc"),
      "offline=true\nregistry=https://registry.npmjs.org/\n",
    );
    const files = await readdir(cwd);
    const scan = await invoke(cwd);
    assert.strictEqual(scan.code, 1, scan.stderr + scan.stdout);
    assert.ok(scan.stdout.includes("unused-package"));
    assert.strictEqual(
      await readFile(join(cwd, "package.json"), "utf8"),
      packageJson,
    );
    assert.strictEqual(
      await readFile(join(cwd, "package-lock.json"), "utf8"),
      lockfile,
    );
    assert.deepStrictEqual(await readdir(cwd), files);

    const fix = await invoke(cwd, ["--fix"]);
    assert.strictEqual(fix.code, 0, fix.stderr + fix.stdout);
    const updated = JSON.parse(
      await readFile(join(cwd, "package.json"), "utf8"),
    ) as { overrides?: unknown };
    assert.strictEqual(updated.overrides, undefined);
    const updatedLock = JSON.parse(
      await readFile(join(cwd, "package-lock.json"), "utf8"),
    ) as { lockfileVersion: number };
    assert.strictEqual(updatedLock.lockfileVersion, 3);
    assert.deepStrictEqual(await readdir(cwd), files);
    assert.strictEqual((await invoke(cwd)).code, 0);
  });
});
