import { useEffect, useState } from "react";

// In-memory reactive state for live users and local live session
let localLiveRoomId = null;
let localUserOnline = true;
let currentLocalUserId = null;
const liveUsersMap = new Map(); // userId -> { isLive: boolean, roomId: string | null }
const onlineUsersMap = new Map(); // userId -> boolean (real-time presence)
const liveListeners = new Set();

const notifyLiveListeners = () => {
  liveListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener error
    }
  });
};

/**
 * Track the current device's local user ID so their own profile/avatar is always active
 */
export const setLocalUserId = (userId) => {
  const key = userId != null ? String(userId).trim() : null;
  if (currentLocalUserId !== key) {
    currentLocalUserId = key;
    if (key) {
      onlineUsersMap.set(key, localUserOnline);
    }
    notifyLiveListeners();
  }
};

export const getLocalUserId = () => currentLocalUserId;

/**
 * Subscribe to real-time live status updates
 */
export const subscribeLiveStatus = (listener) => {
  if (typeof listener !== "function") return () => { };
  liveListeners.add(listener);
  return () => liveListeners.delete(listener);
};

/**
 * Set the local user's live session state (when joining, starting, or exiting a room)
 */
export const setLocalUserLive = (roomId, isLive = true) => {
  const normalizedRoomId = isLive && roomId ? String(roomId).trim() : null;
  const changed = localLiveRoomId !== normalizedRoomId;
  localLiveRoomId = normalizedRoomId;
  if (changed) {
    notifyLiveListeners();
  }
};

/**
 * Set the local user's app online/foreground state
 */
export const setLocalUserOnline = (online = true) => {
  const next = Boolean(online);
  if (localUserOnline !== next) {
    localUserOnline = next;
    notifyLiveListeners();
  }
};

export const isLocalUserOnline = () => localUserOnline;

/**
 * Set real-time online presence for a specific user
 */
export const setUserOnlineStatus = (userId, isOnline = true) => {
  if (!userId) return;
  const key = String(userId).trim();
  const next = Boolean(isOnline);
  if (onlineUsersMap.get(key) !== next) {
    onlineUsersMap.set(key, next);
    notifyLiveListeners();
  }
};

/**
 * Get current local user's active live room ID (if live) or null
 */
export const getLocalLiveRoomId = () => localLiveRoomId;

/**
 * Update real-time live or presence status for a specific user (e.g. from WebSocket or room events)
 */
export const setUserLiveStatus = (userId, isLiveOrStatus, roomId = null) => {
  if (!userId) return;
  const key = String(userId).trim();

  if (typeof isLiveOrStatus === "object" && isLiveOrStatus !== null) {
    let changed = false;
    if (isLiveOrStatus.isOnline !== undefined || isLiveOrStatus.online !== undefined) {
      const nextOnline = Boolean(isLiveOrStatus.isOnline ?? isLiveOrStatus.online);
      if (onlineUsersMap.get(key) !== nextOnline) {
        onlineUsersMap.set(key, nextOnline);
        changed = true;
      }
    }
    const liveCandidate =
      isLiveOrStatus.isInRoom ??
      isLiveOrStatus.inRoom ??
      isLiveOrStatus.isLive ??
      isLiveOrStatus.live;
    if (liveCandidate !== undefined) {
      const liveVal = Boolean(liveCandidate);
      const rId = liveVal && (isLiveOrStatus.roomId || roomId) ? String(isLiveOrStatus.roomId || roomId).trim() : null;
      const prev = liveUsersMap.get(key);
      if (!prev || prev.isLive !== liveVal || prev.roomId !== rId) {
        liveUsersMap.set(key, { isLive: liveVal, roomId: rId });
        changed = true;
      }
    }
    if (changed) {
      notifyLiveListeners();
    }
    return;
  }

  const prev = liveUsersMap.get(key);
  const normalizedRoomId = isLiveOrStatus && roomId ? String(roomId).trim() : null;
  const isLive = Boolean(isLiveOrStatus);

  if (!prev || prev.isLive !== isLive || prev.roomId !== normalizedRoomId) {
    liveUsersMap.set(key, { isLive, roomId: normalizedRoomId });
    notifyLiveListeners();
  }
};

/**
 * Robustly resolve the target user's ID from any object (User, Peer, Conversation row, or primitive)
 */
export const resolveTargetUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string" || typeof user === "number") {
    const s = String(user).trim();
    return s && !s.includes("_") ? s : s;
  }
  const candidates = [
    user.userId,
    user.peerId,
    user.receiverId,
    user.otherUserId,
    user.peer?.id,
    user.peer?.userId,
    user.user?.id,
    user.user?.userId,
    user.id,
    user.uid,
    user._id,
  ];
  for (const c of candidates) {
    if (c != null) {
      const s = String(c).trim();
      // Skip conversation composite IDs like "100_101" if an actual userId is available
      if (s.length > 0 && !s.includes("_")) {
        return s;
      }
    }
  }
  return user.id != null ? String(user.id).trim() : null;
};

