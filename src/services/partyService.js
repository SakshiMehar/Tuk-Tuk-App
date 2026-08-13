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
  createRoomForUser as createRoomForUserApi,
  updateRoom as updateRoomApi,
  getPartyRanking as getPartyRankingApi,
  getFamilies as getFamiliesApi,
} from "../api/partyApi";
import { wsService } from "./websocket";
import { reserveSeat } from "./partyVoiceService";
import { syncUserFromToken } from "../utils/sessionUser";
import { resolveRemoteProfilePicUrl } from "./meProfileService";
import { resolveBundledAvatarId } from "../data/avatarOptions";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const normalizeAvatarField = (value) => {
  if (!value) return null;
  if (resolveBundledAvatarId(value)) return value;
  return resolveRemoteProfilePicUrl(value);
};

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

export const normalizeRoom = (room) => ({
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
  const user = seatValue?.user ?? seatValue?.profile ?? seatValue;
  const rawAvatar = firstText(
    user?.avatar,
    user?.avatarUrl,
    user?.profilePicUrl,
    user?.profileImageUrl,
    user?.profileImage,
    user?.photoUrl,
    seatValue?.avatarUrl,
    seatValue?.profileImageUrl,
    seatValue?.avatar
  );
  return {
    name: firstText(user?.name, user?.username, user?.displayName, seatValue?.name) ?? "Guest",
    username: firstText(user?.username, user?.handle, user?.nickname, user?.name),
    avatar: normalizeAvatarField(rawAvatar),
    active: Boolean(user?.isSpeaking ?? user?.active ?? user?.onMic ?? seatValue?.onMic),
    muted: Boolean(user?.muted ?? user?.isMuted ?? seatValue?.muted),
    id: firstValue(user?.id, user?.userId, user?.uid, seatValue?.userId),
  };
};

export const parseSeats = (seatsSource, stateData) => {
  const seatsObj = seatsSource ?? stateData?.seats ?? {};
  const entries = Object.entries(seatsObj);
  if (!entries.length) {
    return Array.from({ length: 15 }, (_, i) => ({
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
  return list.map((user) => {
    const rawAvatar = firstText(
      user?.avatar,
      user?.avatarUrl,
      user?.profilePicUrl,
      user?.profileImageUrl
    );
    return {
    id: firstValue(user?.id, user?.userId, user?.uid),
    name: firstText(user?.name, user?.username, user?.displayName) ?? "User",
    username: firstText(user?.username, user?.handle, user?.nickname),
    avatar: normalizeAvatarField(rawAvatar),
    muted: Boolean(user?.muted ?? user?.isMuted),
    isSpeaking: Boolean(user?.isSpeaking),
  };
  });
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

export const normalizeChatMessage = (msg, index = 0) => {
  const rawAvatar = firstText(
    msg?.avatar,
    msg?.avatarUrl,
    msg?.senderAvatar,
    msg?.senderAvatarUrl,
    msg?.senderProfilePic,
    msg?.senderProfileImageUrl,
    msg?.profilePicUrl,
    msg?.sender?.avatar,
    msg?.sender?.avatarUrl,
    msg?.sender?.profilePicUrl,
    msg?.sender?.profileImageUrl,
    msg?.message?.avatar,
    msg?.message?.senderAvatar,
    msg?.data?.avatar,
    msg?.data?.senderAvatar
  );

  // Temporary diagnostic — confirms whether the backend sends any sender-avatar
  // field on chat socket payloads at all (unlike seat/participant payloads, which
  // do). Remove once confirmed.
  console.log("[partyService] chat msg RAW ->", JSON.stringify(msg));
  console.log("[partyService] chat msg avatar resolved ->", rawAvatar);

  // Backend embeds this directly on the message/sender only when that
  // sender's own XP clears the VIP threshold — absent/null otherwise.
  const rawVipProfileFrame = firstText(
    msg?.profileFrameImageUrl,
    msg?.profileFrameUrl,
    msg?.vipProfileFrameUrl,
    msg?.sender?.profileFrameImageUrl,
    msg?.sender?.profileFrameUrl,
    msg?.message?.profileFrameImageUrl,
    msg?.message?.profileFrameUrl,
    msg?.data?.profileFrameImageUrl,
    msg?.data?.profileFrameUrl
  );

  return {
    id: firstValue(
      msg?.id,
      msg?.messageId,
      msg?._id,
      msg?.message?.id,
      msg?.data?.id,
      `msg-${index}`
    ),
    system: Boolean(msg?.system ?? msg?.type === "SYSTEM"),
    userId: firstValue(
      msg?.senderId,
      msg?.userId,
      msg?.sender?.id,
      msg?.sender?.userId,
      msg?.message?.senderId,
      msg?.data?.senderId
    ) ?? null,
    user:
      firstText(
        msg?.senderName,
        msg?.user,
        msg?.username,
        msg?.sender?.name,
        msg?.message?.senderName,
        msg?.data?.senderName
      ) ?? "User",
    avatar: normalizeAvatarField(rawAvatar),
    vipProfileFrameUrl: rawVipProfileFrame
      ? resolveRemoteProfilePicUrl(rawVipProfileFrame) ?? rawVipProfileFrame
      : null,
    text: resolveChatText(msg),
    level: msg?.level ?? msg?.senderLevel ?? 1,
    coins: msg?.coins ?? 0,
    diamonds: msg?.diamonds ?? 0,
    isGift: Boolean(msg?.isGift),
    pending: Boolean(msg?.pending),
  };
};

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

export const parseCreatedRoomId = (created, fallbackId) => {
  const resolved = firstValue(
    created?.roomId,
    created?.id,
    created?.room?.roomId,
    created?.room?.id,
    created?.data?.roomId,
    created?.data?.id,
    created?.result?.roomId,
    created?.result?.id,
    fallbackId
  );
  return String(resolved ?? fallbackId);
};

const roomExistsOnServer = async (roomId) => {
  try {
    await getRoomState(roomId);
    return true;
  } catch (err) {
    if (err?.status === 404) return false;
    return true;
  }
};

const postCreateRoom = async (roomId, createBody) => {
  try {
    return await createRoomApi(createBody);
  } catch (err) {
    const status = err?.status ?? err?.response?.status;
    if (status === 404 || status === 405 || status === 400) {
      return createRoomForUserApi(roomId, createBody);
    }
    throw err;
  }
};

export const createPartyRoom = async (payload = {}) => {
  await syncUserFromToken().catch(() => {});

  const {
    roomId: requestedRoomId,
    // Legacy/default behavior: exactly one persistent room per user, with the
    // room id forced to equal the user's id. Pass personalRoom: false to
    // instead mint a brand-new room every call (a host can then have more
    // than one room open at once) — requires backend support, see below.
    personalRoom = true,
    ...rest
  } = payload;

  // In new-room mode, requestedRoomId is a caller-chosen VANITY room id, not
  // a user id — never derive creatorId from it there (only personalRoom mode,
  // where room id = user id, ever conflates the two).
  const creatorId = String(
    rest.userId ?? rest.id ?? (personalRoom ? requestedRoomId : null) ?? ""
  );
  if (!creatorId) {
    throw new Error("User id is required to create a room.");
  }

  const roomName = rest.name ?? "My Room";

  // Confirmed POST /api/v1/tuktuk/rooms/create contract — just these fields.
  // The backend infers the creator from the auth token; no roomId/creatorId/
  // hostId/userId/invite-list fields belong in this body.
  const createBody = {
    name: roomName,
    ...(rest.profileImageUrl ? { profileImageUrl: rest.profileImageUrl } : {}),
    ...(rest.body ? { body: rest.body } : {}),
    ...(rest.category ? { category: rest.category } : {}),
    ...(rest.roomType ? { roomType: rest.roomType } : {}),
  };

  if (personalRoom) {
    const roomId = creatorId;

    try {
      const created = await postCreateRoom(roomId, createBody);
      // Always follow the create with an update — the create endpoint isn't
      // reliably persisting every field (see the earlier name-not-saving
      // issue), so PATCH is the source of truth for the room's actual
      // name/photo/etc. regardless of what create echoed back.
      try {
        await updateRoomApi(roomId, createBody);
      } catch {
        // Non-fatal — still enter the room even if this update fails.
      }
      return {
        roomId: parseCreatedRoomId(created, roomId),
        created,
        alreadyExists: false,
      };
    } catch (err) {
      const msg = String(err?.message ?? "");
      const status = err?.status ?? err?.response?.status;
      const conflict =
        status === 409 || /already exists|duplicate|conflict/i.test(msg);

      if (conflict) {
        const exists = await roomExistsOnServer(roomId);
        if (exists) {
          // The room already exists (room id = user id, so this happens on
          // every "Create & Enter" after the first) — apply the freshly
          // entered name/photo to it instead of silently discarding them.
          try {
            await updateRoomApi(roomId, createBody);
          } catch {
            // Non-fatal — still enter the room even if this update fails.
          }
          return { roomId, created: null, alreadyExists: true };
        }
      }

      throw err;
    }
  }

  // New-room mode — if the caller supplied a desired vanity room id, include
  // it; otherwise the confirmed body above is sent as-is and the backend
  // mints a fresh id. Whether the backend honors a caller-chosen id hasn't
  // been confirmed — test and adjust.
  const desiredRoomId = requestedRoomId ? String(requestedRoomId).trim() : null;
  const created = await createRoomApi(
    desiredRoomId ? { ...createBody, roomId: desiredRoomId, id: desiredRoomId } : createBody
  );
  const rawId = firstValue(
    created?.roomId,
    created?.id,
    created?.room?.roomId,
    created?.room?.id,
    created?.data?.roomId,
    created?.data?.id,
    created?.result?.roomId,
    created?.result?.id
  );
  if (!rawId) {
    throw new Error(
      "Room creation did not return a room id. The backend must generate and return a unique room id (distinct from creatorId) for new-room creation."
    );
  }

  // Always follow the create with an update — see the personalRoom branch
  // above for why (create doesn't reliably persist every field).
  try {
    await updateRoomApi(String(rawId), createBody);
  } catch {
    // Non-fatal — still enter the room even if this update fails.
  }

  return { roomId: String(rawId), created, alreadyExists: false };
};

/** Create room then join — use from Create & Enter before navigating to voice party */
export const createAndEnterPartyRoom = async (payload = {}) => {
  const { roomId } = await createPartyRoom(payload);
  return enterRoomSession(roomId);
};

/** Uploads a locally-picked photo as the room's profile/cover image via
 *  PATCH /api/v1/tuktuk/rooms/{roomId} (see updateRoom in partyApi.js).
 *  Returns the freshly-hosted image URL, or null if the response doesn't
 *  carry one back. */
export const updateRoomCoverPhoto = async (roomId, { uri, mimeType, fileName } = {}) => {
  const updated = await updateRoomApi(roomId, { imageUri: uri, mimeType, fileName });
  return firstText(
    updated?.profileImageUrl,
    updated?.imageUrl,
    updated?.room?.profileImageUrl,
    updated?.data?.profileImageUrl
  );
};

/** @deprecated Prefer createPartyRoom + enterRoomSession separately */
export const createAndJoinRoom = async (payload = {}) => {
  const { roomId } = await createPartyRoom(payload);
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
