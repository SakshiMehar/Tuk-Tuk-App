import { DeviceEventEmitter, NativeModules, Platform } from "react-native";
import { API_BASE_URL } from "../config/env";
import { getBearerToken } from "../api/axios";

const { RoomAudioModule } = NativeModules;

/**
 * Start the native Android foreground audio service.
 * Call this when entering the voice room.
 */
export const startBackgroundRoomAudio = async ({
  roomId,
  seatNumber = null,
  isMuted = false,
  isAppBackgrounded = false,
} = {}) => {
  if (Platform.OS !== "android" || !RoomAudioModule) {
    return false;
  }
  try {
    const token = await getBearerToken().catch(() => null);
    const success = await RoomAudioModule.startBackgroundRoomAudio({
      roomId: String(roomId || ""),
      seatNumber: seatNumber != null ? Number(seatNumber) : null,
      isMuted: Boolean(isMuted),
      isAppBackgrounded: Boolean(isAppBackgrounded),
      apiBaseUrl: API_BASE_URL,
      authToken: token || "",
    });
    return Boolean(success);
  } catch (err) {
    console.warn("[RoomAudioService] startBackgroundRoomAudio failed:", err?.message || err);
    return false;
  }
};

/**
 * Update the background voice session state (seatNumber, mute state, background state).
 */
export const updateBackgroundRoomSession = async ({
  seatNumber,
  isMuted,
  isAppBackgrounded,
} = {}) => {
  if (Platform.OS !== "android" || !RoomAudioModule) {
    return false;
  }
  try {
    const token = await getBearerToken().catch(() => null);
    const payload = {};
    if (seatNumber !== undefined) {
      payload.seatNumber = seatNumber != null ? Number(seatNumber) : null;
    }
    if (isMuted !== undefined) {
      payload.isMuted = Boolean(isMuted);
    }
    if (isAppBackgrounded !== undefined) {
      payload.isAppBackgrounded = Boolean(isAppBackgrounded);
    }
    if (token) {
      payload.authToken = token;
    }
    const success = await RoomAudioModule.updateBackgroundRoomSession(payload);
    return Boolean(success);
  } catch (err) {
    console.warn("[RoomAudioService] updateBackgroundRoomSession failed:", err?.message || err);
    return false;
  }
};

/**
 * Stop the native Android foreground audio service.
 * Call this when exiting the room or when kicked.
 */
export const stopBackgroundRoomAudio = async () => {
  if (Platform.OS !== "android" || !RoomAudioModule) {
    return false;
  }
  try {
    const success = await RoomAudioModule.stopBackgroundRoomAudio();
    return Boolean(success);
  } catch (err) {
    console.warn("[RoomAudioService] stopBackgroundRoomAudio failed:", err?.message || err);
    return false;
  }
};

/**
 * Subscribe to session invalidation events emitted when the native background
 * heartbeat receives a 409 response from the server.
 */
export const subscribeBackgroundSessionInvalid = (callback) => {
  if (Platform.OS !== "android" || typeof callback !== "function") {
    return () => {};
  }
  const sub = DeviceEventEmitter.addListener("onBackgroundSessionInvalid", callback);
  return () => {
    sub.remove();
  };
};
