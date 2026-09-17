// ============================================================
// PARTY ROOM API — Voice & seat endpoints
// ============================================================
//
// Join as spectator:
//   POST /api/v1/tuktuk/rooms/{roomId}/join
// Claim a mic seat (after join):
//   POST /api/v1/tuktuk/rooms/{roomId}/seat/{seatNumber}/claim
// Exit (also releases any claimed seat):
//   POST /api/v1/tuktuk/rooms/{roomId}/exit
//
//   POST /api/v1/tuktuk/rooms/{roomId}/seat/{seatNumber}/toggle-mute?isMuted=true
//   POST /api/v1/tuktuk/rooms/{roomId}/seat/{seatNumber}/toggle-mute?isMuted=false
//
// Agora voice token:
//   GET /api/v1/tuktuk/rooms/{roomId}/voice-token?uid={uid}&isSpeaker=true   (speak)
//   GET /api/v1/tuktuk/rooms/{roomId}/voice-token?uid={uid}&isSpeaker=false  (listen)
//
// Auth: Authorization: Bearer <JWT>  |  Content-Type: application/json
// ============================================================

import { API_BASE_URL } from "../config/env";
import API, { authRequestConfig, getBearerToken, refreshTokenCache } from "./axios";

const LOG_TAG = "[PartyAPI]";

const logRequest = (method, path, payload) => {
  console.log(`${LOG_TAG} → ${method} ${path}`, payload ?? "");
};

const logResponse = (method, path, data) => {
  console.log(`${LOG_TAG} ← ${method} ${path}`, data);
};

const logError = (method, path, error) => {
  console.error(
    `${LOG_TAG} ✗ ${method} ${path}`,
    error?.response?.data ?? error?.message ?? error
  );
};

