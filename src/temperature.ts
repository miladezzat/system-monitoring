import os from "os";
import { execSync } from "child_process";
import fs from "fs";

/**
 * Get system temperature based on the platform.
 * @returns {Promise<number | undefined>} Temperature in Celsius or undefined if not supported.
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
        console.error("Thermal zone file not found on Linux system.");
        return undefined;
      }
    } else if (platform === "darwin") {
      console.error(
        "Temperature monitoring is not natively supported on macOS.",
      );
      return undefined;
    } else if (platform === "win32") {
      const output = execSync(
        "wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature",
      ).toString();
      const tempCelsius = parseInt(output.split("\n")[1]) / 10 - 273.15; // Convert from Kelvin to Celsius
      return tempCelsius;
    } else {
      console.error("Unsupported platform for temperature monitoring.");
      return undefined;
    }
  } catch (err) {
    console.error("Error fetching temperature:", err);
    return undefined;
  }
}
