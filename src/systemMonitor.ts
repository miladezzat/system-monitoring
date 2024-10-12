import { Request, Response, NextFunction } from "express";
import { MonitorOptions, MonitorData, defaultOptions } from "./types";
import { getCpuInfo } from "./cpuUsage";
import { getMemoryUsage } from "./memoryUsage";
import { getDiskUsage } from "./diskUsage";
import { getNetworkInfo } from "./networkInfo";
import { getSystemUptime } from "./uptime";
import { getProcessInfo } from "./processInfo";
import { getTemperature } from "./temperature";
import { getLogs } from "./logs";
import { getOSInfo } from "./osInfo";
import { getLoadAverage } from "./loadAverage";
import { getUserInfo } from "./userInfo";
import { getFileSystemInfo } from "./fileSystemInfo";
import { getActiveConnections } from "./activeConnections";
import { getScheduledTasks } from "./scheduledTasks";

/**
 * Middleware for gathering system metrics in an Express application.
 *
 * This middleware collects various system metrics based on the provided
 * options and attaches the data to the request object.
 *
 * @param {MonitorOptions} options - Options for monitoring system metrics.
 * @returns {Function} An Express middleware function that populates the request
 *                    object with system metrics.
 *
 * @example
 * app.use(systemMonitor({ cpu: true, memory: true }));
 */
export const systemMonitor = (options: MonitorOptions = defaultOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const data: MonitorData = {};

    try {
      if (options.cpu) data.cpuInformation = await getCpuInfo();
      if (options.memory) data.memoryUsage = await getMemoryUsage();
      if (options.disk) data.diskUsage = await getDiskUsage();
      if (options.network) data.networkInfo = await getNetworkInfo();
      if (options.uptime) data.uptime = await getSystemUptime();
      if (options.processInfo) data.processInfo = await getProcessInfo();
      if (options.temperature) data.temperature = await getTemperature();
      if (options.osInfo) data.osInfo = await getOSInfo();
      if (options.loadAverage) data.loadAverage = await getLoadAverage();
      if (options.userInfo) data.userInfo = await getUserInfo();
      if (options.fileSystemInfo)
        data.fileSystemInfo = await getFileSystemInfo();
      if (options.activeConnections)
        data.activeConnections = await getActiveConnections();
      if (options.logs)
        data.logs = await getLogs(options.logs.path, options.logs.keyword);
      if (options.scheduledTasks)
        data.scheduledTasks = await getScheduledTasks();

      // Attach the gathered system metrics to the request object
      (req as Request & { systemMetrics: MonitorData }).systemMetrics = data;
    } catch (err) {
      console.error("Error fetching system metrics:", err);
    }

    next();
  };
};

export default systemMonitor;
