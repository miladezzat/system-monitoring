import { Request } from "express";
import os from "os";

export type ServiceStatus = "running" | "inactive" | "unknown";

export interface ScheduledTask {
  name: string; // The name of the scheduled task
  details: string; // Details about the scheduled task
}

export interface ScheduledTasksResponse {
  tasks: ScheduledTask[]; // An array of scheduled tasks
  error?: string; // Optional error message if any issues occur
}

/**
 * Interface representing a network connection.
 */
export interface NetworkConnection {
  protocol: string; // The protocol used (e.g., TCP, UDP)
  localAddress: string; // The local IP address and port
  foreignAddress: string; // The remote IP address and port
  state: string; // The current state of the connection (e.g., ESTABLISHED)
}

/**
 * Interface representing a file system's information.
 */
export interface FileSystemInfo {
  caption: string; // The name of the drive or file system
  size: string; // Total size of the file system or disk
  freeSpace: string; // Available free space
}

/**
 * Monitor options for system metrics.
 */
export interface MonitorOptions {
  cpu?: boolean; // Enable monitoring of CPU metrics
  memory?: boolean; // Enable monitoring of memory usage
  disk?: boolean; // Enable monitoring of disk usage
  network?: boolean; // Enable monitoring of network information
  uptime?: boolean; // Enable monitoring of system uptime
  processInfo?: boolean; // Enable monitoring of process information
  temperature?: boolean; // Enable monitoring of system temperature
  logs?: { path: string; keyword?: string }; // Options for log monitoring
  responseTime?: boolean; // Enable monitoring of response time
  osInfo?: boolean; // Enable monitoring of operating system information
  loadAverage?: boolean; // Enable monitoring of load average
  userInfo?: boolean; // Enable monitoring of user information
  fileSystemInfo?: boolean; // Enable monitoring of file system information
  activeConnections?: boolean; // Enable monitoring of active network connections
  scheduledTasks?: boolean; // Enable monitoring of scheduled tasks
}

/**
 * Monitor data structure for storing system metrics.
 */
export interface MonitorData {
  cpuInformation?: CpuInfo; // Information about CPU usage
  memoryUsage?: {
    totalMemory: number; // Total memory available in bytes
    freeMemory: number; // Free memory available in bytes
    usedMemory: number; // Used memory in bytes
  };
  diskUsage?: EnhancedDiskUsage[] | null; // Disk usage details for each partition
  networkInfo?: NodeJS.Dict<os.NetworkInterfaceInfo[]>; // Information about network interfaces
  uptime?: number; // System uptime in seconds
  processInfo?: {
    cpu: number; // CPU usage percentage
    memory: number; // Memory usage in bytes
  };
  temperature?: number; // System temperature in Celsius
  logs?: string[]; // Array of log entries
  responseTime?: number; // Average response time in milliseconds
  osInfo?: OSInfo; // Information about the operating system
  loadAverage?: LoadAverage; // Load average over 1, 5, and 15 minutes
  userInfo?: ExtendedUserInfo; // Information about the current user
  fileSystemInfo?: FileSystemInfo[] | string; // Information about the file system
  activeConnections?: NetworkConnection[] | string; // Active network connections
  scheduledTasks?: ScheduledTasksResponse; // Scheduled tasks information
}

/**
 * Disk usage structure to store total, used, and available space.
 */
export interface DiskUsage {
  total: number; // Total space in bytes
  used: number; // Used space in bytes
  available: number; // Available space in bytes
}

/**
 * Represents detailed information for an individual CPU core, including
 * various time metrics and the core's usage percentage.
 */
export interface CpuCoreInfo {
  coreId: number; // The unique identifier of the CPU core (index)
  userTime: number; // Time spent executing user-level code in milliseconds
  systemTime: number; // Time spent executing system-level (kernel) code in milliseconds
  idleTime: number; // Time spent in an idle state in milliseconds
  totalTime: number; // Total operational time in milliseconds
  usagePercentage: number; // Percentage of time actively used
}

/**
 * Represents the overall CPU usage information, including total time spent on
 * various activities across all CPU cores and per-core details.
 */
