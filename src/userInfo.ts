import os from "os";

export interface ExtendedUserInfo {
  username: string;
  homedir: string;
  shell: string | null;
  hostname: string;
  platform: string;
  architecture: string;
}

/**
 * Retrieves extended user information and system details.
 *
 * @returns {ExtendedUserInfo} - Object containing user and system information.
 *
 * - `username`: The name of the current user.
 * - `homedir`: The home directory of the user.
 * - `shell`: The default shell for the user (e.g., `/bin/bash`, `/bin/zsh`).
 * - `hostname`: The hostname of the operating system.
 * - `platform`: The platform on which the Node.js process is running (e.g., 'linux', 'win32').
 * - `architecture`: The architecture of the operating system's processor (e.g., 'x64', 'arm').
 */
export function getUserInfo(): ExtendedUserInfo {
  const userInfo = os.userInfo();

  return {
    username: userInfo.username,
    homedir: userInfo.homedir,
    shell: userInfo.shell,
    hostname: os.hostname(), // Adding the hostname of the machine
    platform: os.platform(), // Operating system platform (e.g., 'linux', 'darwin', 'win32')
    architecture: os.arch(), // System architecture (e.g., 'x64', 'arm')
  };
}
