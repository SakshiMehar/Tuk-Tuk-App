import {
  getRoomRecommendations,
  getRecentlyRooms,
  getFollowingRooms,
  getManagedRooms,
  joinRandomParty as joinRandomPartyApi,
  joinRoom as joinRoomApi,
  exitRoom as exitRoomApi,
  getRoomState,
  getRoomChatMessages,
  createRoom as createRoomApi,
  getPartyRanking as getPartyRankingApi,
  getFamilies as getFamiliesApi,
} from "../api/partyApi";
import { wsService } from "./websocket";
import { reserveSeat } from "./partyVoiceService";
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

const parseRoomsResponse = (data) => {
  if (Array.isArray(data)) return data;
  return (
    data?.content ??
    data?.data ??
    data?.items ??
    data?.rooms ??
    data?.recommendations ??
    data?.recently ??
    data?.following ??
    data?.managed ??
    []
  );
};

const normalizeRoom = (room) => ({
  ...room,
  id: firstValue(room?.roomId, room?.id, room?._id),
  name: firstText(room?.name, room?.title, room?.roomName) ?? "Voice Room",
  title: firstText(room?.title, room?.name, room?.roomName) ?? "Voice Room",
  roomTypeLabel: firstText(room?.roomTypeLabel, room?.roomType, room?.type) ?? "Voice Party",
  body: firstText(room?.body, room?.description, room?.subtitle) ?? "",
  thumbnail: firstText(
    room?.profileImageUrl,
    room?.thumbnail,
    room?.coverImage,
    room?.imageUrl,
    room?.avatarUrl
  ),
  participantCount: room?.userCount ?? room?.onlineCount ?? room?.participantCount ?? 0,
  hasChat: room?.hasChat !== false,
  verified: room?.status === "LIVE" || Boolean(room?.verified),
  category: normalizeCategory(room),
  hostId: firstValue(room?.creatorId, room?.hostId, room?.ownerId),
  badges: Array.isArray(room?.badges) ? room.badges : [],
  statusIcons: Array.isArray(room?.statusIcons) ? room.statusIcons : [],
});

