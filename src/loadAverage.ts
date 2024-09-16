import os from "os";

/**
 * Type definition for load average information.
 */
export interface LoadAverage {
  load1min: number;
  load5min: number;
  load15min: number;
}
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
 */
export function getLoadAverage(): LoadAverage {
  const [load1min, load5min, load15min] = os.loadavg();

  return {
    load1min,
    load5min,
    load15min,
  };
}
