import os from "os";
import { LoadAverage, SystemMonitorError } from "./types";

/**
 * Retrieves the system load averages over 1, 5, and 15 minutes.
 *
 * The load average represents the average number of processes that are either
 * in a runnable or uninterruptible state. It gives an indication of how busy
 * the system is.
 *
 * - `load1min`: The average number of processes over the last minute.
 * - `load5min`: The average number of processes over the last 5 minutes.
 * - `load15min`: The average number of processes over the last 15 minutes.
 *
 * These values are useful for determining system load trends:
 * - If the value is higher than the number of CPU cores, the system may be overloaded.
 * - If it's lower, the system is handling the load well.
 *
 * **Note:** On Windows systems, `os.loadavg()` always returns `[0, 0, 0]` because
 * load average is a Unix-specific concept and is not supported by Windows.
 *
 * @returns {LoadAverage} An object containing the system's load averages:
 *  - `load1min` (number): System load over the last 1 minute.
 *  - `load5min` (number): System load over the last 5 minutes.
 *  - `load15min` (number): System load over the last 15 minutes.
 *
 * @throws {SystemMonitorError} If there is an issue retrieving the load averages,
 * a custom error is thrown with details about the failure, including the error message and stack trace.
 *
 * @example
 * try {
 *   const loadAverage = getLoadAverage();
 *   console.log('Load Average:', loadAverage);
 * } catch (error) {
 *   console.error('Failed to retrieve load average:', error);
 * }
 */
export function getLoadAverage(): LoadAverage {
  try {
    const [load1min, load5min, load15min] = os.loadavg();

    return {
      load1min,
      load5min,
      load15min,
    };
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve load averages: ${(error as Error)?.message || String(error)}`,
      "LoadAverageError",
      (error as Error)?.stack,
    );
  }
}

export default getLoadAverage;
