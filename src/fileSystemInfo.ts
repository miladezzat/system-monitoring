import type { FileSystemInfo } from "./types";
import { getDiskUsage } from "./diskUsage";
import { runCommand } from "./platforms/command";

export async function getFileSystemInfo(
  format: "json" | "raw" = "json",
  signal?: AbortSignal,
): Promise<FileSystemInfo[] | string> {
  if (format === "raw" && process.platform !== "win32")
    return (await runCommand("df", ["-hP"], { signal })).stdout;
  const volumes = await getDiskUsage(signal);
  const data = volumes.map((d) => ({
    caption: d.filesystem,
    size: formatBytes(d.total),
    freeSpace: formatBytes(d.available),
  }));
  return format === "raw" ? JSON.stringify(data) : data;
}
function formatBytes(size: number): string {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(2)} ${units[unit]}`;
}
export default getFileSystemInfo;
