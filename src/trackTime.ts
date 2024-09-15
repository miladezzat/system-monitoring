// src/middlewares/trackTime.ts
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

/**
 * Options for tracking request/response time.
 * @typedef {Object} TrackTimeOptions
 * @property {string} [filePath] - The path to the file where logs should be stored.
 * @property {(logData: LogData) => void} [storeOnDb] - Callback function to store log data in a database.
 */
export interface TrackTimeOptions {
  filePath?: string;
  storeOnDb?: (logData: LogData) => void;
}

/**
 * Log data structure.
 * @typedef {Object} LogData
 * @property {string} method - The HTTP method of the request.
 * @property {string} url - The requested URL.
 * @property {string} responseTime - The response time in milliseconds.
 * @property {string} timestamp - The timestamp of the request.
 */
export interface LogData {
  method: string;
  url: string;
  responseTime: string;
  timestamp: string;
}

/**
 * Writes log data to a specified file in JSON format.
 *
 * @param {LogData} logData - Data to log.
 * @param {string} filePath - Path to the log file.
 */
function logToFile(logData: LogData, filePath: string): void {
  const dir = path.dirname(filePath);

  // Ensure the log directory exists, if not, create it
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
 * Logs can either be stored in a file or sent to a database via a callback.
 *
 * @param {TrackTimeOptions} options - Options to configure logging behavior.
 * @returns {(req: Request, res: Response, next: NextFunction) => void} - Express middleware function.
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
