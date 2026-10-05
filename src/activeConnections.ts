import type { NetworkConnection } from "./types";
import { runCommand } from "./platforms/command";

export async function getActiveConnections(
  format: "json" | "raw" = "json",
  signal?: AbortSignal,
): Promise<NetworkConnection[] | string> {
  const args =
    process.platform === "win32" || process.platform === "darwin"
      ? ["-an", "-p", "tcp"]
      : ["-tn"];
  const { stdout } = await runCommand("netstat", args, { signal });
  return format === "raw" ? stdout : parseNetstatOutput(stdout);
}
export function parseNetstatOutput(
  output: string,
  platform: NodeJS.Platform = process.platform,
): NetworkConnection[] {
  const lines = output.trim().split(/\r?\n/);
  const header = lines.findIndex((line) => /\bProto\b/i.test(line));
  if (header < 0) throw new Error("Failed to parse netstat output");
  return lines
    .slice(header + 1)
    .filter((line) => /^\s*tcp/i.test(line))
    .map((line) => {
      const columns = line.trim().split(/\s+/);
      const offset = platform === "win32" ? 1 : 3;
      if (columns.length < offset + 3)
        throw new Error("Invalid TCP connection output");
      return {
        protocol: columns[0],
        localAddress: columns[offset],
        foreignAddress: columns[offset + 1],
        state: columns[offset + 2],
      };
    });
}
export default getActiveConnections;