/**
 * Utility to determine if a user is currently in an active voice room
 */
export const isUserInRoom = (user) => {
  if (!user) return false;

  if (
    user.officialSender ||
    user.isOfficial ||
    user.official ||
    user.name === "Tuk Tuk Team" ||
    user.senderName === "Tuk Tuk Team"
  ) {
    return false;
  }

  const userKey = resolveTargetUserId(user);
  if (userKey === "100005") return false;

  // Real-time live status override from WebSocket
  if (userKey && liveUsersMap.has(userKey)) {
    const override = liveUsersMap.get(userKey);
    if (override?.isLive !== undefined) {
      return Boolean(override.isLive && override.roomId);
    }
  }

  // Explicit boolean
  if (user.isInRoom === true || user.inRoom === true) {
    return true;
  }
  if (user.isInRoom === false || user.inRoom === false) {
    return false;
  }

  // Check status string
  const rawStatus = user.liveStatus || user.userStatus || user.peer?.status || user.user?.status || "";
  const status = String(rawStatus).trim().toUpperCase();
  if (status === "ONLINE_IN_ROOM" || status === "IN_ROOM" || status === "IN_PARTY" || status === "VOICE_LIVE") {
    return true;
  }

  // Active room ID check
  const rId = getUserLiveRoomId(user);
  return Boolean(rId);
};

/**
 * Utility to determine if a user is currently live / active in a room session
 */
export const isUserLive = (user) => {
  if (!user) return false;

  const userKey = resolveTargetUserId(user);

  // Check real-time live override if tracked
  if (userKey && liveUsersMap.has(userKey)) {
    const override = liveUsersMap.get(userKey);
    if (override?.isLive !== undefined) {
      return Boolean(override.isLive);
    }
  }

  // Explicit false flags take precedence
  if (
    user.isLive === false ||
    user.live === false ||
    user.inLive === false ||
    user.isInRoom === false ||
    user.inRoom === false ||
    user.isLive === 0 ||
    user.live === 0 ||
    user.isLive === "false" ||
    user.live === "false"
  ) {
    return false;
  }

  // Explicit status string indicating offline/inactive
  const rawStatus = user.status || user.liveStatus || user.peer?.status || user.user?.status || "";
  const status = String(rawStatus).trim().toUpperCase();
  if (status === "OFFLINE" || status === "INACTIVE" || status === "IDLE" || status === "NONE" || status === "BANNED") {
    return false;
  }

  // Direct boolean / truthy flags
  if (
    user.isLive === true ||
    user.isLive === 1 ||
    user.isLive === "true" ||
    user.isLive === "1" ||
    user.live === true ||
    user.live === 1 ||
    user.live === "true" ||
    user.live === "1" ||
    user.inLive === true ||
    user.inLive === 1 ||
    user.inLive === "true" ||
    user.isInRoom === true ||
    user.inRoom === true
  ) {
    return true;
  }

  // Active room / voice session properties
  const candidateRoomIds = [
    user.roomId,
    user.currentRoomId,
    user.liveRoomId,
    user.partyRoomId,
    user.activeRoomId,
    user.voiceRoomId,
    user.joinedRoomId,
    user.room?.id,
    user.room?.roomId,
    user.peer?.roomId,
    user.user?.roomId,
  ];

  for (const rId of candidateRoomIds) {
    if (rId != null) {
      const s = String(rId).trim();
      if (s.length > 0 && s !== "0" && s !== "null" && s !== "undefined" && s !== "false") {
        return true;
      }
    }
  }

  // Status string
  if (
    status === "LIVE" ||
    status === "ONLINE_IN_ROOM" ||
    status === "STREAMING" ||
    status === "IN_PARTY" ||
    status === "IN_ROOM" ||
    status === "VOICE_LIVE"
  ) {
    return true;
  }

  return false;
};

/**
 * Returns the active roomId if user is currently live, or null
 */
export const getUserLiveRoomId = (user) => {
  if (!user) return null;

  if (
    user.officialSender ||
    user.isOfficial ||
    user.official ||
    user.name === "Tuk Tuk Team" ||
    user.senderName === "Tuk Tuk Team"
  ) {
    return null;
  }

  const userKey = resolveTargetUserId(user);
  if (userKey === "100005") return null;

  if (userKey && liveUsersMap.has(userKey)) {
    const override = liveUsersMap.get(userKey);
    if (override?.isLive && override.roomId) {
      return String(override.roomId).trim();
    }
  }

  const candidateRoomIds = [
    user.liveRoomId,
    user.partyRoomId,
    user.activeRoomId,
    user.voiceRoomId,
    user.joinedRoomId,
    user.currentRoomId,
    user.room?.id,
    user.room?.roomId,
    user.peer?.roomId,
    user.user?.roomId,
    user.peer ? user.roomId : null,
  ];

  for (const rId of candidateRoomIds) {
    if (rId != null) {
      const s = String(rId).trim();
      if (s.length > 0 && s !== "0" && s !== "null" && s !== "undefined" && s !== "false") {
        return s;
      }
    }
  }

  return null;
};

