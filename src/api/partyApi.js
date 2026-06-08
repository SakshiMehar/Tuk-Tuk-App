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

const log = (label, data) => {
  console.log(label, JSON.stringify(data, null, 2));
};

export const getRoomRecommendations = async () => {
  const response = await API.get("/api/v1/tuktuk/rooms/recommendations");
  log("[partyApi] GET /api/v1/tuktuk/rooms/recommendations:", response.data);
  return response.data;
};

export const createRoom = async (body = {}) => {
  const response = await API.post("/api/v1/tuktuk/rooms/create", body);
  log("[partyApi] POST /api/v1/tuktuk/rooms/create:", response.data);
  return response.data;
};

export const joinRoom = async (roomId) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/join`,
    {},
    await authRequestConfig()
  );
  log(`[partyApi] POST /api/v1/tuktuk/rooms/${roomId}/join:`, response.data);
  return response.data;
};

export const exitRoom = async (roomId) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/exit`,
    {},
    await authRequestConfig()
  );
  log(`[partyApi] POST /api/v1/tuktuk/rooms/${roomId}/exit:`, response.data);
  return response.data;
};

export const getRoomState = async (roomId) => {
  const response = await API.get(
    `/api/v1/tuktuk/rooms/${roomId}/state`,
    await authRequestConfig()
  );
  log(`[partyApi] GET /api/v1/tuktuk/rooms/${roomId}/state:`, response.data);
  return response.data;
};

export const getRoomChatMessages = async (roomId) => {
  const response = await API.get(
    `/api/v1/tuktuk/rooms/${roomId}/chat/messages`,
    await authRequestConfig()
  );
  log(`[partyApi] GET /api/v1/tuktuk/rooms/${roomId}/chat/messages:`, response.data);
  return response.data;
};

export const claimSeat = async (roomId, seatNumber, profile) => {
  const body = { profile };
  log(`[partyApi] POST .../seat/${seatNumber}/claim body:`, body);
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/claim`,
    body,
    await authRequestConfig()
  );
  log(`[partyApi] POST .../seat/${seatNumber}/claim:`, response.data);
  return response.data;
};

export const leaveSeat = async (roomId, seatNumber) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/leave`,
    {},
    await authRequestConfig()
  );
  log(`[partyApi] POST .../seat/${seatNumber}/leave:`, response.data);
  return response.data;
};

/** POST .../toggle-mute?isMuted=true|false */
export const toggleSeatMute = async (roomId, seatNumber, isMuted) => {
  const muted = isMuted === true || isMuted === "true";
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/toggle-mute?isMuted=${muted}`,
    {},
    await authRequestConfig()
  );
  log(
    `[partyApi] POST /api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/toggle-mute?isMuted=${muted}:`,
    response.data
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
  log(
    `[partyApi] GET /api/v1/tuktuk/rooms/${roomId}/voice-token?uid=${uid}&isSpeaker=${speaker}:`,
    response.data
  );
  return response.data;
};

export const sendRoomGift = async (roomId, body) => {
  const response = await API.post(`/api/v1/tuktuk/rooms/${roomId}/gift`, body);
  log(`[partyApi] POST /api/v1/tuktuk/rooms/${roomId}/gift:`, response.data);
  return response.data;
};
