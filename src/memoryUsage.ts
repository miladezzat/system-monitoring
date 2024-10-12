import os from "os";
import { MonitorData } from "./types";
import { SystemMonitorError } from "./types"; // Import the custom error

/**
 * Asynchronously retrieves memory usage statistics, including total, free, and used memory.
 *
 * The function gathers system memory information and calculates the used memory by subtracting
 * the free memory from the total memory available on the system.
 *
 * @async
 * @function getMemoryUsage
 *
 * @returns {Promise<MonitorData['memoryUsage']>} A promise that resolves to an object containing
 * memory usage data with properties for total, free, and used memory.
 *
 * @throws {SystemMonitorError} If there is an issue retrieving memory usage data, a custom error is thrown
 * with details about the failure, including the error message and stack trace.
 *
 * @example
 * getMemoryUsage()
 *   .then(memoryData => {
 *     console.log('Total Memory:', memoryData.totalMemory);
 *     console.log('Free Memory:', memoryData.freeMemory);
 *     console.log('Used Memory:', memoryData.usedMemory);
 *   })
 *   .catch(error => {
 *     console.error('Error fetching memory usage:', error);
 *   });
 */
export async function getMemoryUsage(): Promise<MonitorData["memoryUsage"]> {
  try {
    const totalMemory = os.totalmem(); // Get total system memory
    const freeMemory = os.freemem(); // Get free system memory
    const usedMemory = totalMemory - freeMemory; // Calculate used memory

    // Return memory usage details
    return {
      totalMemory,
      freeMemory,
      usedMemory,
    };
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve memory usage: ${(error as Error)?.message || String(error)}`,
      "MemoryUsageError",
      (error as Error)?.stack,
    );
  }
}

export default getMemoryUsage;
