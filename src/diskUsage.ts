import { execSync } from "child_process";
import { EnhancedDiskUsage } from "./types";

/**
 * Retrieves detailed disk usage data by executing a system command.
 * Parses the output of the 'df -k' command to extract information such as filesystem type,
 * total size, used space, available space, usage percentage, and mount point for each partition.
 *
 * @returns {EnhancedDiskUsage[] | null} An array of disk usage information for each partition, or null in case of an error.
 */
export function getDiskUsage(): EnhancedDiskUsage[] | null {
  try {
    // Execute the 'df -k' command to get disk usage details
    const output = execSync("df -k").toString();

    // Parse the output into detailed disk usage information
    return parseDiskUsage(output);
  } catch (error) {
    console.error("Error fetching disk usage:", error);
    return null;
  }
}

/**
 * Parses the output of the 'df -k' command to extract disk usage details for each partition.
 *
 * @param {string} output - The output string from 'df -k'.
 * @returns {EnhancedDiskUsage[]} An array of parsed disk usage information.
 */
export function parseDiskUsage(output: string): EnhancedDiskUsage[] {
  const lines = output.trim().split("\n");

  // Array to store disk usage details for each partition
  const diskUsages: EnhancedDiskUsage[] = [];

  // Iterate over the lines, starting from the second line (to skip the headers)
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/);

    if (parts.length >= 6) {
      // Construct an object with detailed disk usage information
      const diskUsage: EnhancedDiskUsage = {
        filesystem: parts[0], // Filesystem name
        total: parseInt(parts[1], 10) * 1024, // Total size (converted to bytes)
        used: parseInt(parts[2], 10) * 1024, // Used size (converted to bytes)
        available: parseInt(parts[3], 10) * 1024, // Available size (converted to bytes)
        usedPercentage: parseInt(parts[4].replace("%", ""), 10), // Used percentage
        mountPoint: parts[5], // Mount point of the filesystem
      };

      diskUsages.push(diskUsage);
    }
  }

  return diskUsages;
}
