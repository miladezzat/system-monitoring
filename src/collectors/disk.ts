import { statfs } from "node:fs/promises";
import type { DiskSpace } from "../core/contracts";

export async function collectDiskSpace(
  paths: readonly string[],
  signal: AbortSignal,
): Promise<DiskSpace[]> {
  const result: DiskSpace[] = [];
  for (const path of paths) {
    signal.throwIfAborted();
    const stat = await statfs(path);
    signal.throwIfAborted();
    const totalBytes = stat.blocks * stat.bsize;
    const freeBytes = stat.bfree * stat.bsize;
    const availableBytes = stat.bavail * stat.bsize;
    const usedBytes = totalBytes - freeBytes;
    result.push({
      path,
      totalBytes,
      usedBytes,
      freeBytes,
      availableBytes,
      usedPercent: totalBytes ? (usedBytes / totalBytes) * 100 : 0,
    });
  }
  return result;
}
