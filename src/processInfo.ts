import { MonitorData } from './types';

/**
 * Get process CPU and memory usage.
 * @returns {Promise<MonitorData['processInfo']>} Process info data.
 */
export async function getProcessInfo(): Promise<MonitorData['processInfo']> {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000;
    return {
        cpu: cpuPercent,
        memory: memoryUsage.rss // Resident Set Size
    };
}
