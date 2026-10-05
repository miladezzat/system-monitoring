import { open } from "node:fs/promises";

export interface LogReadOptions {
  maxBytes?: number;
  maxLines?: number;
  signal?: AbortSignal;
}
/** Read a bounded tail of a regular file; never buffer the entire log. */
export async function getLogs(
  path: string,
  keyword?: string,
  options: LogReadOptions = {},
): Promise<string[]> {
  const maxBytes = options.maxBytes ?? 1024 * 1024;
  const maxLines = options.maxLines ?? 1000;
  if (
    !Number.isInteger(maxBytes) ||
    maxBytes < 1 ||
    maxBytes > 16 * 1024 * 1024 ||
    !Number.isInteger(maxLines) ||
    maxLines < 1 ||
    maxLines > 10000
  )
    throw new RangeError("Invalid log read limits");
  options.signal?.throwIfAborted();
  const handle = await open(path, "r");
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new TypeError("Logs must be a regular file");
    const offset = Math.max(0, stat.size - maxBytes);
    const buffer = Buffer.alloc(Math.min(stat.size, maxBytes));
    let read = 0;
    while (read < buffer.length) {
      options.signal?.throwIfAborted();
      const { bytesRead } = await handle.read(
        buffer,
        read,
        buffer.length - read,
        offset + read,
      );
      if (!bytesRead) break;
      read += bytesRead;
    }
    options.signal?.throwIfAborted();
    let text = buffer.subarray(0, read).toString("utf8");
    if (offset) {
      const newline = text.indexOf("\n");
      text = newline < 0 ? "" : text.slice(newline + 1);
    }
    const lines = text.split(/\r?\n/);
    if (lines[lines.length - 1] === "") lines.pop();
    const tail = lines.slice(-maxLines);
    return keyword ? tail.filter((line) => line.includes(keyword)) : tail;
  } finally {
    await handle.close();
  }
}
export default getLogs;
