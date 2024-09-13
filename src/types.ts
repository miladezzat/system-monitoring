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
    logs?: { path: string, keyword?: string };
    responseTime?: boolean;
}

/**
 * Monitor data structure for storing system metrics.
 */
export interface MonitorData {
    cpuInformation?: CpuInfo;
    memoryUsage?: {
        totalMemory: number;
        freeMemory: number;
        usedMemory: number;
    };
    diskUsage?: EnhancedDiskUsage[] | null;
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


/**
 * Represents detailed information for an individual CPU core, including 
 * various time metrics and the core's usage percentage.
 * 
 * @interface CpuCoreInfo
 * 
 * @property {number} coreId - The unique identifier of the CPU core (index).
 * @property {number} userTime - The amount of time (in milliseconds) the core has spent executing user-level code.
 * @property {number} systemTime - The amount of time (in milliseconds) the core has spent executing system-level (kernel) code.
 * @property {number} idleTime - The amount of time (in milliseconds) the core has spent in an idle state.
 * @property {number} totalTime - The total time (in milliseconds) the core has been operational, including user, system, and idle time.
 * @property {number} usagePercentage - The percentage of time the core has been actively used (user + system time) relative to the total time.
 */
export interface CpuCoreInfo {
    coreId: number;
    userTime: number;
    systemTime: number;
    idleTime: number;
    totalTime: number;
    usagePercentage: number;
}

/**
 * Represents the overall CPU usage information, including total time spent on
 * various activities across all CPU cores and per-core details.
 * 
 * @interface CpuInfo
 * 
 * @property {number} totalUserTime - The total time (in milliseconds) spent by all cores executing user-level code.
 * @property {number} totalSystemTime - The total time (in milliseconds) spent by all cores executing system-level (kernel) code.
 * @property {number} totalIdleTime - The total time (in milliseconds) spent by all cores in an idle state.
 * @property {number} totalTime - The total time (in milliseconds) that the CPU has been operational, including user, system, and idle time.
 * @property {number} usedTime - The total active time (in milliseconds) spent by all cores, computed as userTime + systemTime.
 * @property {number} idleTime - The total idle time (in milliseconds) across all CPU cores.
 * @property {number} usagePercentage - The overall CPU usage as a percentage, calculated as (usedTime / totalTime) * 100.
 * @property {CpuCoreInfo[]} coreDetails - An array of objects containing per-core usage statistics, such as user time, system time, idle time, total time, and usage percentage for each core.
 */
export interface CpuInfo {
    totalUserTime: number;
    totalSystemTime: number;
    totalIdleTime: number;
    totalTime: number;
    usedTime: number;
    idleTime: number;
    usagePercentage: number;
    coreDetails: CpuCoreInfo[];
}


/**
 * Represents detailed information about disk usage for a specific partition.
 * @interface EnhancedDiskUsage
 */
export interface EnhancedDiskUsage {
    filesystem: string;
    total: number;
    used: number;
    available: number;
    usedPercentage: number;
    mountPoint: string;
}
