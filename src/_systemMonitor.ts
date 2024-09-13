/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { execSync } from "child_process"; // To run system commands
import os from "os";
import fs from "fs";

/**
 * Monitor options for system metrics.
 */
export interface MonitorOptions {
  cpu?: boolean;
  memory?: boolean;
  disk?: boolean;
  network?: boolean;
  uptime?: boolean;
  processInfo?: boolean;
  temperature?: boolean;
  logs?: { path: string; keyword?: string };
  responseTime?: boolean;
}

/**
 * Monitor data structure for storing system metrics.
 */
export interface MonitorData {
  cpuUsage?: number;
  memoryUsage?: {
    totalMemory: number;
    freeMemory: number;
    usedMemory: number;
  };
  diskUsage?: DiskUsage | null;
  networkInfo?: any;
  uptime?: number;
  processInfo?: {
    cpu: number;
    memory: number;
  };
  temperature?: number;
  logs?: string[];
  responseTime?: number;
}

/**
 * Disk usage structure to store total, used, and available space.
 */
export interface DiskUsage {
  total: number;
  used: number;
  available: number;
}

// Default monitor options
const defaultOptions: MonitorOptions = {
  cpu: true,
  memory: true,
  disk: true,
  network: true,
  uptime: true,
  processInfo: true,
};

/**
 * Get the CPU usage percentage.
 * @returns {Promise<number>} CPU usage percentage.
 */
export async function getCpuUsage(): Promise<number> {
  const cpus = os.cpus();
  const userTime = cpus.reduce((acc, cpu) => acc + cpu.times.user, 0);
  const sysTime = cpus.reduce((acc, cpu) => acc + cpu.times.sys, 0);
  const idleTime = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);

  const totalTime = userTime + sysTime + idleTime;
  const usagePercent = ((userTime + sysTime) / totalTime) * 100;
  return parseFloat(usagePercent.toFixed(2));
}

/**
 * Get memory usage statistics.
 * @returns {Promise<MonitorData['memoryUsage']>} Memory usage data.
 */
export async function getMemoryUsage(): Promise<MonitorData["memoryUsage"]> {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    totalMemory,
    freeMemory,
    usedMemory,
  };
}

/**
 * Get disk usage data by executing a system command.
 * @returns {DiskUsage | null} Disk usage data or null in case of an error.
 */
export function getDiskUsage(): DiskUsage | null {
  try {
    const output = execSync("df -k").toString();
    const diskUsage = parseDiskUsage(output);
    return {
      total: diskUsage.total * 1024, // Convert to bytes
      used: diskUsage.used * 1024,
      available: diskUsage.available * 1024,
    };
  } catch (error) {
    console.error("Error fetching disk usage:", error);
    return null;
  }
}

/**
 * Parse the disk usage output from the system command.
 * @param {string} output - The output string from `df -k`.
 * @returns {DiskUsage} Parsed disk usage data.
 */
export function parseDiskUsage(output: string): DiskUsage {
  const lines = output.trim().split("\n");
  const totalUsage: DiskUsage = {
    total: 0,
    used: 0,
    available: 0,
  };

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/);
    if (parts.length >= 6) {
      totalUsage.total += parseInt(parts[1], 10); // Total size
      totalUsage.used += parseInt(parts[2], 10); // Used size
      totalUsage.available += parseInt(parts[3], 10); // Available size
    }
  }

  return totalUsage;
}

/**
 * Get network interface information.
 * @returns {Promise<MonitorData['networkInfo']>} Network interface data.
 */
export async function getNetworkInfo(): Promise<MonitorData["networkInfo"]> {
  return os.networkInterfaces();
}

/**
 * Get system uptime in seconds.
 * @returns {Promise<number>} System uptime.
 */
export async function getSystemUptime(): Promise<number> {
  return os.uptime();
}

/**
 * Get process CPU and memory usage.
 * @returns {Promise<MonitorData['processInfo']>} Process info data.
 */
export async function getProcessInfo(): Promise<MonitorData["processInfo"]> {
  const cpuUsage = process.cpuUsage();
  const memoryUsage = process.memoryUsage();
  const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000;
  return {
    cpu: cpuPercent,
    memory: memoryUsage.rss, // Resident Set Size
  };
}

/**
 * Get system temperature based on the platform.
 * @returns {Promise<number | undefined>} Temperature in Celsius or undefined if not supported.
 */
export async function getTemperature(): Promise<number | undefined> {
  try {
    const platform = os.platform();

    if (platform === "linux") {
      const thermalZonePath = "/sys/class/thermal/thermal_zone0/temp";
      if (fs.existsSync(thermalZonePath)) {
        const temp = execSync(`cat ${thermalZonePath}`).toString();
        return parseFloat(temp) / 1000; // Convert from millidegree Celsius
      } else {
        console.error("Thermal zone file not found on Linux system.");
        return undefined;
      }
    } else if (platform === "darwin") {
      console.error(
        "Temperature monitoring is not natively supported on macOS.",
      );
      return undefined;
    } else if (platform === "win32") {
      const output = execSync(
        "wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature",
      ).toString();
      const tempCelsius = parseInt(output.split("\n")[1]) / 10 - 273.15; // Convert from Kelvin to Celsius
      return tempCelsius;
    } else {
      console.error("Unsupported platform for temperature monitoring.");
      return undefined;
    }
  } catch (err) {
    console.error("Error fetching temperature:", err);
    return undefined;
  }
}

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

/**
 * Middleware to track request and response time.
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @param {NextFunction} next - Express Next middleware function.
 */
export const trackRequestResponseTime = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = process.hrtime(); // Start time

  res.on("finish", () => {
    const end = process.hrtime(start); // End time
    const responseTimeInMs = end[0] * 1000 + end[1] / 1e6; // Convert to milliseconds

    // Attach the response time to the request object if needed
    (req as any).responseTime = responseTimeInMs;
  });

  next(); // Proceed to the next middleware
};

/**
 * System monitor middleware for gathering system metrics.
 * @param {MonitorOptions} options - Options for monitoring.
 * @returns {Function} Express middleware function.
 */
export const systemMonitor = (options: MonitorOptions = defaultOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const data: MonitorData = {};

    try {
      if (options.cpu) data.cpuUsage = await getCpuUsage();
      if (options.memory) data.memoryUsage = await getMemoryUsage();
      if (options.disk) data.diskUsage = await getDiskUsage();
      if (options.network) data.networkInfo = await getNetworkInfo();
      if (options.uptime) data.uptime = await getSystemUptime();
      if (options.processInfo) data.processInfo = await getProcessInfo();
      if (options.temperature) data.temperature = await getTemperature();
      if (options.logs)
        data.logs = await getLogs(options.logs.path, options.logs.keyword);

      (req as any).systemMetrics = data;
    } catch (err) {
      console.error("Error fetching system metrics:", err);
    }

    next();
  };
};

export default systemMonitor;
