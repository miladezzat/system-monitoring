import os from "os";
import { execSync } from "child_process";
import fs from "fs";
import { SystemMonitorError } from "./types"; // Import the custom error

/**
 * Get system temperature based on the platform.
 *
 * This function retrieves the temperature of the CPU or thermal zone, depending on the operating system:
 * - On Linux, it reads from the thermal zone file.
 * - On Windows, it uses WMIC to get the temperature.
 * - On macOS, temperature retrieval is currently not supported.
 *
 * @returns {Promise<number | undefined>} Temperature in Celsius or undefined if not supported or an error occurs.
 *
 * @throws {SystemMonitorError} If there is an error retrieving the temperature.
 *
 * @example
 * getTemperature()
 *   .then(temp => console.log(`Current temperature: ${temp}°C`))
 *   .catch(error => console.error('Error retrieving temperature:', error));
 */
export async function getTemperature(): Promise<number | undefined> {
  try {
    const platform = os.platform();

    if (platform === "linux") {
      const thermalZonePath = "/sys/class/thermal/thermal_zone0/temp";
      if (fs.existsSync(thermalZonePath)) {
        const temp = execSync(`cat ${thermalZonePath}`).toString();
        return parseFloat(temp) / 1000; // Convert from millidegree Celsius
      } else {
        return undefined; // Thermal zone file does not exist
      }
    } else if (platform === "darwin") {
      return undefined; // Temperature retrieval not supported on macOS
    } else if (platform === "win32") {
      const output = execSync(
        "wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature",
      ).toString();
      const tempCelsius = parseInt(output.split("\n")[1]) / 10 - 273.15; // Convert from Kelvin to Celsius
      return tempCelsius;
    } else {
      return undefined; // Platform not supported
    }
  } catch (error: unknown) {
    // Handle and throw custom SystemMonitorError
    throw new SystemMonitorError(
      `Failed to retrieve system temperature: ${(error as Error)?.message || String(error)}`,
      "TemperatureRetrievalError",
      (error as Error)?.stack,
    );
  }
}

export default getTemperature;
