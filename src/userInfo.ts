import os from "os";
import { ExtendedUserInfo, SystemMonitorError } from "./types";

/**
 * Retrieves extended user information and system details.
 *
 * @returns {ExtendedUserInfo} - Object containing user and system information.
 * - `username`: The name of the current user.
 * - `homedir`: The home directory of the user.
 * - `shell`: The default shell for the user (e.g., `/bin/bash`, `/bin/zsh`).
 * - `hostname`: The hostname of the operating system.
 * - `platform`: The platform on which the Node.js process is running (e.g., 'linux', 'win32').
 * - `architecture`: The architecture of the operating system's processor (e.g., 'x64', 'arm').
 *
 * @throws {SystemMonitorError} If there is an issue retrieving user information,
 * a custom error is thrown with details about the failure, including the error message and stack trace.
 *
 * @example
 * try {
 *   const userInfo = getUserInfo();
 *   console.log('User Info:', userInfo);
 * } catch (error) {
 *   console.error('Failed to retrieve user information:', error);
 * }
 */
export function getUserInfo(): ExtendedUserInfo {
  try {
    const userInfo = os.userInfo();

    return {
      username: userInfo.username,
      homedir: userInfo.homedir,
      shell: userInfo.shell,
      hostname: os.hostname(), // Adding the hostname of the machine
      platform: os.platform(), // Operating system platform (e.g., 'linux', 'darwin', 'win32')
      architecture: os.arch(), // System architecture (e.g., 'x64', 'arm')
    };
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve user information: ${(error as Error)?.message || String(error)}`,
      "UserInfoError",
      (error as Error)?.stack,
    );
  }
}

export default getUserInfo;
