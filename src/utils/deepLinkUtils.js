import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRoomShareUrl } from "../config/env";

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

/**
 * Generates a standardized room invitation message string.
 */
export const createRoomInviteMessage = ({ roomId, roomTitle }) => {
  const safeId = String(roomId ?? "").trim();
  const safeTitle = String(roomTitle ?? "Voice Party Room").trim();
  const shareUrl = getRoomShareUrl(safeId);
  return `[VOICE_ROOM_INVITE:roomId=${safeId},title=${encodeURIComponent(safeTitle)}]\n🎙️ Join my Voice Party Room: "${safeTitle}"!\n${shareUrl}`;
};

/**
 * Parses a message string to check if it's a room invitation.
 * Returns { isRoomInvite: true, roomId, roomTitle, roomUrl } or { isRoomInvite: false }
 */
export const parseRoomInviteMessage = (text) => {
  if (!text || typeof text !== "string") return { isRoomInvite: false };
  const trimmed = text.trim();

  // 1. Structured tag format: [VOICE_ROOM_INVITE:roomId=123,title=...]
  const structuredMatch = trimmed.match(
    /\[VOICE_ROOM_INVITE:roomId=([a-zA-Z0-9_-]+)(?:,title=([^\]]+))?\]/i,
  );
  if (structuredMatch && structuredMatch[1]) {
    const roomId = structuredMatch[1];
    let roomTitle = "Voice Party Room";
    if (structuredMatch[2]) {
      try {
        roomTitle = decodeURIComponent(structuredMatch[2]);
      } catch {
        roomTitle = structuredMatch[2];
      }
    }
    const roomUrl = getRoomShareUrl(roomId);
    return {
      isRoomInvite: true,
      roomId,
      roomTitle,
      roomUrl,
    };
  }

  // 2. Fallback: check if the text contains a voice room share link and invitation context
  const roomId = extractRoomIdFromUrl(trimmed);
  if (
    roomId &&
    (/voice party|join my room|join (?:the )?room|room invite|tuktuk\.live\/room/i.test(
      trimmed,
    ) ||
      trimmed.startsWith("https://tuktuk.live/room/") ||
      trimmed.startsWith("http://tuktuk.live/room/"))
  ) {
    const titleMatch = trimmed.match(/["“]([^"”]+)["”]/);
    const roomTitle = titleMatch ? titleMatch[1] : "Voice Party Room";
    return {
      isRoomInvite: true,
      roomId,
      roomTitle,
      roomUrl: getRoomShareUrl(roomId),
    };
  }

  return { isRoomInvite: false };
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
