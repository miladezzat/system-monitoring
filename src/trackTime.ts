// src/middlewares/trackTime.ts
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { LogData, TrackTimeOptions } from "./types";

/**
 * Writes log data to a specified file in JSON format.
 *
 * @param {LogData} logData - Data to log.
 * @param {string} filePath - Path to the log file.
 */
function logToFile(logData: LogData, filePath: string): void {
  const dir = path.dirname(filePath);

  // Ensure the log directory exists; if not, create it
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory: ${dir}`, error);
      return;
    }
  }

  // Log data as a JSON string
  const logEntry = JSON.stringify(logData);

  // Append the log entry to the specified file
  fs.appendFile(filePath, logEntry + "\n", (err) => {
    if (err) {
      console.error(`Error writing to log file: ${filePath}`, err);
    }
  });
}

/**
 * Middleware to track request/response time.
 *
 * This middleware logs the time taken for each request to complete and
 * can store logs either in a file or by invoking a provided callback function
 * to store the log data in a database.
 *
 * @param {TrackTimeOptions} options - Options to configure logging behavior.
 * @returns {(req: Request, res: Response, next: NextFunction) => void} - An Express middleware function.
 *
 * @example
 * app.use(trackTime({ filePath: 'logs/requests.log' }));
 */
export function trackTime(options: TrackTimeOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime(); // Start the high-resolution timer

    res.on("finish", () => {
      const diff = process.hrtime(start); // Calculate the time difference
      const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3); // Convert to milliseconds
      const logData: LogData = {
        method: req.method,
        url: req.originalUrl,
        responseTime: timeInMs,
        timestamp: new Date().toISOString(),
      };

      // If a file path is provided, log to the file
      if (options.filePath) {
        logToFile(logData, options.filePath);
      }

      // If a callback function is provided, send data to the callback (e.g., storing it in the database)
      if (options.storeOnDb) {
        try {
          options.storeOnDb(logData);
        } catch (error) {
          console.error("Error storing log data in database", error);
        }
      }
    });

    next(); // Pass control to the next middleware
  };
}

export default trackTime;
