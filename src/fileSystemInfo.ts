import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Retrieves information about the file system, including disk space usage.
 *
 * - On Windows, it uses `wmic` to get the size, free space, and caption of logical disks.
 * - On Unix-based systems, it uses the `df -h` command to display the file system usage in a human-readable format.
 *
 * @returns {Promise<string>} - A promise that resolves to the file system information as a string.
 * @throws {Error} - Throws an error if the command execution fails.
 */
export async function getFileSystemInfo(): Promise<string> {
  // Determine the command to execute based on the operating system
  const cmd =
    process.platform === "win32"
      ? "wmic logicaldisk get size,freespace,caption" // Windows command to get disk information
      : "df -h"; // Unix-based command to show disk usage in human-readable format

  try {
    const { stdout, stderr } = await execPromise(cmd);

    // If there’s any error output (stderr), treat it as an error
    if (stderr) {
      throw new Error(
        `Error occurred while fetching file system info: ${stderr}`,
      );
    }

    // Return the command's standard output
    return stdout;
  } catch (error) {
    // Ensure 'error' is treated as an instance of 'Error'
    if (error instanceof Error) {
      // Handle and re-throw the error with additional context
      throw new Error(`Failed to retrieve file system info: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}
