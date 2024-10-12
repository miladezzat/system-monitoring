import os from "os";
import { OSInfo, SystemMonitorError } from "./types";

/**
 * Asynchronously retrieves detailed information about the operating system.
 *
 * The function gathers various information such as the OS platform, release version, architecture,
 * kernel version, hostname, home directory, uptime, memory statistics, CPU details, network interfaces,
 * and user information.
 *
 * @returns {OSInfo} An object containing various OS information.
 *
 * @throws {SystemMonitorError} If there is an issue retrieving the operating system information,
 * a custom error is thrown with details about the failure, including the error message and stack trace.
 *
 * @example
 * try {
 *   const osInfo = getOSInfo();
 *   console.log('Operating System Information:', osInfo);
 * } catch (error) {
 *   console.error('Failed to retrieve OS information:', error);
 * }
 */
export function getOSInfo(): OSInfo {
  try {
    return {
      platform: os.platform(), // 'linux', 'darwin', 'win32', etc.
      release: os.release(), // OS version/release
      architecture: os.arch(), // 'x64', 'arm', etc.
      kernelVersion: os.version(), // Kernel version
      hostname: os.hostname(), // System hostname
      homeDir: os.homedir(), // Home directory
      uptime: os.uptime(), // System uptime in seconds
      totalMemory: os.totalmem(), // Total memory in bytes
      freeMemory: os.freemem(), // Free memory in bytes
      numberOfCpus: os.cpus().length, // Number of CPU cores
      cpuModel: os.cpus()[0]?.model, // Model of the first CPU
      networkInterfaces: os.networkInterfaces(), // Network interface details
      userInfo: os.userInfo(), // User information
    };
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve operating system information: ${(error as Error)?.message || String(error)}`,
      "OSInfoError",
      (error as Error)?.stack,
    );
  }
}

export default getOSInfo;
