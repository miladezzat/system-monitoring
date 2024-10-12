import { exec } from "child_process";
import { promisify } from "util";
import { FileSystemInfo, SystemMonitorError } from "./types";

const execPromise = promisify(exec);

/**
 * Retrieves information about the file system, including disk space usage.
 *
 * - On Windows, it uses `wmic` to get the size, free space, and caption of logical disks.
 * - On Unix-based systems, it uses the `df -h` command to display the file system usage in a human-readable format.
 *
 * @param {("json" | "raw")} [format="json"] - The format of the response. Defaults to "json".
 * @returns {Promise<FileSystemInfo[] | string>} - A promise that resolves to either a parsed JSON array or the raw string output.
 * @throws {SystemMonitorError} - Throws an error if the command execution fails.
 *
 * @example
 * getFileSystemInfo()
 *   .then(info => console.log(info))
 *   .catch(error => console.error('Error retrieving file system info:', error));
 */
export async function getFileSystemInfo(
  format: "json" | "raw" = "json",
): Promise<FileSystemInfo[] | string> {
  const cmd =
    process.platform === "win32"
      ? "wmic logicaldisk get size,freespace,caption" // Windows command to get disk information
      : "df -h"; // Unix-based command to show disk usage in human-readable format

  try {
    const { stdout, stderr } = await execPromise(cmd);

    if (stderr) {
      throw new SystemMonitorError(
        `Error occurred while fetching file system info: ${stderr}`,
        "FileSystemInfoRetrievalError",
      );
    }

    // If the format is "raw", return the raw output directly
    if (format === "raw") {
      return stdout;
    }

    // Otherwise, process the command output and return it in JSON format
    const fileSystemInfo = parseFileSystemOutput(stdout);
    return fileSystemInfo;
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve file system info: ${(error as Error)?.message || String(error)}`,
      "FileSystemInfoRetrievalError",
      (error as Error)?.stack,
    );
  }
}

/**
 * Parses the output from the `wmic` or `df -h` command into a structured JSON format.
 *
 * @param {string} output - The raw output from the command.
 * @returns {FileSystemInfo[]} - An array of objects representing the file system information.
 */
function parseFileSystemOutput(output: string): FileSystemInfo[] {
  const lines = output.trim().split("\n");

  if (process.platform === "win32") {
    // For Windows: Skip the header and process the `wmic` command output
    const dataLines = lines.slice(1); // Skip the first line (header)
    return dataLines.map((line) => {
      const [caption, freeSpace, size] = line.trim().split(/\s+/);
      return {
        caption: caption || "N/A",
        freeSpace: formatBytes(freeSpace),
        size: formatBytes(size),
      };
    });
  } else {
    // For Unix-based systems: Skip the header and process the `df -h` command output
    const dataLines = lines.slice(1); // Skip the first line (header)
    return dataLines.map((line) => {
      const columns = line.trim().split(/\s+/);
      return {
        caption: columns[0], // File System Name
        size: columns[1], // Total Size
        freeSpace: columns[3], // Available Free Space
      };
    });
  }
}

/**
 * Helper function to format bytes into human-readable form (e.g., KB, MB, GB).
 * This is mainly for the Windows output since `df -h` already formats it.
 *
 * @param {string} bytes - The size in bytes.
 * @returns {string} - The size formatted in human-readable form.
 */
function formatBytes(bytes: string): string {
  const size = Number(bytes);
  if (isNaN(size)) return "N/A";
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;

  let value = size;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export default getFileSystemInfo;
