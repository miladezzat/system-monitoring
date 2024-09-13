import os from 'os';

/**
 * Get system uptime in seconds.
 * @returns {Promise<number>} System uptime.
 */
export async function getSystemUptime(): Promise<number> {
    return os.uptime();
}