const fallbackMimeType = (uri) => {
  const ext = uri?.split("?")?.[0]?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "image/jpeg";
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const getRoomRecommendations = async () => {
  const response = await API.get(
    "/api/v1/tuktuk/rooms/recommendations",
    await authRequestConfig()
  );
  
  return response.data;
};

export const getRecentlyRooms = async () => {
  const response = await API.get(
    "/api/v1/tuktuk/rooms/recently",
    await authRequestConfig()
  );
  
  return response.data;
};

export const getFollowingRooms = async () => {
  const response = await API.get(
    "/api/v1/tuktuk/rooms/following",
    await authRequestConfig()
  );
  
  return response.data;
};

export const getManagedRooms = async () => {
  const response = await API.get(
    "/api/v1/tuktuk/rooms/managed",
    await authRequestConfig()
  );
  
  return response.data;
};

export const joinRandomParty = async (body = {}) => {
  const response = await API.post(
    "/api/v1/tuktuk/rooms/party",
    body,
    await authRequestConfig()
  );
  
  return response.data;
};

export const createRoom = async (body = {}) => {
  const path = "/api/v1/tuktuk/rooms/create";
  logRequest("POST", path, body);
  try {
    const response = await API.post(path, body, await authRequestConfig());
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** POST /api/v1/tuktuk/rooms/{roomId}/create — user-scoped room create (room id = user id) */
export const createRoomForUser = async (roomId, body = {}) => {
  const path = `/api/v1/tuktuk/rooms/${roomId}/create`;
  logRequest("POST", path, body);
  try {
    const response = await API.post(path, body, await authRequestConfig());
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/**
 * PATCH /api/v1/tuktuk/rooms/{roomId} — update room fields. Used here for
 * setting the room's profile/cover photo after creation. NOTE: the multipart
 * field name for the image ("image") is a best guess, matching this app's
 * uploadMyProfilePic convention — adjust if the backend expects something
 * else (e.g. "icon", matching the family-cover endpoint instead).
 */
export const updateRoom = async (roomId, { imageUri, mimeType, fileName, ...fields } = {}) => {
  const path = `/api/v1/tuktuk/rooms/${roomId}`;

  if (!imageUri) {
    logRequest("PATCH", path, fields);
    try {
      const response = await API.patch(path, fields, await authRequestConfig());
      logResponse("PATCH", path, response.data);
      return response.data;
    } catch (error) {
      logError("PATCH", path, error);
      throw error;
    }
  }

  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) throw new Error("Please log in again to continue.");

  const form = new FormData();
  form.append("image", {
    uri: imageUri,
    type: mimeType ?? fallbackMimeType(imageUri),
    name: fileName ?? "room-cover.jpg",
  });
  Object.entries(fields).forEach(([key, value]) => {
    if (value != null) form.append(key, String(value));
  });

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  logRequest("PATCH", path, { image: fileName ?? imageUri, ...fields });
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PATCH",
      headers,
      body: form,
    });
    const data = await parseResponseBody(response);
    if (!response.ok) {
      const message = data?.message ?? data?.error ?? `Room update failed (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      err.responseData = data;
      throw err;
    }
    logResponse("PATCH", path, data);
    return data;
  } catch (error) {
    logError("PATCH", path, error);
    throw error;
  }
};

/** GET /api/v1/tuktuk/rooms/{roomId}/announcement — fetch the room's pinned announcement */
export const getRoomAnnouncement = async (roomId) => {
  const path = `/api/v1/tuktuk/rooms/${roomId}/announcement`;
  logRequest("GET", path);
  try {
    const response = await API.get(path, await authRequestConfig());
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** PUT /api/v1/tuktuk/rooms/{roomId}/announcement — set the room's pinned announcement */
export const updateRoomAnnouncement = async (roomId, announcement) => {
  const path = `/api/v1/tuktuk/rooms/${roomId}/announcement`;
  const payload = { announcement };
  logRequest("PUT", path, payload);
  try {
    const response = await API.put(path, payload, await authRequestConfig());
    logResponse("PUT", path, response.data);
    return response.data;
  } catch (error) {
    logError("PUT", path, error);
    throw error;
  }
};

export const joinRoom = async (roomId) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/join`,
    {},
    await authRequestConfig()
  );
  
  return response.data;
};

export const exitRoom = async (roomId) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/exit`,
    {},
    await authRequestConfig()
  );
  
  return response.data;
};

export const getRoomState = async (roomId) => {
  const response = await API.get(
    `/api/v1/tuktuk/rooms/${roomId}/state`,
    await authRequestConfig()
  );
  return response.data;
};

const parseRoomUserCount = (data) => {
  if (typeof data === "number" && Number.isFinite(data)) return data;
  const nested =
    data?.onlineCount ??
    data?.count ??
    data?.userCount ??
    data?.data?.onlineCount ??
    data?.data?.count ??
    data?.data;
  if (typeof nested === "number" && Number.isFinite(nested)) return nested;
  return null;
};

export const getRoomUserCount = async (roomId) => {
  try {
    const response = await API.get(`/api/public/rooms/${roomId}/count`);
    const count = parseRoomUserCount(response.data);
    if (count != null) return count;
  } catch {
    // Public count can fail if Redis is down — fall back to room state.
  }

  try {
    const state = await getRoomState(roomId);
    return (
      parseRoomUserCount(state) ??
      (Array.isArray(state?.onlineUsers) ? state.onlineUsers.length : 0)
    );
  } catch {
    return 0;
  }
};

export const getClaimedSeats = async (roomId) => {
  const response = await API.get(`/api/public/rooms/${roomId}/claimed-seat`);
  return response.data;
};

export const getRoomChatMessages = async (roomId) => {
  const response = await API.get(
    `/api/v1/tuktuk/rooms/${roomId}/chat/messages`,
    await authRequestConfig()
  );
  return response.data;
};

export const claimSeat = async (roomId, seatNumber, profile) => {
  const body = { profile };
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/claim`,
    body,
    await authRequestConfig()
  );
  
  return response.data;
};

