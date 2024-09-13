import os from 'os';
import { CpuCoreInfo, CpuInfo } from './types';

/**
 * Asynchronously retrieves detailed CPU information, including total and per-core statistics.
 * It gathers information like total CPU time, idle time, user/system time, and CPU usage percentages.
 * 
 * The function provides an overall summary of the CPU, as well as core-specific data.
 * 
 * @async
 * @function getCpuInfo
 * 
 * @returns {Promise<CpuInfo>} A promise that resolves to an object containing detailed CPU statistics.
 * 
 * @throws {Error} If the CPU information cannot be retrieved or an error occurs during calculation.
 * 
 * @example
 * 
 * getCpuInfo()
 *   .then(cpuInfo => {
 *     console.log('Total CPU Usage:', cpuInfo.usagePercentage, '%');
 *     console.log('Per-Core Details:', cpuInfo.coreDetails);
 *   })
 *   .catch(error => {
 *     console.error('Failed to retrieve CPU info:', error);
 *   });
 */
export async function getCpuInfo(): Promise<CpuInfo> {
    try {
        const cpus = os.cpus();

        // Aggregate total times across all cores
        let totalUserTime = 0;
        let totalSystemTime = 0;
        let totalIdleTime = 0;

        const coreDetails: CpuCoreInfo[] = cpus.map((cpu, index) => {
            const userTime = cpu.times.user;
            const systemTime = cpu.times.sys;
            const idleTime = cpu.times.idle;

            const totalTime = userTime + systemTime + idleTime;
            const usedTime = userTime + systemTime;
            const usagePercentage = (usedTime / totalTime) * 100;

            // Accumulate total times
            totalUserTime += userTime;
            totalSystemTime += systemTime;
            totalIdleTime += idleTime;

            return {
                coreId: index,
                userTime,
                systemTime,
                idleTime,
                totalTime,
                usagePercentage: parseFloat(usagePercentage.toFixed(2))
            };
        });

        // Calculate total CPU times across all cores
        const totalTime = totalUserTime + totalSystemTime + totalIdleTime;
        const usedTime = totalUserTime + totalSystemTime;
        const usagePercentage = (usedTime / totalTime) * 100;

        return {
            totalUserTime,
            totalSystemTime,
            totalIdleTime,
            totalTime,
            usedTime,
            idleTime: totalIdleTime,
            usagePercentage: parseFloat(usagePercentage.toFixed(2)),
            coreDetails
        };
    } catch (error) {
        console.error('Error retrieving CPU info:', error);
        throw new Error('Failed to retrieve CPU info');
    }
}
