import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { OverrideAnalysisResult } from "./types.js";

interface CacheFile {
  version: 2;
  entries: Record<string, OverrideAnalysisResult>;
}

export class AnalysisCache {
  private readonly path: string;
  private data: CacheFile = { version: 2, entries: {} };

  constructor(cwd: string) {
    this.path = join(cwd, "node_modules", ".cache", "prune-overrides", "results.json");
  }

  async load(): Promise<void> {
    try {
      const parsed = JSON.parse(await readFile(this.path, "utf8")) as unknown;
      if (isCacheFile(parsed)) this.data = parsed;
    } catch {
      // Missing or corrupt caches are ignored.
    }
  }

  get(key: string): OverrideAnalysisResult | undefined {
    return this.data.entries[key];
  }

  set(key: string, result: OverrideAnalysisResult): void {
    this.data.entries[key] = result;
  }

  async save(): Promise<void> {
    await mkdir(join(this.path, ".."), { recursive: true });
    await writeFile(this.path, JSON.stringify(this.data), "utf8");
  }
}

function isCacheFile(value: unknown): value is CacheFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === 2 &&
    "entries" in value &&
    typeof value.entries === "object" &&
    value.entries !== null
  );
}

export function createCacheKey(parts: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}