export const leaveSeat = async (roomId, seatNumber) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/leave`,
    {},
    await authRequestConfig()
  );
  return response.data;
};

/** POST .../seat/heartbeat — keep mic seat alive; backend evicts after 30 s of silence */
export const postSeatHeartbeat = async (roomId) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/seat/heartbeat`,
    {},
    await authRequestConfig()
  );
  return response.data;
};

/** POST .../heartbeat — keep the room presence session alive for ANY user
 *  in the room (seated or listening); backend auto-expires the session
 *  (and decrements the public count) after 90 s without one. */
export const postRoomHeartbeat = async (roomId) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/heartbeat`,
    {},
    await authRequestConfig()
  );
  return response.data;
};

/** POST .../seat/{seatNumber}/lock — host locks an empty seat */
export const lockSeat = async (roomId, seatNumber) => {
  const path = `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/lock`;
  logRequest("POST", path);
  try {
    const response = await API.post(path, {}, await authRequestConfig());
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** POST .../toggle-mute?isMuted=true|false */
export const toggleSeatMute = async (roomId, seatNumber, isMuted) => {
  const muted = isMuted === true || isMuted === "true";
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/toggle-mute?isMuted=${muted}`,
    {},
    await authRequestConfig()
  );
  return response.data;
};

/** GET .../voice-token?uid={uid}&isSpeaker=true|false */
export const getVoiceToken = async (roomId, uid, isSpeaker = true) => {
  const speaker = isSpeaker === true || isSpeaker === "true";
  const response = await API.get(
    `/api/v1/tuktuk/rooms/${roomId}/voice-token?uid=${uid}&isSpeaker=${speaker}`,
    await authRequestConfig()
  );
  return response.data?.data ?? response.data;
};

/** GET /api/app/party/ranking?period=daily|weekly|monthly — leaderboard. */
export const getPartyRanking = async (period = "daily") => {
  const url = `/api/app/party/ranking?period=${encodeURIComponent(period)}`;
  
  const response = await API.get(url, await authRequestConfig());
  
  return response.data;
};

/** GET /api/v1/tuktuk/rooms/search?q={query} — search rooms by name */
export const searchRooms = async (query) => {
  const response = await API.get(
    `/api/v1/tuktuk/rooms/search?q=${encodeURIComponent(query)}`,
    await authRequestConfig()
  );
  return response.data;
};

/** GET /api/app/party/families — fetch party families list */
export const getPartyFamilies = async () => {
  const url = "/api/app/party/families";
  
  const response = await API.get(url, await authRequestConfig());
  
  return response.data;
};

/** POST /api/v1/tuktuk/rooms/{roomId}/gift — pay with diamonds, broadcast animation */
export const sendDiamondRoomGift = async (roomId, body) => {
  const path = `/api/v1/tuktuk/rooms/${roomId}/gift`;
  const payload = {
    receiverId: Number(body?.receiverId),
    giftCode: String(body?.giftCode ?? ""),
    quantity: Math.max(1, Number(body?.quantity) || 1),
    diamondValue: Number(body?.diamondValue ?? 0),
    ...(body?.senderName ? { senderName: String(body.senderName) } : {}),
  };
  logRequest("POST", path, payload);
  try {
    const response = await API.post(path, payload, await authRequestConfig());
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** POST /api/v1/tuktuk/rooms/{roomId}/sendRoomGift — send owned inventory gift in room */
export const sendRoomGift = async (roomId, body) => {
  const path = `/api/v1/tuktuk/rooms/${roomId}/sendRoomGift`;
  const payload = {
    receiverId: Number(body?.receiverId),
    giftCode: String(body?.giftCode ?? body?.giftId ?? ""),
    quantity: Math.max(1, Number(body?.quantity) || 1),
    ...(body?.senderName ? { senderName: String(body.senderName) } : {}),
    ...(body?.animation ? { animation: String(body.animation) } : {}),
  };
  logRequest("POST", path, payload);
  try {
    const response = await API.post(path, payload, await authRequestConfig());
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};
