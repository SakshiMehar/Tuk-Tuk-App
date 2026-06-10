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

export const getRoomRecommendations = async () => {
  const response = await API.get(
    "/api/v1/tuktuk/rooms/recommendations",
    await authRequestConfig()
  );
  console.log(
    "[partyApi] GET /api/v1/tuktuk/rooms/recommendations:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getRecentlyRooms = async () => {
  const response = await API.get(
    "/api/v1/tuktuk/rooms/recently",
    await authRequestConfig()
  );
  console.log(
    "[partyApi] GET /api/v1/tuktuk/rooms/recently:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getFollowingRooms = async () => {
  const response = await API.get(
    "/api/v1/tuktuk/rooms/following",
    await authRequestConfig()
  );
  console.log(
    "[partyApi] GET /api/v1/tuktuk/rooms/following:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getManagedRooms = async () => {
  const response = await API.get(
    "/api/v1/tuktuk/rooms/managed",
    await authRequestConfig()
  );
  console.log(
    "[partyApi] GET /api/v1/tuktuk/rooms/managed:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const joinRandomParty = async (body = {}) => {
  const response = await API.post(
    "/api/v1/tuktuk/rooms/party",
    body,
    await authRequestConfig()
  );
  console.log(
    "[partyApi] POST /api/v1/tuktuk/rooms/party:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const createRoom = async (body = {}) => {
  const response = await API.post(
    "/api/v1/tuktuk/rooms/create",
    body,
    await authRequestConfig()
  );
  console.log(
    "[partyApi] POST /api/v1/tuktuk/rooms/create:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const joinRoom = async (roomId) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/join`,
    {},
    await authRequestConfig()
  );
  console.log(
    `[partyApi] POST /api/v1/tuktuk/rooms/${roomId}/join:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const exitRoom = async (roomId) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/exit`,
    {},
    await authRequestConfig()
  );
  console.log(
    `[partyApi] POST /api/v1/tuktuk/rooms/${roomId}/exit:`,
    JSON.stringify(response.data, null, 2)
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
  console.log(
    `[partyApi] POST /api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/claim:`,
    JSON.stringify(response.data, null, 2)
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
  return response.data;
};

export const sendRoomGift = async (roomId, body) => {
  const response = await API.post(
    `/api/v1/tuktuk/rooms/${roomId}/gift`,
    body,
    await authRequestConfig()
  );
  console.log(
    `[partyApi] POST /api/v1/tuktuk/rooms/${roomId}/gift:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};
