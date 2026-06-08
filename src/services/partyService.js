import {
  getRoomRecommendations,
  joinRoom as joinRoomApi,
  exitRoom as exitRoomApi,
  getRoomState,
  getRoomChatMessages,
  createRoom as createRoomApi,
} from "../api/partyApi";
import { wsService } from "./websocket";
import { syncUserFromToken } from "../utils/sessionUser";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const listFrom = (value, key) => {
  const target = key && value?.[key] !== undefined ? value[key] : value;
  if (Array.isArray(target)) return target;
  return target?.content ?? target?.data ?? target?.items ?? target?.rooms ?? target?.messages ?? [];
};

const normalizeCategory = (room) => {
  const raw = firstText(room?.category, room?.roomType) ?? "recommend";
  return raw.toLowerCase().replace(/\s+/g, "_");
};

const normalizeRoom = (room) => ({
  ...room,
  id: firstValue(room?.roomId, room?.id, room?._id),
  name: firstText(room?.name) ?? "Voice Room",
  roomTypeLabel: firstText(room?.title) ?? "Voice Party",
  body: firstText(room?.body) ?? "",
  thumbnail: firstText(room?.profileImageUrl, room?.thumbnail, room?.coverImage, room?.imageUrl),
  participantCount: room?.userCount ?? room?.onlineCount ?? room?.participantCount ?? 0,
  hasChat: room?.hasChat !== false,
  verified: room?.status === "LIVE" || Boolean(room?.verified),
  category: normalizeCategory(room),
  hostId: firstValue(room?.creatorId, room?.hostId, room?.ownerId),
});

const normalizeSeatUser = (seatValue) => {
  if (!seatValue || seatValue === "EMPTY") return null;
  if (typeof seatValue === "string") {
    if (seatValue === "LOCKED") return null;
    return { name: seatValue, avatar: null, active: false, muted: true };
  }
  const user = seatValue?.user ?? seatValue;
  return {
    name: firstText(user?.name, user?.username, user?.displayName) ?? "Guest",
    avatar: firstText(user?.avatar, user?.avatarUrl, user?.profileImageUrl, user?.profileImage),
    active: Boolean(user?.isSpeaking ?? user?.active ?? !user?.muted),
    muted: Boolean(user?.muted ?? user?.isMuted),
    id: firstValue(user?.id, user?.userId, user?.uid),
  };
};

export const parseSeats = (seatsSource, stateData) => {
  const seatsObj = seatsSource ?? stateData?.seats ?? {};
  const entries = Object.entries(seatsObj);
  if (!entries.length) {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      user: null,
      locked: false,
    }));
  }
  return entries.map(([seatNum, value]) => {
    const id = Number(seatNum);
    const locked = value === "LOCKED" || value?.locked === true;
    const user = locked ? null : normalizeSeatUser(value);
    return { id, user, locked };
  });
};

export const parseOnlineUsers = (stateData, joinData) => {
  const candidates = [
    stateData?.participants,
    stateData?.onlineUsers,
    stateData?.members,
    stateData?.users,
    joinData?.participants,
  ];
  const list = candidates.find((item) => Array.isArray(item) && item.length > 0) ?? [];
  return list.map((user) => ({
    id: firstValue(user?.id, user?.userId, user?.uid),
    name: firstText(user?.name, user?.username) ?? "User",
    avatar: firstText(user?.avatar, user?.avatarUrl, user?.profileImageUrl),
    muted: Boolean(user?.muted ?? user?.isMuted),
    isSpeaking: Boolean(user?.isSpeaking),
  }));
};

export const normalizeChatMessage = (msg, index = 0) => ({
  id: firstValue(msg?.id, msg?.messageId, msg?._id, `msg-${index}`),
  system: Boolean(msg?.system ?? msg?.type === "SYSTEM"),
  user: firstText(msg?.senderName, msg?.user, msg?.username, msg?.sender?.name) ?? "User",
  avatar: firstText(msg?.avatar, msg?.senderAvatar, msg?.sender?.avatar),
  text: firstText(msg?.message, msg?.text, msg?.content, msg?.body) ?? "",
  level: msg?.level ?? 1,
  coins: msg?.coins ?? 0,
  diamonds: msg?.diamonds ?? 0,
});

export const normalizeChatMessages = (data) => {
  const list = Array.isArray(data) ? data : listFrom(data, "messages");
  return list.map((msg, index) => normalizeChatMessage(msg, index));
};

export const loadRoomRecommendations = async () => {
  const data = await getRoomRecommendations();
  const rooms = Array.isArray(data) ? data : listFrom(data, "recommendations");
  return rooms.map(normalizeRoom);
};

export const createAndJoinRoom = async (payload = {}) => {
  const created = await createRoomApi(payload);
  const roomId = firstValue(created?.roomId, created?.id, created?.room?.id);
  if (!roomId) throw new Error("Create room did not return a room id.");
  return enterRoomSession(roomId);
};

export const enterRoomSession = async (roomId) => {
  await syncUserFromToken().catch(() => {});
  const joinData = await joinRoomApi(roomId);
  const [stateData, chatData] = await Promise.all([
    getRoomState(roomId).catch(() => null),
    getRoomChatMessages(roomId).catch(() => []),
  ]);

  await wsService.connect();
  wsService.joinRoom(String(roomId));

  const room = joinData?.room ?? {};
  const seats = parseSeats(joinData?.seats, stateData);
  const onlineUsers = parseOnlineUsers(stateData, joinData);
  const messages = normalizeChatMessages(chatData);

  console.log("[partyService] enterRoomSession:", JSON.stringify({
    roomId,
    roomName: room?.name,
    onlineCount: joinData?.onlineCount ?? onlineUsers.length,
    seatCount: seats.length,
    messageCount: messages.length,
  }, null, 2));

  return {
    roomId,
    room: {
      id: firstValue(room?.id, roomId),
      name: firstText(room?.name) ?? "Voice Room",
      title: firstText(room?.title),
      body: firstText(room?.body),
      profileImageUrl: firstText(room?.profileImageUrl),
      hostId: firstValue(room?.creatorId, room?.hostId),
      category: room?.category,
    },
    seats,
    onlineUsers,
    onlineCount: joinData?.onlineCount ?? onlineUsers.length,
    messages,
    joinData,
    stateData,
  };
};

export const exitRoomSession = async (roomId) => {
  wsService.leaveRoom(String(roomId));
  const result = await exitRoomApi(roomId);
  console.log("[partyService] exitRoomSession:", roomId);
  return result;
};
