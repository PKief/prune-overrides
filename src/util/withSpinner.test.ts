import assert from "node:assert/strict";
import { it } from "node:test";
import { withSpinner } from "./withSpinner.js";

for (const fails of [false, true]) {
  it(`clears phase progress on ${fails ? "failure" : "success"}`, async (t) => {
    const tty = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
    const ci = process.env.CI;
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
    delete process.env.CI;
    t.after(() => {
      if (tty) Object.defineProperty(process.stdout, "isTTY", tty);
      else Reflect.deleteProperty(process.stdout, "isTTY");
      if (ci === undefined) delete process.env.CI;
      else process.env.CI = ci;
    });
    const output: string[] = [];
    t.mock.method(process.stdout, "write", (text: string) => {
      output.push(text);
      return true;
    });
    const error = new Error("resolution failed");
    const operation = withSpinner("Checking all overrides...", async () => {
      assert.match(output[0]!, /Checking all overrides/);
      if (fails) throw error;
      return 42;
    });
    if (fails) await assert.rejects(operation, error);
    else assert.strictEqual(await operation, 42);
    assert.strictEqual(output.at(-1), "\r\x1b[K");
  });
}
