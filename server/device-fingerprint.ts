import { createHash } from "crypto";
import os from "os";
import { execSync } from "child_process";

/**
 * Generates a unique device fingerprint based on hardware and OS information
 * This fingerprint is used to track device activations
 */
export function generateDeviceFingerprint(): string {
  const platform = os.platform();
  const hostname = os.hostname();
  const cpus = os.cpus();
  
  // Get machine-specific identifier based on platform
  let machineId = "";
  
  try {
    if (platform === "win32") {
      // Windows: Use WMIC to get machine GUID
      machineId = execSync("wmic csproduct get UUID", { encoding: "utf8" })
        .split("\n")[1]
        .trim();
    } else if (platform === "darwin") {
      // macOS: Use system_profiler to get hardware UUID
      machineId = execSync("system_profiler SPHardwareDataType | grep 'Hardware UUID'", { encoding: "utf8" })
        .split(":")[1]
        .trim();
    } else {
      // Linux: Use machine-id
      machineId = execSync("cat /etc/machine-id || cat /var/lib/dbus/machine-id", { encoding: "utf8" })
        .trim();
    }
  } catch (error) {
    console.warn("Could not get machine ID, using fallback");
    // Fallback to hostname + CPU info
    machineId = `${hostname}-${cpus[0]?.model || "unknown"}`;
  }
  
  // Combine information to create fingerprint
  const fingerprintData = [
    platform,
    hostname,
    machineId,
    cpus.length.toString(),
    cpus[0]?.model || "unknown",
  ].join("|");
  
  // Hash the fingerprint for privacy and consistency
  const fingerprint = createHash("sha256")
    .update(fingerprintData)
    .digest("hex");
  
  return fingerprint;
}

/**
 * Gets a human-readable machine label for display purposes
 */
export function getMachineLabel(): string {
  const platform = os.platform();
  const hostname = os.hostname();
  
  let platformName = "Unknown";
  if (platform === "win32") {
    platformName = "Windows";
  } else if (platform === "darwin") {
    platformName = "macOS";
  } else if (platform === "linux") {
    platformName = "Linux";
  }
  
  return `${platformName} - ${hostname}`;
}
