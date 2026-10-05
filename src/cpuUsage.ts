import os from "os";
import { CpuCoreInfo, CpuInfo, SystemMonitorError } from "./types";

/**
 * Retrieves cumulative CPU counters and lifetime utilization. Use createMonitor for interval utilization.
 * It gathers information like total CPU time, idle time, user/system time, and CPU usage percentages.
 *
 * The function provides an overall summary of the CPU, as well as core-specific data.
 *
 * @function getCpuInfo
 *
 * @returns {Promise<CpuInfo>} A promise that resolves to an object containing detailed CPU statistics.
 *
 * @throws {CustomError} Throws a custom error object containing message, statusCode, and stack trace.
 *
 * @example
 *
 * getCpuInfo()
 *   .then(cpuInfo => {
 *     console.log('Total CPU Usage:', cpuInfo.usagePercentage, '%');
 *     console.log('Per-Core Details:', cpuInfo.coreDetails);
 *   })
 *   .catch(error => {
 *     console.error('Error occurred:', error);
 *   });
 */
export async function getCpuInfo(): Promise<CpuInfo> {
  try {
    const cpus = os.cpus(); // Retrieves an array of CPU core objects.

    // Initialize total time counters for all cores.
    let totalUserTime = 0;
    let totalSystemTime = 0;
    let totalIdleTime = 0;

    /**
     * Maps each CPU core's time statistics and calculates its usage percentage.
     *
     * @type {CpuCoreInfo[]} An array of core-specific CPU information.
     */
    const coreDetails: CpuCoreInfo[] = cpus.map((cpu, index) => {
      const userTime = cpu.times.user;
      const systemTime = cpu.times.sys;
      const idleTime = cpu.times.idle;

      const totalTime =
        userTime + systemTime + idleTime + cpu.times.nice + cpu.times.irq;
      const usedTime = totalTime - idleTime;
      const usagePercentage = totalTime ? (usedTime / totalTime) * 100 : 0;

      // Accumulate total times for all cores.
      totalUserTime += userTime;
      totalSystemTime += systemTime;
      totalIdleTime += idleTime;

      return {
        coreId: index,
        userTime,
        systemTime,
        idleTime,
        totalTime,
        usagePercentage: parseFloat(usagePercentage.toFixed(2)), // Round to 2 decimal places.
      };
    });

    // Calculate the aggregate total CPU times across all cores.
    const totalTime = coreDetails.reduce(
      (sum, core) => sum + core.totalTime,
      0,
    );
    const usedTime = totalTime - totalIdleTime;
    const usagePercentage = totalTime ? (usedTime / totalTime) * 100 : 0;

    /**
     * Returns the aggregated CPU statistics and core-specific details.
     *
     * @type {CpuInfo}
     */
    return {
      totalUserTime,
      totalSystemTime,
      totalIdleTime,
      totalTime,
      usedTime,
      idleTime: totalIdleTime,
      usagePercentage: parseFloat(usagePercentage.toFixed(2)),
      coreDetails,
    };
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      // Throwing a custom error with message, statusCode, and stack trace
      throw new SystemMonitorError(
        `Failed to retrieve CPU info: ${error.message}`,
        (error as Error)?.name || "",
        error.stack,
      );
    } else {
      throw new SystemMonitorError(
        "Unknown error occurred while retrieving CPU info",
      );
    }
  }
}

export default getCpuInfo;
