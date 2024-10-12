import { execSync } from "child_process";
import { EnhancedDiskUsage } from "./types";
import { SystemMonitorError } from "./types"; // Import the custom error

/**
 * Retrieves detailed disk usage data by executing a system command.
 * Parses the output of the 'df -k' command to extract information such as filesystem type,
 * total size, used space, available space, usage percentage, and mount point for each partition.
 *
 * @function getDiskUsage
 * @returns {EnhancedDiskUsage[] | null} An array of disk usage information for each partition,
 * or null in case of an error.
 *
 * @throws {SystemMonitorError} If there is an issue executing the disk usage command or parsing the output,
 * a custom error is thrown with details about the failure.
 *
 * @example
 * const diskUsage = getDiskUsage();
 * if (diskUsage) {
 *   console.log('Disk usage:', diskUsage);
 * } else {
 *   console.error('Failed to retrieve disk usage data.');
 * }
 */
export function getDiskUsage(): EnhancedDiskUsage[] | null {
  try {
    // Execute the 'df -k' command to get disk usage details
    const output = execSync("df -k").toString();

    // Parse the output into detailed disk usage information
    return parseDiskUsage(output);
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve disk usage: ${(error as Error)?.message || String(error)}`,
      "DiskUsageError",
      (error as Error)?.stack,
    );
  }
}

/**
 * Parses the output of the 'df -k' command to extract disk usage details for each partition.
 *
 * @param {string} output - The output string from the 'df -k' command.
 * @returns {EnhancedDiskUsage[]} An array of parsed disk usage information.
 *
 * @throws {SystemMonitorError} If the parsing fails due to incorrect output or format,
 * a custom error is thrown.
 *
 * @example
 * const output = execSync("df -k").toString();
 * const diskUsages = parseDiskUsage(output);
 * console.log('Parsed disk usages:', diskUsages);
 */
export function parseDiskUsage(output: string): EnhancedDiskUsage[] {
  try {
    const lines = output.trim().split("\n");

    // Array to store disk usage details for each partition
    const diskUsages: EnhancedDiskUsage[] = [];

    // Iterate over the lines, starting from the second line (to skip the headers)
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);

      if (parts.length >= 6) {
        // Construct an object with detailed disk usage information
        const diskUsage: EnhancedDiskUsage = {
          filesystem: parts?.[0], // Filesystem name
          total: parseInt(parts?.[1], 10) * 1024, // Total size (converted to bytes)
          used: parseInt(parts?.[2], 10) * 1024, // Used size (converted to bytes)
          available: parseInt(parts?.[3], 10) * 1024, // Available size (converted to bytes)
          usedPercentage: parseInt(parts?.[4].replace("%", ""), 10), // Used percentage
          mountPoint: parts?.[5], // Mount point of the filesystem
        };

        diskUsages.push(diskUsage);
      }
    }

    return diskUsages;
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError during parsing
    throw new SystemMonitorError(
      `Failed to parse disk usage output: ${(error as Error)?.message || String(error)}`,
      "DiskUsageParsingError",
      (error as Error)?.stack,
    );
  }
}

export default getDiskUsage;
