import type { ScheduledTask, ScheduledTasksResponse } from "./types";
import { runCommand } from "./platforms/command";

function csvRow(line: string): string[] {
  const cells: string[] = [];
  let cell = "",
    quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += c;
  }
  cells.push(cell);
  return cells;
}
export function parseScheduledTasks(
  output: string,
  platform: NodeJS.Platform = process.platform,
): ScheduledTask[] {
  return output
    .split(/\r?\n/)
    .filter(
      (line) =>
        line.trim() &&
        !/^\s*#/.test(line) &&
        (platform === "win32" || !/^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/.test(line)),
    )
    .map((line) => {
      if (platform !== "win32")
        return { name: "Cron Job", details: line.trim() };
      const [name, ...details] = csvRow(line);
      return { name, details: details.join(" | ") };
    });
}
export async function getScheduledTasks(
  signal?: AbortSignal,
): Promise<ScheduledTasksResponse> {
  const windows = process.platform === "win32";
  const { stdout, stderr, exitCode } = await runCommand(
    windows ? "schtasks.exe" : "crontab",
    windows ? ["/Query", "/FO", "CSV", "/NH"] : ["-l"],
    { signal, acceptedExitCodes: windows ? [] : [1] },
  );
  if (exitCode === 1 && /no crontab/i.test(stderr)) return { tasks: [] };
  if (exitCode !== 0) throw new Error(stderr || "Scheduled task query failed");
  return { tasks: parseScheduledTasks(stdout) };
}
export default getScheduledTasks;
