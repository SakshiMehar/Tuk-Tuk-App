import { DeviceEventEmitter, NativeModules, Platform } from "react-native";

const { PipModule } = NativeModules;

/**
 * Check whether Picture-in-Picture mode is supported on this Android device.
 * @returns {Promise<boolean>}
 */
export const isPipSupported = async () => {
  if (Platform.OS !== "android" || !PipModule) {
    return false;
  }
  try {
    return Boolean(await PipModule.isPipSupported());
  } catch (err) {
    console.warn("[PipService] isPipSupported check failed:", err);
    return false;
  }
};

/**
 * Check whether the app is currently in Picture-in-Picture mode.
 * @returns {Promise<boolean>}
 */
export const isInPipMode = async () => {
  if (Platform.OS !== "android" || !PipModule) {
    return false;
  }
  try {
    return Boolean(await PipModule.isInPipMode());
  } catch (err) {
    console.warn("[PipService] isInPipMode check failed:", err);
    return false;
  }
};

/**
 * Request the Android system to enter Picture-in-Picture mode.
 * @param {Object} options
 * @param {number} [options.width=9] - Aspect ratio width numerator
 * @param {number} [options.height=16] - Aspect ratio height denominator
 * @returns {Promise<boolean>}
 */
export const enterPipMode = async ({ width = 9, height = 16 } = {}) => {
  if (Platform.OS !== "android" || !PipModule) {
    return false;
  }
  try {
    const success = await PipModule.enterPipMode(width, height);
    return Boolean(success);
  } catch (err) {
    console.warn("[PipService] enterPipMode failed:", err);
    return false;
  }
};

/**
 * Request the Android system to maximize back to full screen from PiP mode.
 * @returns {Promise<boolean>}
 */
export const maximizePip = async () => {
  if (Platform.OS !== "android" || !PipModule) {
    return false;
  }
  try {
    if (typeof PipModule.maximizePip === "function") {
      return Boolean(await PipModule.maximizePip());
    }
    return false;
  } catch (err) {
    console.warn("[PipService] maximizePip failed:", err);
    return false;
  }
};

/**
 * Subscribe to PiP mode transitions (entering or exiting PiP mode).
 * @param {(isInPipMode: boolean) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export const subscribePipModeChanged = (callback) => {
  if (Platform.OS !== "android" || typeof callback !== "function") {
    return () => {};
  }

  const sub = DeviceEventEmitter.addListener("onPipModeChanged", (event) => {
    callback(Boolean(event?.isInPipMode));
  });

  return () => {
    sub.remove();
  };
};

export default {
  isPipSupported,
  isInPipMode,
  enterPipMode,
  maximizePip,
  subscribePipModeChanged,
};