/**
 * Utility to determine if a user is currently online
 */
export const isUserOnline = (user) => {
  if (!user) return false;

  // Bot/official account check
  if (
    user.officialSender ||
    user.isOfficial ||
    user.official ||
    user.name === "Tuk Tuk Team" ||
    user.senderName === "Tuk Tuk Team"
  ) {
    return false;
  }

  const userKey = resolveTargetUserId(user);
  if (userKey === "100005") {
    return false;
  }

  // Local user check: if this user is the active user on this device
  if (userKey && currentLocalUserId && userKey === currentLocalUserId) {
    return localUserOnline;
  }

  // Real-time online override from WebSocket /topic/presence
  if (userKey && onlineUsersMap.has(userKey)) {
    return Boolean(onlineUsersMap.get(userKey));
  }

  // Check status string
  const rawStatus =
    user.peer?.status ||
    user.user?.status ||
    user.liveStatus ||
    user.userStatus ||
    user.status ||
    "";
  const status = String(rawStatus).trim().toUpperCase();
  if (
    status === "OFFLINE" ||
    status === "INACTIVE" ||
    status === "IDLE" ||
    status === "NONE" ||
    status === "BANNED" ||
    status === "ACTIVE" // Database account status 'ACTIVE' is not online presence
  ) {
    return false;
  }

  // Explicit false flags
  if (
    user.online === false ||
    user.isOnline === false ||
    user.online === 0 ||
    user.isOnline === 0 ||
    user.online === "false" ||
    user.isOnline === "false" ||
    user.peer?.online === false ||
    user.peer?.isOnline === false
  ) {
    return false;
  }

  // Direct boolean / truthy flags
  if (
    user.online === true ||
    user.online === 1 ||
    user.online === "true" ||
    user.online === "1" ||
    user.isOnline === true ||
    user.isOnline === 1 ||
    user.isOnline === "true" ||
    user.isOnline === "1" ||
    user.peer?.online === true ||
    user.peer?.isOnline === true
  ) {
    return true;
  }

  if (
    status === "ONLINE" ||
    status === "ONLINE_IN_ROOM" ||
    status === "LIVE" ||
    status === "IN_PARTY"
  ) {
    return true;
  }

  return false;
};

/**
 * Checks if a user is online or live (to show the green active dot)
 */
export const isUserOnlineOrLive = (user) => {
  if (!user) return false;
  const userKey = resolveTargetUserId(user);

  // Local user check
  if (userKey && currentLocalUserId && userKey === currentLocalUserId) {
    return localUserOnline;
  }

  // Real-time WebSocket presence is the absolute source of truth
  if (userKey && onlineUsersMap.has(userKey)) {
    return Boolean(onlineUsersMap.get(userKey));
  }

  return isUserLive(user) || isUserOnline(user);
};

/**
 * React hook to observe a user's live status in real-time
 */
export const useUserLiveStatus = (user, explicitIsLive, explicitIsOnline) => {
  const evaluate = () => {
    if (!user) return false;

    // Explicit false overrides take precedence when caller specifically disables them
    if (explicitIsLive === false && explicitIsOnline === false) {
      return false;
    }
    if (explicitIsOnline === false && (explicitIsLive === false || explicitIsLive == null)) {
      return false;
    }
    if (explicitIsLive === false && (explicitIsOnline === false || explicitIsOnline == null)) {
      return false;
    }

    const userKey = resolveTargetUserId(user);

    // Local user check
    if (userKey && currentLocalUserId && userKey === currentLocalUserId) {
      return localUserOnline;
    }

    // Real-time WebSocket presence override:
    // If the server tells us this user is online or offline via /topic/presence,
    // this is the absolute authoritative source of truth.
    if (userKey && onlineUsersMap.has(userKey)) {
      return Boolean(onlineUsersMap.get(userKey));
    }

    if (explicitIsOnline !== undefined && explicitIsOnline !== null) {
      return Boolean(explicitIsOnline);
    }
    if (explicitIsLive !== undefined && explicitIsLive !== null) {
      if (explicitIsLive === false) {
        return isUserOnline(user);
      }
      return Boolean(explicitIsLive) && isUserOnline(user);
    }

    return isUserOnlineOrLive(user);
  };

  const [active, setActive] = useState(evaluate);

  useEffect(() => {
    setActive(evaluate());
    const unsubscribe = subscribeLiveStatus(() => {
      setActive(evaluate());
    });
    return unsubscribe;
  }, [user, explicitIsLive, explicitIsOnline]);

  return active;
};

export const useUserOnlineOrLiveStatus = useUserLiveStatus;



