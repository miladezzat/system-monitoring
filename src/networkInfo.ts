import os from "os";
import { MonitorData } from "./types";
import { SystemMonitorError } from "./types"; // Import the custom error

/**
 * Asynchronously retrieves network interface information, including details for each network interface
 * available on the system.
 *
 * The function gathers data such as the IP addresses and netmask for each network interface,
 * facilitating network monitoring and diagnostics.
 *
 * @async
 * @function getNetworkInfo
 *
 * @returns {Promise<MonitorData['networkInfo']>} A promise that resolves to an object containing
 * network interface data.
 *
 * @throws {SystemMonitorError} If there is an issue retrieving the network information, a custom error
 * is thrown with details about the failure, including the error message and stack trace.
 *
 * @example
 * getNetworkInfo()
 *   .then(networkInfo => {
 *     console.log('Network Interfaces:', networkInfo);
 *   })
 *   .catch(error => {
 *     console.error('Failed to retrieve network information:', error);
 *   });
 */
export async function getNetworkInfo(): Promise<MonitorData["networkInfo"]> {
  try {
    // Retrieve network interface information
    return os.networkInterfaces();
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve network information: ${(error as Error)?.message || String(error)}`,
      "NetworkInfoError",
      (error as Error)?.stack,
    );
  }
}

export default getNetworkInfo;
