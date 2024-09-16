import { Request, Response, NextFunction } from "express";
import { MonitorOptions, MonitorData } from "./types";
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

// Default monitor options
export const defaultOptions: MonitorOptions = {
  cpu: true,
  memory: true,
  disk: true,
  network: true,
  uptime: true,
  processInfo: true,
  osInfo: false,
  loadAverage: false,
  userInfo: false,
  fileSystemInfo: false,
  activeConnections: false,
  scheduledTasks: false,
  temperature: false,
};

/**
 * System monitor middleware for gathering system metrics.
 * @param {MonitorOptions} options - Options for monitoring.
 * @returns {Function} Express middleware function.
 */
export const systemMonitor = (options: MonitorOptions = defaultOptions) => {
  return async (
    req: Request & { systemMetrics: MonitorData },
    res: Response,
    next: NextFunction,
  ) => {
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
        data.ScheduledTasks = await getScheduledTasks();

      req.systemMetrics = data;
    } catch (err) {
      console.error("Error fetching system metrics:", err);
    }

    next();
  };
};

export default systemMonitor;
