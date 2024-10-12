import os from "os";
import { SystemMonitorError } from "./types"; // Import the custom error

/**
 * Asynchronously retrieves the system uptime in seconds.
 *
 * The function returns the total number of seconds the system has been running since the last boot,
 * providing valuable information for system monitoring and diagnostics.
 *
 * @async
 * @function getSystemUptime
 * @returns {Promise<number>} A promise that resolves to the system uptime in seconds.
 *
 * @throws {SystemMonitorError} If there is an issue retrieving the system uptime, a custom error
 * is thrown with details about the failure, including the error message and stack trace.
 *
 * @example
 * getSystemUptime()
 *   .then(uptime => {
 *     console.log('System Uptime:', uptime, 'seconds');
 *   })
 *   .catch(error => {
 *     console.error('Failed to retrieve system uptime:', error);
 *   });
 */
export async function getSystemUptime(): Promise<number> {
  try {
    // Retrieve system uptime in seconds
    return os.uptime();
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve system uptime: ${(error as Error)?.message || String(error)}`,
      "SystemUptimeError",
      (error as Error)?.stack,
    );
  }
}

export default getSystemUptime;
