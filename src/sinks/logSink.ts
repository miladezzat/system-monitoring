import { promises as fs } from "node:fs";
import path from "node:path";
import type { LogData, TrackTimeOptions } from "../types";

export function createLogSink(options: TrackTimeOptions) {
  const maxSize = options.maxQueueSize ?? 1024;
  const maxBytes = options.maxQueueBytes ?? 1024 * 1024;
  if (
    !Number.isInteger(maxSize) ||
    maxSize < 1 ||
    !Number.isInteger(maxBytes) ||
    maxBytes < 1
  )
    throw new RangeError("Queue limits must be positive integers");
  const queue: { data: LogData; bytes: number }[] = [];
  let bytes = 0,
    running = false,
    dropped = 0,
    errors = 0,
    closed = false;
  let directoryReady: Promise<unknown> | undefined;
  const waiters = new Set<() => void>();
  const drain = async () => {
    if (running) return;
    running = true;
    while (queue.length) {
      const entry = queue[0];
      try {
        if (options.filePath) {
          directoryReady ??= fs.mkdir(path.dirname(options.filePath), {
            recursive: true,
          });
          await directoryReady;
          await fs.appendFile(
            options.filePath,
            JSON.stringify(entry.data) + "\n",
          );
        }
        if (options.storeOnDb) await options.storeOnDb(entry.data);
      } catch (error) {
        directoryReady = undefined;
        errors++;
        try {
          await options.onError?.(
            error instanceof Error ? error : new Error(String(error)),
          );
        } catch {
          /* A reporting hook must not fail request processing. */
        }
      }
      queue.shift();
      bytes -= entry.bytes;
    }
    running = false;
    for (const resolve of waiters) resolve();
    waiters.clear();
  };
  const flush = (timeoutMs = 5000): Promise<void> => {
    if (!Number.isFinite(timeoutMs) || timeoutMs < 1)
      return Promise.reject(new RangeError("timeoutMs must be positive"));
    if (!queue.length) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const done = () => {
        clearTimeout(timer);
        waiters.delete(done);
        resolve();
      };
      const timer = setTimeout(() => {
        waiters.delete(done);
        reject(new Error("Log flush timed out"));
      }, timeoutMs);
      waiters.add(done);
    });
  };
  return {
    enqueue(data: LogData): void {
      const size = Buffer.byteLength(JSON.stringify(data));
      if (closed || queue.length >= maxSize || bytes + size > maxBytes) {
        dropped++;
        return;
      }
      queue.push({ data, bytes: size });
      bytes += size;
      void drain();
    },
    flush,
    close(timeoutMs?: number) {
      closed = true;
      return flush(timeoutMs);
    },
    getStats: () => ({
      queued: queue.length,
      pendingBytes: bytes,
      dropped,
      errors,
    }),
  };
}
