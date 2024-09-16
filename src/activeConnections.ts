import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Retrieves the active network connections on the system.
 *
 * - On Windows, it uses the `netstat` command to get network connections.
 * - On Unix-based systems, it uses `netstat -tn` to list TCP connections in numeric form.
 *
 * @returns {Promise<string>} - A promise that resolves to the command output containing the list of active connections.
 * @throws {Error} - Throws an error if the command execution fails or an unknown error occurs.
 */
export async function getActiveConnections(): Promise<string> {
  // Determine the command to execute based on the operating system
  const cmd =
    process.platform === "win32"
      ? "netstat" // Windows command to list network connections
      : "netstat -tn"; // Unix-based command to list TCP connections in numeric form

  try {
    const { stdout, stderr } = await execPromise(cmd);

    // If there’s any error output (stderr), treat it as an error
    if (stderr) {
      throw new Error(
        `Error occurred while fetching active connections: ${stderr}`,
      );
    }

    // Return the command's standard output
    return stdout;
  } catch (error) {
    // Ensure 'error' is treated as an instance of 'Error'
    if (error instanceof Error) {
      throw new Error(
        `Failed to retrieve active connections: ${error.message}`,
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}
