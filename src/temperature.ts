import { readFile } from "node:fs/promises";
import { runCommand } from "./platforms/command";

export async function getTemperature(
  signal?: AbortSignal,
): Promise<number | undefined> {
  if (process.platform === "linux") {
    try {
      const value =
        Number(
          (
            await readFile("/sys/class/thermal/thermal_zone0/temp", {
              encoding: "utf8",
              signal,
            })
          ).trim(),
        ) / 1000;
      return Number.isFinite(value) ? value : undefined;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  }
  if (process.platform === "win32") {
    const { stdout } = await runCommand(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Get-CimInstance -Namespace root/wmi MSAcpi_ThermalZoneTemperature | Select-Object -First 1 -ExpandProperty CurrentTemperature",
      ],
      { signal },
    );
    const value = Number(stdout.trim());
    return stdout.trim() && Number.isFinite(value)
      ? value / 10 - 273.15
      : undefined;
  }
  return undefined;
}
export default getTemperature;
