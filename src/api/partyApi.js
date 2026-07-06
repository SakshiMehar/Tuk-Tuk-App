// ============================================================
// PARTY ROOM API — Voice & seat endpoints
// ============================================================
//
// Toggle mute (user on a seat):
//   POST /api/v1/tuktuk/rooms/{roomId}/seat/{seatNumber}/toggle-mute?isMuted=true
//   POST /api/v1/tuktuk/rooms/{roomId}/seat/{seatNumber}/toggle-mute?isMuted=false
//
// Agora voice token:
//   GET /api/v1/tuktuk/rooms/{roomId}/voice-token?uid={uid}&isSpeaker=true   (speak)
//   GET /api/v1/tuktuk/rooms/{roomId}/voice-token?uid={uid}&isSpeaker=false  (listen)
//
// Auth: Authorization: Bearer <JWT>  |  Content-Type: application/json
// ============================================================

import API, { authRequestConfig } from "./axios";

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

/** GET /api/app/party/families — list of families. */
export const getFamilies = async () => {
  const url = "/api/app/party/families";
  
  const response = await API.get(url, await authRequestConfig());
  
  return response.data;
};

/** POST /api/v1/tuktuk/rooms/{roomId}/sendRoomGift — party room gift (diamond pay / room broadcast) */
export const sendRoomGift = async (roomId, body) => {
  const path = `/api/v1/tuktuk/rooms/${roomId}/sendRoomGift`;
  const payload = {
    receiverId: Number(body?.receiverId),
    giftCode: String(body?.giftCode ?? body?.giftId ?? ""),
    quantity: Math.max(1, Number(body?.quantity) || 1),
    ...(body?.diamondValue != null ? { diamondValue: Number(body.diamondValue) } : {}),
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
