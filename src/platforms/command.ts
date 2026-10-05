import { execFile } from "node:child_process";

export class CapabilityUnavailableError extends Error {
  readonly code = "UNAVAILABLE";
}
export interface CommandOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  maxBuffer?: number;
  acceptedExitCodes?: readonly number[];
}
/** Fixed executable, separate arguments, bounded output and duration. */
export function runCommand(
  file: string,
  args: readonly string[],
  options: CommandOptions = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      [...args],
      {
        encoding: "utf8",
        shell: false,
        windowsHide: true,
        timeout: options.timeoutMs ?? 2000,
        maxBuffer: options.maxBuffer ?? 1024 * 1024,
        killSignal: "SIGKILL",
        signal: options.signal,
        env: { ...process.env, LC_ALL: "C" },
      },
      (error, stdout, stderr) => {
        if (error && !options.acceptedExitCodes?.includes(Number(error.code))) {
          reject(
            error.code === "ENOENT"
              ? new CapabilityUnavailableError(`${file} is not available`)
              : error,
          );
          return;
        }
        resolve({ stdout, stderr, exitCode: error ? Number(error.code) : 0 });
      },
    );
  });
}
