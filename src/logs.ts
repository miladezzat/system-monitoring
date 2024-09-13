import fs from "fs";

/**
 * Get logs from a specified file and optionally filter by a keyword.
 * @param {string} path - The log file path.
 * @param {string} [keyword] - Optional keyword to filter logs.
 * @returns {Promise<string[]>} Filtered or complete log data.
 */
export async function getLogs(
  path: string,
  keyword?: string,
): Promise<string[]> {
  try {
    const logs = fs.readFileSync(path, "utf8");
    const logLines = logs.split("\n");
    if (keyword) {
      return logLines.filter((line) => line.includes(keyword));
    }
    return logLines;
  } catch (err) {
    console.error("Error reading logs:", err);
    return [];
  }
}
