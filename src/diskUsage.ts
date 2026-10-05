import type { EnhancedDiskUsage } from "./types";
import { runCommand } from "./platforms/command";

/** Async mounted-volume collection; new monitors use built-in statfs for requested paths. */
export async function getDiskUsage(
  signal?: AbortSignal,
): Promise<EnhancedDiskUsage[]> {
  if (process.platform === "win32") {
    const { stdout } = await runCommand(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,Size,FreeSpace | ConvertTo-Json -Compress",
      ],
      { signal },
    );
    return parseWindowsDiskOutput(stdout);
  }
  const { stdout } = await runCommand("df", ["-kP"], { signal });
  return parseDiskUsage(stdout);
}
export function parseWindowsDiskOutput(output: string): EnhancedDiskUsage[] {
  const parsed: unknown = JSON.parse(output || "[]");
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return rows
    .filter((row) => row && row.Size !== null)
    .map((row) => {
      const total = Number(row.Size),
        available = Number(row.FreeSpace);
      if (
        !Number.isFinite(total) ||
        !Number.isFinite(available) ||
        typeof row.DeviceID !== "string"
      )
        throw new Error("Invalid Windows disk data");
      return {
        filesystem: row.DeviceID,
        mountPoint: row.DeviceID,
        total,
        available,
        used: total - available,
        usedPercentage: total ? ((total - available) / total) * 100 : 0,
      };
    });
}
export function parseDiskUsage(output: string): EnhancedDiskUsage[] {
  const lines = output.trim().split(/\r?\n/);
  const mountIndex = /\biused\b/i.test(lines[0]) ? 8 : 5;
  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      const total = Number(parts[1]) * 1024,
        used = Number(parts[2]) * 1024,
        available = Number(parts[3]) * 1024;
      const usedPercentage = Number(parts[4]?.replace("%", ""));
      if (
        parts.length <= mountIndex ||
        ![total, used, available, usedPercentage].every(Number.isFinite)
      )
        throw new Error("Invalid df output");
      return {
        filesystem: parts[0],
        total,
        used,
        available,
        usedPercentage,
        mountPoint: parts.slice(mountIndex).join(" "),
      };
    });
}
export default getDiskUsage;
