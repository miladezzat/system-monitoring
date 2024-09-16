import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export interface ScheduledTask {
  name: string;
  details: string;
}

export interface ScheduledTasksResponse {
  tasks: ScheduledTask[];
  error?: string;
}

/**
 * Parses the command output into a structured format.
 *
 * @param output - The raw command output as a string.
 * @returns {ScheduledTask[]} - An array of objects representing the scheduled tasks.
 */
function parseTasks(output: string): ScheduledTask[] {
  const tasks: ScheduledTask[] = [];

  if (process.platform === "win32") {
    // Example parsing logic for Windows `schtasks` output
    const lines = output.split("\n");
    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length > 1) {
        tasks.push({
          name: parts[0],
          details: parts.slice(1).join(" "),
        });
      }
    });
  } else {
    // Example parsing logic for Unix `crontab -l` output
    const lines = output.split("\n");
    lines.forEach((line) => {
      if (line.trim() !== "") {
        tasks.push({
          name: "Cron Job",
          details: line.trim(),
        });
      }
    });
  }

  return tasks;
}

/**
 * Retrieves a list of scheduled tasks from the system and parses them into an object.
 *
 * - On Windows, it uses the `schtasks` command to list scheduled tasks.
 * - On Unix-based systems, it uses `crontab -l` to list the current user's cron jobs.
 *
 * @returns {Promise<ScheduledTasksResponse>} - A promise that resolves to an object containing the list of scheduled tasks.
 * @throws {Error} - Throws an error if the command execution fails or an unknown error occurs.
 */
export async function getScheduledTasks(): Promise<ScheduledTasksResponse> {
  // Determine the command to execute based on the operating system
  const cmd =
    process.platform === "win32"
      ? "schtasks" // Windows command to list scheduled tasks
      : "crontab -l"; // Unix-based command to list cron jobs

  try {
    const { stdout, stderr } = await execPromise(cmd);

    // If there’s any error output (stderr), treat it as an error
    if (stderr) {
      return {
        tasks: [],
        error: `Error occurred while fetching scheduled tasks: ${stderr}`,
      };
    }

    // Parse the command's standard output
    const tasks = parseTasks(stdout);

    return { tasks };
  } catch (error) {
    // Ensure 'error' is treated as an instance of 'Error'
    if (error instanceof Error) {
      throw new Error(`Failed to retrieve scheduled tasks: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}
