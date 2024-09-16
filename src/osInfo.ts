import os from "os";
/**
 * Type definition for OS information.
 */
export interface OSInfo {
  platform: string;
  release: string;
  architecture: string;
  kernelVersion: string;
  hostname: string;
  homeDir: string;
  uptime: number;
  totalMemory: number;
  freeMemory: number;
  numberOfCpus: number;
  cpuModel?: string;
  networkInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  userInfo: os.UserInfo<string>;
}

/**
 * Retrieves detailed information about the operating system.
 *
 * @returns {OSInfo} An object containing various OS information.
 */
export function getOSInfo(): OSInfo {
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
}
