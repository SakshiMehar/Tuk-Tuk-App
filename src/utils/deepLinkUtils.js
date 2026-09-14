import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_DEEP_LINK_KEY = "@pending_deep_link";

/**
 * Extracts a numeric or alphanumeric room ID from an incoming deep link or web URL.
 * Handles formats:
 * - https://tuktuk.live/room/12345
 * - http://tuktuk.live/room/12345
 * - tuktuk://room/12345
 * - tuktuk://voice-party?roomId=12345
 * - /room/12345
 */
export const extractRoomIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Match /room/{roomId} or /rooms/{roomId}
  const match = trimmed.match(/\/rooms?\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1];
  }

  // Match query parameter ?roomId=... or ?room_id=...
  try {
    const qIndex = trimmed.indexOf("?");
    if (qIndex !== -1) {
      const searchParams = new URLSearchParams(trimmed.slice(qIndex));
      const rId =
        searchParams.get("roomId") ||
        searchParams.get("room_id") ||
        searchParams.get("id");
      if (rId) return rId;
    }
  } catch {
    // fallback
  }

  return null;
};

/** Stores pending deep link URL before login / auth */
export const setPendingDeepLink = async (url) => {
  if (!url) {
    await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
    return;
  }
  await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, String(url));
};

/** Reads pending deep link URL */
export const getPendingDeepLink = async () => {
  return AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
};

/** Consumes pending deep link URL so it is not processed twice */
export const consumePendingDeepLink = async () => {
  const url = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
  if (url) {
    await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
  }
  return url;
};
