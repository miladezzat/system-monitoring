import os from 'os';
import { MonitorData } from './types';

/**
 * Get network interface information.
 * @returns {Promise<MonitorData['networkInfo']>} Network interface data.
 */
export async function getNetworkInfo(): Promise<MonitorData['networkInfo']> {
    return os.networkInterfaces();
}
