import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Interface representing a network connection.
 */
export interface NetworkConnection {
  protocol: string;
  localAddress: string;
  foreignAddress: string;
  state: string;
}

/**
 * Retrieves the active network connections on the system.
 *
 * - On Windows, it uses the `netstat` command to get network connections.
 * - On Unix-based systems, it uses `netstat -tn` to list TCP connections in numeric form.
 *
 * @param {("json" | "raw")} [format="json"] - The format of the response. Defaults to "json".
 * @returns {Promise<NetworkConnection[] | string>} - A promise that resolves to either a parsed JSON array of network connections or the raw string output.
 * @throws {Error} - Throws an error if the command execution fails or an unknown error occurs.
 */
export async function getActiveConnections(
  format: "json" | "raw" = "json",
): Promise<NetworkConnection[] | string> {
  const cmd =
    process.platform === "win32"
      ? "netstat" // Windows command
      : "netstat -tn"; // Unix-based command

  try {
    const { stdout, stderr } = await execPromise(cmd);

    if (stderr) {
      throw new Error(
        `Error occurred while fetching active connections: ${stderr}`,
      );
    }

    // If the format is "raw", return the raw output directly
    if (format === "raw") {
      return stdout;
    }

    // Otherwise, process the command output and return it in JSON format
    const connections = parseNetstatOutput(stdout);

    return connections;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to retrieve active connections: ${error.message}`,
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

/**
 * Parses the output from the `netstat` command into a structured JSON format.
 *
 * @param {string} output - The raw output from the `netstat` command.
 * @returns {NetworkConnection[]} - An array of objects representing the active connections.
 */
export function parseNetstatOutput(output: string): NetworkConnection[] {
  const lines = output.trim().split("\n");

  // Determine the starting index of the actual data (skip headers)
  const dataStartIndex = lines.findIndex((line) => line.includes("Proto"));

  if (dataStartIndex === -1) {
    throw new Error("Failed to parse netstat output");
  }

  const dataLines = lines.slice(dataStartIndex + 1); // Skip header line

  // Example fields: Proto, Local Address, Foreign Address, State (on Unix)
  return dataLines.map((line) => {
    const columns = line.trim().split(/\s+/);

    // Adjust parsing for Windows or Unix-based systems based on column count
    if (process.platform === "win32") {
      return {
        protocol: columns[0],
        localAddress: columns[1],
        foreignAddress: columns[2],
        state: columns[columns.length - 1], // The state is always the last column in Windows
      };
    } else {
      return {
        protocol: columns[0],
        localAddress: columns[3],
        foreignAddress: columns[4],
        state: columns[5],
      };
    }
  });
}
