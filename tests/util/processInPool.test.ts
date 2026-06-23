import { processInPool } from "../../src/util/processInPool.js";

describe("processInPool", () => {
  it("should process all items and preserve order", async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await processInPool(items, 3, async (n) => n * 2);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it("should handle empty input", async () => {
    const results = await processInPool([], 3, async (n: number) => n);
    expect(results).toEqual([]);
  });

  it("should work with concurrency of 1 (sequential)", async () => {
    const order: number[] = [];
    const items = [1, 2, 3];
    await processInPool(items, 1, async (n) => {
      order.push(n);
      return n;
    });
    expect(order).toEqual([1, 2, 3]);
  });

  it("should limit concurrency", async () => {
    let active = 0;
    let maxActive = 0;
    const concurrency = 2;

    const items = Array.from({ length: 6 }, (_, i) => i);
    await processInPool(items, concurrency, async (n) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 20));
      active--;
      return n;
    });

    expect(maxActive).toBeLessThanOrEqual(concurrency);
  });

  it("should handle concurrency larger than item count", async () => {
    const items = [1, 2];
    const results = await processInPool(items, 10, async (n) => n + 1);
    expect(results).toEqual([2, 3]);
  });

  it("should propagate errors", async () => {
    const items = [1, 2, 3];
    await expect(
      processInPool(items, 2, async (n) => {
        if (n === 2) throw new Error("fail");
        return n;
      })
    ).rejects.toThrow("fail");
  });
});