const normalizeSeatUser = (seatValue) => {
  if (!seatValue || seatValue === "EMPTY") return null;
  if (typeof seatValue === "string") {
    if (seatValue === "LOCKED") return null;
    return { name: seatValue, avatar: null, active: false, muted: true };
  }
  const user = seatValue?.user ?? seatValue;
  return {
    name: firstText(user?.name, user?.username, user?.displayName, seatValue?.name) ?? "Guest",
    avatar: firstText(
      user?.avatar,
      user?.avatarUrl,
      user?.profileImageUrl,
      user?.profileImage,
      user?.photoUrl,
      seatValue?.avatarUrl,
      seatValue?.profileImageUrl,
      seatValue?.avatar
    ),
    active: Boolean(user?.isSpeaking ?? user?.active ?? user?.onMic ?? seatValue?.onMic),
    muted: Boolean(user?.muted ?? user?.isMuted ?? seatValue?.muted),
    id: firstValue(user?.id, user?.userId, user?.uid, seatValue?.userId),
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

const resolveChatText = (msg) => {
  if (!msg || typeof msg !== "object") return "";
  if (typeof msg.message === "string") return msg.message.trim();
  const nested =
    msg.message && typeof msg.message === "object" ? msg.message : null;
  return (
    firstText(
      msg.text,
      msg.content,
      msg.body,
      nested?.message,
      nested?.text,
      nested?.content,
      nested?.body,
      msg.data?.message,
      msg.data?.text,
      msg.data?.content,
      msg.payload?.message,
      msg.payload?.text
    ) ?? ""
  );
};

export const normalizeChatMessage = (msg, index = 0) => ({
  id: firstValue(
    msg?.id,
    msg?.messageId,
    msg?._id,
    msg?.message?.id,
    msg?.data?.id,
    `msg-${index}`
  ),
  system: Boolean(msg?.system ?? msg?.type === "SYSTEM"),
  user:
    firstText(
      msg?.senderName,
      msg?.user,
      msg?.username,
      msg?.sender?.name,
      msg?.message?.senderName,
      msg?.data?.senderName
    ) ?? "User",
  avatar: firstText(
    msg?.avatar,
    msg?.senderAvatar,
    msg?.sender?.avatar,
    msg?.message?.avatar,
    msg?.data?.avatar
  ),
  text: resolveChatText(msg),
  level: msg?.level ?? msg?.senderLevel ?? 1,
  coins: msg?.coins ?? 0,
  diamonds: msg?.diamonds ?? 0,
  isGift: Boolean(msg?.isGift),
  pending: Boolean(msg?.pending),
});

export const createLocalChatMessage = ({ text, user, avatar, extra = {} }) => ({
  id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  system: false,
  user: user ?? "You",
  avatar: avatar ?? null,
  text: String(text ?? "").trim(),
  level: 1,
  coins: 0,
  diamonds: 0,
  pending: true,
  ...extra,
});

/** Append or replace a pending local echo when the server message arrives. */
export const upsertChatMessage = (prev, payload) => {
  const normalized = normalizeChatMessage(payload);
  if (!normalized.text) return prev;

  const exists = prev.some((m) => String(m.id) === String(normalized.id));
  if (exists) return prev;

  const pendingIdx = prev.findIndex(
    (m) =>
      m.pending &&
      m.text === normalized.text &&
      (m.user === normalized.user ||
        normalized.user === "User" ||
        m.user === "You")
  );
  if (pendingIdx >= 0) {
    const next = [...prev];
    next[pendingIdx] = { ...normalized, pending: false };
    return next;
  }

  return [...prev, normalized];
};

export const normalizeChatMessages = (data) => {
  const list = Array.isArray(data) ? data : listFrom(data, "messages");
  return list.map((msg, index) => normalizeChatMessage(msg, index));
};

const loadRoomsFromApi = async (fetcher, label) => {
  const data = await fetcher();
  const rooms = parseRoomsResponse(data);
  const list = rooms.map(normalizeRoom);
  
  return list;
};

export const loadRoomRecommendations = () =>
  loadRoomsFromApi(getRoomRecommendations, "recommendations");

export const loadRecentlyRooms = () =>
  loadRoomsFromApi(getRecentlyRooms, "recently rooms");

export const loadFollowingRooms = () =>
  loadRoomsFromApi(getFollowingRooms, "following rooms");

export const loadManagedRooms = () =>
  loadRoomsFromApi(getManagedRooms, "managed rooms");

export const enterRandomPartySession = async (payload = {}) => {
  await syncUserFromToken().catch(() => {});
  
  const data = await joinRandomPartyApi(payload);
  const roomId = firstValue(
    data?.roomId,
    data?.id,
    data?.room?.id,
    data?.room?.roomId,
    data?.data?.roomId,
    data?.data?.id
  );
  if (!roomId) throw new Error("Random party join did not return a room id.");
  
  return enterRoomSession(roomId);
};

export const createAndJoinRoom = async (payload = {}) => {
  await syncUserFromToken().catch(() => {});
  const created = await createRoomApi(payload);
  const roomId = firstValue(
    created?.roomId,
    created?.id,
    created?.room?.id,
    created?.room?.roomId,
    created?.data?.roomId,
    created?.data?.id
  );
  if (!roomId) throw new Error("Create room did not return a room id.");
  
  return enterRoomSession(roomId);
};

export const enterRoomSession = async (roomId) => {
  await syncUserFromToken().catch(() => {});

  const apiCalls = [];
  const track = (call) => apiCalls.push(call);

  track(`POST /api/v1/tuktuk/rooms/${roomId}/join`);
  const joinData = await joinRoomApi(roomId);

  track(`GET /api/v1/tuktuk/rooms/${roomId}/state`);
  track(`GET /api/v1/tuktuk/rooms/${roomId}/chat/messages`);
  let [stateData, chatData] = await Promise.all([
    getRoomState(roomId).catch(() => null),
    getRoomChatMessages(roomId).catch(() => []),
  ]);

  let reservedSeatNumber = null;
  let seats = parseSeats(joinData?.seats, stateData);
  const emptySeat = seats.find((seat) => !seat.user && !seat.locked);
  if (emptySeat) {
    try {
      track(
        `POST /api/v1/tuktuk/rooms/${roomId}/seat/${emptySeat.id}/claim`
      );
      await reserveSeat(roomId, emptySeat.id);
      reservedSeatNumber = emptySeat.id;
      track(`GET /api/v1/tuktuk/rooms/${roomId}/state (after seat claim)`);
      stateData = (await getRoomState(roomId).catch(() => stateData)) ?? stateData;
      seats = parseSeats(joinData?.seats, stateData);
    } catch (err) {
      
    }
  }

  await wsService.connect();
  wsService.joinRoom(String(roomId));

  

  const room = joinData?.room ?? {};
  const onlineUsers = parseOnlineUsers(stateData, joinData);
  const messages = normalizeChatMessages(chatData);

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
    reservedSeatNumber,
    joinData,
    stateData,
  };
};

const normalizeRankingEntry = (entry, index = 0) => {
  const profile = entry?.profile ?? entry?.user ?? {};
  return {
    id: firstValue(entry?.id, entry?.userId, entry?.uid, profile?.id, `rank-${index}`),
    rank: firstValue(entry?.rank, entry?.position, index + 1),
    name:
      firstText(entry?.name, entry?.username, entry?.displayName, profile?.name) ??
      "User",
    avatar: firstText(
      entry?.avatar,
      entry?.avatarUrl,
      entry?.profileImageUrl,
      entry?.profileImage,
      profile?.avatarUrl,
      profile?.profileImageUrl
    ),
    score: firstValue(entry?.score, entry?.points, entry?.diamonds, entry?.value, 0),
    level: firstValue(entry?.level, entry?.lv, profile?.level, null),
  };
};

const normalizeFamily = (family, index = 0) => ({
  id: firstValue(family?.id, family?.familyId, family?._id, `family-${index}`),
  rank: firstValue(family?.rank, family?.position, index + 1),
  name: firstText(family?.name, family?.familyName, family?.title) ?? "Family",
  emoji: firstText(family?.emoji, family?.icon, family?.badge) ?? "👪",
  avatar: firstText(family?.avatar, family?.avatarUrl, family?.logoUrl, family?.coverImage),
  memberCount: firstValue(
    family?.memberCount,
    family?.members,
    family?.totalMembers,
    family?.size,
    0
  ),
  level: firstValue(family?.level, family?.lv, 0),
  score: firstValue(family?.score, family?.points, family?.prosperity, 0),
});

// ── Feature flags ─────────────────────────────────────────────
// Flip these to `true` once the backend endpoints below are live.
// While false, the loaders skip the network call (so they don't spam
// 401 "Authentication token is required" for routes that don't exist yet)
// and just return an empty list, which the UI renders as an empty state.
const PARTY_RANKING_API_READY = false; // GET /api/app/party/ranking
const PARTY_FAMILY_API_READY = false;  // GET /api/app/party/families

// Party ranking leaderboard. period: "daily" | "weekly" | "monthly".
export const loadPartyRanking = async (period = "daily") => {
  if (!PARTY_RANKING_API_READY) {
    
    return [];
  }
  const data = await getPartyRankingApi(period);
  const list = listFrom(data, "ranking") ?? [];
  const entries = (Array.isArray(list) ? list : []).map(normalizeRankingEntry);
  
  return entries;
};

// List of families for the Family feature card.
export const loadFamilies = async () => {
  if (!PARTY_FAMILY_API_READY) {
    
    return [];
  }
  const data = await getFamiliesApi();
  const list = listFrom(data, "families") ?? [];
  const families = (Array.isArray(list) ? list : []).map(normalizeFamily);
  
  return families;
};

export const exitRoomSession = async (roomId) => {
  if (!roomId) return null;
  wsService.leaveRoom(String(roomId));
  const result = await exitRoomApi(roomId);
  
  return result;
};
