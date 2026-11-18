import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, DeviceEventEmitter } from "react-native";

const STORAGE_KEY = "@tuk_tuk_room_restrictions";

// In-memory cache for fast synchronous checks before navigating to a room
const roomRestrictions = new Map();

/**
 * Normalizes a room ID to trimmed string.
 */
export const normalizeRoomId = (roomId) => {
  if (roomId == null) return "";
  return String(roomId).trim();
};

/**
 * Parses restriction expiration time (ms epoch) from error message or response data.
 * Supports:
 * - "You are temporarily restricted until 18 Nov 2026 at 11:43 am"
 * - "You are temporarily restricted until 18 Nov 2026 11:43 am"
 * - "PERMANENT"
 * - "SEVEN_DAYS"
 * - "THIRTY_MINUTES"
 * - ISO strings or timestamp fields (restrictedUntil, kickedUntil, until, expiresAt)
 */
export const parseRestrictionUntil = (messageOrDuration, responseData) => {
  if (responseData?.restrictedUntil) {
    const t = new Date(responseData.restrictedUntil).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (responseData?.kickedUntil) {
    const t = new Date(responseData.kickedUntil).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (responseData?.until) {
    const t = new Date(responseData.until).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (responseData?.expiresAt) {
    const t = new Date(responseData.expiresAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  const str = String(messageOrDuration || "").trim();
  if (!str) return Date.now() + 30 * 60 * 1000;

  if (/permanent/i.test(str)) {
    return Infinity;
  }
  if (/seven_days|7_days|7 days/i.test(str)) {
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  }
  if (/thirty_minutes|30_minutes|30 mins|30 min/i.test(str)) {
    return Date.now() + 30 * 60 * 1000;
  }

  // Regex to extract date/time after "restricted until" or "until"
  const match = str.match(/(?:restricted\s+until|until)\s+([^\.]+)/i);
  if (match && match[1]) {
    const dateStr = match[1].replace(/\s+at\s+/i, " ").trim();
    let parsed = new Date(dateStr).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;

    // Try prepending today's date if only time was returned
    const todayStr = new Date().toDateString();
    parsed = new Date(`${todayStr} ${dateStr}`).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Fallback: 30 minutes from now (standard default kickout duration)
  return Date.now() + 30 * 60 * 1000;
};

/**
 * Persists the current restriction list to AsyncStorage.
 */
const persistRestrictions = async () => {
  try {
    const arr = Array.from(roomRestrictions.values());
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    if (__DEV__) console.warn("[roomRestriction] Failed to persist:", e);
  }
};

/**
 * Initializes the in-memory cache from AsyncStorage and prunes expired restrictions.
 */
export const initRoomRestrictions = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    const now = Date.now();
    let changed = false;

    if (Array.isArray(list)) {
      list.forEach((item) => {
        if (!item?.roomId) return;
        const id = normalizeRoomId(item.roomId);
        const blockedUntil = Number(item.blockedUntil);
        // Prune expired restrictions
        if (blockedUntil !== Infinity && blockedUntil <= now) {
          changed = true;
          return;
        }
        roomRestrictions.set(id, {
          roomId: id,
          blockedUntil,
          message:
            item.message ||
            "You are temporarily restricted from joining this room.",
          restrictedAt: item.restrictedAt || now,
        });
      });
    }

    if (changed) {
      persistRestrictions();
    }
  } catch (e) {
    if (__DEV__) console.warn("[roomRestriction] Failed to init:", e);
  }
};

// Auto-initialize on module load
initRoomRestrictions();

/**
 * Records a room restriction when a user is kicked or forbidden.
 */
export const setRoomRestriction = (
  roomId,
  messageOrDuration,
  responseData = null,
) => {
  const id = normalizeRoomId(roomId);
  if (!id) return;

  const blockedUntil = parseRestrictionUntil(messageOrDuration, responseData);
  const rawMsg =
    typeof messageOrDuration === "string" &&
    !/^(THIRTY_MINUTES|SEVEN_DAYS|PERMANENT)$/i.test(messageOrDuration)
      ? messageOrDuration
      : responseData?.message ||
        responseData?.reason ||
        "You are temporarily restricted from joining this room.";

  const record = {
    roomId: id,
    blockedUntil,
    message: rawMsg,
    restrictedAt: Date.now(),
  };

  roomRestrictions.set(id, record);
  persistRestrictions();
  DeviceEventEmitter.emit("roomRestrictionChanged", {
    roomId: id,
    isRestricted: true,
  });
};

/**
 * Clears a room restriction (e.g. host unbans user or timer completes).
 */
export const clearRoomRestriction = (roomId) => {
  const id = normalizeRoomId(roomId);
  if (!id) return;

  if (roomRestrictions.has(id)) {
    roomRestrictions.delete(id);
    persistRestrictions();
    DeviceEventEmitter.emit("roomRestrictionChanged", {
      roomId: id,
      isRestricted: false,
    });
  }
};

/**
 * Checks whether the given room is currently restricted for the user.
 * Automatically clears the restriction if the timer has expired.
 */
export const isRoomRestricted = (roomId) => {
  const id = normalizeRoomId(roomId);
  if (!id) return false;

  const record = roomRestrictions.get(id);
  if (!record) return false;

  const now = Date.now();
  if (record.blockedUntil !== Infinity && record.blockedUntil <= now) {
    // Kickout timer has completed! Auto-remove restriction
    clearRoomRestriction(id);
    return false;
  }

  return true;
};

/**
 * Returns active restriction details for a room, or null if unrestricted.
 */
export const getRoomRestriction = (roomId) => {
  const id = normalizeRoomId(roomId);
  if (!id) return null;

  if (!isRoomRestricted(id)) return null;

  const record = roomRestrictions.get(id);
  if (!record) return null;

  const remainingMs =
    record.blockedUntil === Infinity
      ? Infinity
      : Math.max(0, record.blockedUntil - Date.now());

  return {
    ...record,
    isRestricted: true,
    remainingMs,
  };
};

/**
 * Checks if the room is restricted. If restricted, immediately shows
 * the native restriction alert on the current screen and returns true (blocking navigation).
 * If not restricted, returns false (allowing navigation).
 */
export const checkAndShowRoomRestrictionAlert = (
  roomId,
  title = "Could not join room",
) => {
  const id = normalizeRoomId(roomId);
  if (!id) return false;

  const restriction = getRoomRestriction(id);
  if (restriction) {
    Alert.alert(
      title,
      restriction.message ||
        "You are temporarily restricted from joining this room.",
      [{ text: "OK" }],
      { cancelable: false },
    );
    return true;
  }

  return false;
};

// Listen to WebSocket user kicked events
DeviceEventEmitter.addListener("userKickedFromRoom", (event) => {
  if (!event) return;
  const targetRoomId = event?.roomId != null ? String(event.roomId) : null;
  if (!targetRoomId) return;

  const action = String(event.action || event.type || "").toUpperCase();
  if (action === "UNBAN" || action === "REMOVE" || action === "RESTRICTION_REMOVED") {
    clearRoomRestriction(targetRoomId);
  } else {
    setRoomRestriction(
      targetRoomId,
      event.message || event.duration || "You are temporarily restricted from this room.",
      event,
    );
  }
});
