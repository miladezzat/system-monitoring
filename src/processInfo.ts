import { MonitorData } from "./types";
import { SystemMonitorError } from "./types"; // Import the custom error

/**
 * Asynchronously retrieves the CPU and memory usage for the current process.
 *
 * The function provides detailed information about the CPU time used by the process and the memory
 * footprint, including the Resident Set Size (RSS).
 *
 * @async
 * @function getProcessInfo
 * @returns {Promise<MonitorData['processInfo']>} A promise that resolves to an object containing
 * CPU and memory usage data for the current process.
 *
 * @throws {SystemMonitorError} If there is an issue retrieving the process information, a custom error
 * is thrown with details about the failure, including the error message and stack trace.
 *
 * @example
 * getProcessInfo()
 *   .then(processInfo => {
 *     console.log('Process CPU Usage:', processInfo.cpu, 'ms');
 *     console.log('Process Memory Usage:', processInfo.memory, 'bytes');
 *   })
 *   .catch(error => {
 *     console.error('Failed to retrieve process info:', error);
 *   });
 */
export async function getProcessInfo(): Promise<MonitorData["processInfo"]> {
  try {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000;

    return {
      cpu: cpuPercent,
      memory: memoryUsage.rss, // Resident Set Size
    };
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve process information: ${(error as Error)?.message || String(error)}`,
      "ProcessInfoError",
      (error as Error)?.stack,
    );
  }
}

export default getProcessInfo;
