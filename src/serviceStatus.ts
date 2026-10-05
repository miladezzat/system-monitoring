import { ServiceStatus } from "./types";
import { runCommand } from "./platforms/command";

/** Query a service without a shell. Unsupported managers return unknown. */
export async function getServiceStatus(
  serviceName: string,
): Promise<ServiceStatus> {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.@:$ -]{0,255}$/.test(serviceName))
    throw new TypeError("Invalid service name");
  if (process.platform === "win32") {
    const { stdout, exitCode } = await runCommand(
      "sc.exe",
      ["query", serviceName],
      { acceptedExitCodes: [1060] },
    );
    if (exitCode === 1060) return "unknown";
    return /\bRUNNING\b/.test(stdout) ? "running" : "inactive";
  }
  if (process.platform !== "linux") return "unknown";
  const { stdout } = await runCommand(
    "systemctl",
    ["is-active", "--", serviceName],
    { acceptedExitCodes: [3, 4] },
  );
  const state = stdout.trim();
  if (state === "active") return "running";
  if (state === "inactive" || state === "failed") return "inactive";
  return "unknown";
}
export default getServiceStatus;
