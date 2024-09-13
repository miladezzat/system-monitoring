import os from 'os';
import { MonitorData } from './types';

/**
 * Get memory usage statistics.
 * @returns {Promise<MonitorData['memoryUsage']>} Memory usage data.
 */
export async function getMemoryUsage(): Promise<MonitorData['memoryUsage']> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
        totalMemory,
        freeMemory,
        usedMemory
    };
}
