import fs from "fs";
import { SystemMonitorError } from "./types"; // Import the custom error class

/**
 * Retrieves logs from a specified file and optionally filters them by a keyword.
 *
 * @param {string} path - The path to the log file.
 * @param {string} [keyword] - An optional keyword to filter logs.
 * @returns {Promise<string[]>} - A promise that resolves to an array of log lines,
 *   either filtered by the keyword or the complete log data if no keyword is provided.
 * @throws {SystemMonitorError} - Throws a structured error if file reading fails or an unknown error occurs.
 *
 * @example
 * getLogs('/path/to/logfile.log', 'ERROR')
 *   .then(logs => console.log('Filtered logs:', logs))
 *   .catch(error => console.error('Error retrieving logs:', error));
 */
export async function getLogs(
  path: string,
  keyword?: string,
): Promise<string[]> {
  try {
    const logs = fs.readFileSync(path, "utf8");
    const logLines = logs.split("\n");

    // If a keyword is provided, filter the log lines
    if (keyword) {
      return logLines.filter((line) => line.includes(keyword));
    }

    return logLines; // Return all log lines if no keyword is provided
  } catch (error) {
    throw new SystemMonitorError(
      `Failed to read logs from file: ${(error as Error)?.message || String(error)}`,
      "LogFileReadError",
      (error as Error)?.stack,
    );
  }
}

export default getLogs;
