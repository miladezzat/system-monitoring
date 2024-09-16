import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export type ServiceStatus = "running" | "inactive" | "unknown";

/**
 * Retrieves the status of a given service.
 *
 * - On Windows, it uses the `sc query` command to check the service status.
 * - On Unix-based systems, it uses the `systemctl is-active` command to determine if the service is active.
 *
 * @param serviceName - The name of the service whose status is to be checked.
 * @returns {Promise<ServiceStatus>} - A promise that resolves to the service status:
 *   - `'running'` if the service is running,
 *   - `'inactive'` if the service is not running,
 *   - `'unknown'` if the status could not be determined or an error occurred.
 * @throws {Error} - Throws an error if the command execution fails or an unknown error occurs.
 */
export async function getServiceStatus(
  serviceName: string,
): Promise<ServiceStatus> {
  // Determine the command to execute based on the operating system
  const cmd =
    process.platform === "win32"
      ? `sc query ${serviceName}` // Windows command to get service status
      : `systemctl is-active ${serviceName}`; // Unix-based command to check if the service is active

  try {
    const { stdout, stderr } = await execPromise(cmd);

    // If there’s any error output (stderr), treat it as an error
    if (stderr) {
      throw new Error(
        `Error occurred while checking service status: ${stderr}`,
      );
    }

    if (process.platform === "win32") {
      // On Windows, check if the service status includes 'RUNNING'
      return stdout.includes("RUNNING") ? "running" : "inactive";
    } else {
      // On Unix-based systems, check if the output is 'active'
      return stdout.trim() === "active" ? "running" : "inactive";
    }
  } catch (error) {
    // Ensure 'error' is treated as an instance of 'Error'
    if (error instanceof Error) {
      throw new Error(`Failed to retrieve service status: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}