export interface CpuInfo {
  totalUserTime: number; // Total time spent by all cores executing user-level code in milliseconds
  totalSystemTime: number; // Total time spent by all cores executing system-level (kernel) code in milliseconds
  totalIdleTime: number; // Total time spent by all cores in an idle state in milliseconds
  totalTime: number; // Total time that the CPU has been operational in milliseconds
  usedTime: number; // Total active time (userTime + systemTime) in milliseconds
  idleTime: number; // Total idle time across all CPU cores in milliseconds
  usagePercentage: number; // Overall CPU usage as a percentage
  coreDetails: CpuCoreInfo[]; // Array of per-core usage statistics
}

/**
 * Represents detailed information about disk usage for a specific partition.
 */
export interface EnhancedDiskUsage {
  filesystem: string; // Name of the file system
  total: number; // Total space in bytes
  used: number; // Used space in bytes
  available: number; // Available space in bytes
  usedPercentage: number; // Percentage of used space
  mountPoint: string; // Mount point of the file system
}

/**
 * SystemMonitorError class extends the native JavaScript Error class to include additional information such as
 * error name and stack trace. It provides a structured way to handle errors with custom messages, names,
 * and optional stack traces.
 */
export class SystemMonitorError extends Error {
  name: string; // Name of the error
  stack: string | undefined; // Stack trace of the error

  /**
   * Creates a new SystemMonitorError instance with a message, name, and optional stack trace.
   *
   * @param {string} message - The error message providing details about the error.
   * @param {string} [name="unknown error"] - A custom name for the error, defaulting to "unknown error" if not provided.
   * @param {string} [stack] - An optional stack trace, which provides the context of where the error occurred.
   *
   * @example
   * throw new SystemMonitorError('Database connection failed', 'DatabaseError', error.stack);
   *
   * @example
   * try {
   *   someFunction();
   * } catch (error) {
   *   throw new SystemMonitorError('An unexpected error occurred');
   * }
   */
  constructor(message: string, name = "unknown error", stack?: string) {
    super(message); // Call the parent constructor with the message
    this.name = name; // Set the error name
    this.stack = stack || this.stack; // Use provided stack or fallback to the Error's stack
  }
}

/**
 * Type definition for OS information.
 */
export interface OSInfo {
  platform: string; // The platform of the operating system (e.g., Linux, Windows)
  release: string; // The OS release version
  architecture: string; // The architecture of the OS (e.g., x64, arm)
  kernelVersion: string; // The kernel version of the OS
  hostname: string; // The hostname of the system
  homeDir: string; // The home directory of the current user
  uptime: number; // System uptime in seconds
  totalMemory: number; // Total memory in bytes
  freeMemory: number; // Free memory in bytes
  numberOfCpus: number; // Number of CPU cores
  cpuModel?: string; // Model of the CPU (optional)
  networkInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>; // Network interface information
  userInfo: os.UserInfo<string>; // Information about the current user
}

/**
 * Type definition for load average information.
 */
export interface LoadAverage {
  load1min: number; // Load average over the last 1 minute
  load5min: number; // Load average over the last 5 minutes
  load15min: number; // Load average over the last 15 minutes
}

/**
 * Extended user information interface.
 */
export interface ExtendedUserInfo {
  username: string; // Username of the current user
  homedir: string; // Home directory of the current user
  shell: string | null; // Default shell of the user (null if not set)
  hostname: string; // Hostname of the machine
  platform: string; // Platform of the operating system
  architecture: string; // Architecture of the operating system
}

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
 * Options for tracking request/response time.
 *
 * @interface TrackTimeOptions
 * @property {string} [filePath] - The path to the file where logs should be stored.
 * @property {(logData: LogData) => void} [storeOnDb] - Callback function to store log data in a database.
 */
export interface TrackTimeOptions {
  filePath?: string;
  storeOnDb?: (logData: LogData) => void;
}

/**
 * Log data structure.
 *
 * @interface LogData
 * @property {string} method - The HTTP method of the request (e.g., GET, POST).
 * @property {string} url - The requested URL.
 * @property {string} responseTime - The response time in milliseconds.
 * @property {string} timestamp - The timestamp of the request in ISO format.
 */
export interface LogData {
  method: string;
  url: string;
  responseTime: string;
  timestamp: string;
}

// Interface to extend the Express Request object
export interface TrackingCustomErrorRequest extends Request {
  errorResponse?: {
    totalRequests: number;
    errorCount: number;
    errorRate: string;
    errorRoutes: { [key: string]: number };
  };
}
