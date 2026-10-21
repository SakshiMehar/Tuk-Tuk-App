import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

let cachedHeaders = null;

/**
 * Safely load react-native-device-info only when native module is linked
 * in the current binary. Prevents crash on Expo Go or dev client before rebuild.
 */
const getDeviceInfoModule = () => {
  try {
    if (NativeModules && (NativeModules.RNDeviceInfo || Platform.OS === "web")) {
      const mod = require("react-native-device-info");
      return mod?.default || mod;
    }
  } catch (e) {
    // Native module not linked in current binary, will use safe fallback
  }
  return null;
};

export const getDeviceHeaders = async () => {
  if (cachedHeaders && cachedHeaders["X-Device-Id"]) {
    return cachedHeaders;
  }

  const DeviceInfo = getDeviceInfoModule();

  let deviceId = null;
  let model = "Unknown";
  let osType = Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : Platform.OS;
  let osVersion = String(Platform.Version || "Unknown");
  let appVersion = Constants?.expoConfig?.version || "1.0.0";

  // 1. Use native DeviceInfo if available in current build
  if (DeviceInfo) {
    try {
      if (typeof DeviceInfo.getUniqueId === "function") {
        deviceId = await DeviceInfo.getUniqueId();
      }
    } catch (err) {
      console.warn("[deviceHeaders] DeviceInfo.getUniqueId error:", err?.message || err);
    }

    try {
      if (typeof DeviceInfo.getModel === "function") {
        model = DeviceInfo.getModel() || model;
      }
      if (typeof DeviceInfo.getSystemName === "function") {
        osType = DeviceInfo.getSystemName() || osType;
      }
      if (typeof DeviceInfo.getSystemVersion === "function") {
        osVersion = DeviceInfo.getSystemVersion() || osVersion;
      }
      if (typeof DeviceInfo.getVersion === "function") {
        appVersion = DeviceInfo.getVersion() || appVersion;
      }
    } catch (err) {
      console.warn("[deviceHeaders] DeviceInfo metadata error:", err?.message || err);
    }
  }

  // 2. Fallbacks for model / version if DeviceInfo was not linked
  if (model === "Unknown") {
    if (Platform.OS === "android") {
      model = Platform.constants?.Model || Platform.constants?.Brand || "Android Device";
    } else if (Platform.OS === "ios") {
      model = Constants?.deviceName || "iPhone";
    } else {
      model = Platform.OS || "Device";
    }
  }

  // 3. Fallback persistent device ID (never changes across logins)
  if (!deviceId) {
    try {
      const stored = await AsyncStorage.getItem("@device_persistent_id");
      if (stored) {
        deviceId = stored;
      } else {
        deviceId =
          Constants?.installationId ||
          `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        await AsyncStorage.setItem("@device_persistent_id", String(deviceId)).catch(() => {});
      }
    } catch {
      deviceId = Constants?.installationId || `dev_${Date.now()}`;
    }
  }

  cachedHeaders = {
    "X-Device-Id": String(deviceId),
    "X-Device-Model": String(model),
    "X-OS-Type": String(osType),
    "X-OS-Version": String(osVersion),
    "X-App-Version": String(appVersion),
  };

  return cachedHeaders;
};

export const getDeviceId = async () => {
  const headers = await getDeviceHeaders().catch(() => ({}));
  return headers?.["X-Device-Id"] || (await AsyncStorage.getItem("@device_persistent_id")) || null;
};

export const getCurrentDeviceId = async () => {
  return getDeviceId();
};

export const setDeviceId = async (newDeviceId) => {
  if (!newDeviceId) return;
  await AsyncStorage.setItem("@device_persistent_id", String(newDeviceId)).catch(() => {});
  if (cachedHeaders) {
    cachedHeaders["X-Device-Id"] = String(newDeviceId);
  }
};

export default getDeviceHeaders;
