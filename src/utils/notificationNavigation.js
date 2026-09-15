import { Linking } from "react-native";
import { openUserChat } from "./chatNavigation";
import { getAppUserId } from "./sessionUser";

let pendingNotification = null;

/**
 * Stores notification payload received during cold-start so splash screen
 * can finish before navigation takes place.
 */
export const setPendingNotification = (data) => {
  if (!data) return;
  pendingNotification = data;
};

export const getPendingNotification = () => pendingNotification;

/**
 * Returns the pending notification payload and clears it to prevent double navigation.
 */
export const consumePendingNotification = () => {
  const data = pendingNotification;
  pendingNotification = null;
  return data;
};

/**
 * Known app routes registered in Expo Router.
 */
const KNOWN_APP_ROUTES = new Set([
  "/",
  "/login",
  "/enter-mobile",
  "/verify-otp",
  "/terms-of-use",
  "/privacy-policy",
  "/settings",
  "/account",
  "/voice-party",
  "/find-friends",
  "/nearby",
  "/chat-box",
  "/user-profile",
  "/blocked-accounts",
  "/message-notification",
  "/(tabs)",
  "/(tabs)/home",
  "/(tabs)/chat",
  "/(tabs)/party",
  "/(tabs)/profile",
  "/(tabs)/blind-pick",
  "/home",
  "/chat",
  "/party",
  "/profile",
  "/blind-pick",
]);

/**
 * Resolves targetUrl or notification payload into an in-app route or external URL action.
 */
const resolveTargetAction = async (targetUrl, data = {}) => {
  if (!targetUrl || typeof targetUrl !== "string") return null;

  let urlStr = targetUrl.trim();
  if (!urlStr) return null;

  console.log("[notificationNavigation] Resolving targetUrl:", urlStr);

  // Strip custom schemes like tuktuk://, app://, etc.
  urlStr = urlStr.replace(/^(tuktuk|app|tuk-tuk):\/\/?/i, "/");

  // Extract pathname and query string
  let path = urlStr;
  let queryString = "";
  try {
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
      const parsed = new URL(urlStr);
      path = parsed.pathname;
      queryString = parsed.search;
    } else {
      const qIndex = urlStr.indexOf("?");
      if (qIndex !== -1) {
        path = urlStr.slice(0, qIndex);
        queryString = urlStr.slice(qIndex);
      }
    }
  } catch {
    const qIndex = urlStr.indexOf("?");
    if (qIndex !== -1) {
      path = urlStr.slice(0, qIndex);
      queryString = urlStr.slice(qIndex);
    }
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const queryParams = new URLSearchParams(queryString);

  // Helper to get fallback display info for chat
  const senderName =
    data.title ||
    data.senderName ||
    data.name ||
    queryParams.get("name") ||
    queryParams.get("senderName") ||
    "Tuk Tuk Team";

  const senderAvatar =
    data.avatar ||
    data.imageUrl ||
    data.senderAvatar ||
    queryParams.get("avatar") ||
    null;

  // 1. Check for conversationId format: e.g. /app/chats/1001_100003 or /chats/1001_100003 or 1001_100003
  const conversationMatch = path.match(/\/chats?\/(\d+)_(\d+)/i) || path.match(/^\/?(\d+)_(\d+)$/);
  if (conversationMatch) {
    const userA = conversationMatch[1];
    const userB = conversationMatch[2];
    const currentUserId = await getAppUserId().catch(() => null);

    // Pick the other user's ID
    const targetUserId =
      String(currentUserId) === String(userA) ? userB : userA;

    console.log("[notificationNavigation] Matched conversation target:", {
      userA,
      userB,
      currentUserId,
      targetUserId,
    });

    return {
      type: "chat",
      userId: String(targetUserId),
      name: senderName,
      avatar: senderAvatar,
    };
  }

  // 2. Chat & Messages endpoints / deep links
  // e.g. /api/app/chats/users/1001/messages, /app/chats/users/1001, /app/chats/1001, /chats/1001, /chat-box, /chat?userId=1001
  const chatMatch =
    path.match(/\/chats?\/users?\/(\d+)/i) ||
    path.match(/\/chats?\/(\d+)/i) ||
    path.match(/\/chat-box\/(\d+)/i);

  const queryUserId =
    queryParams.get("userId") ||
    queryParams.get("user_id") ||
    queryParams.get("chatUserId") ||
    queryParams.get("id");

  if (
    chatMatch?.[1] ||
    queryUserId ||
    path.includes("/chat-box") ||
    path === "/app/chat" ||
    path === "/chat" ||
    path === "/(tabs)/chat"
  ) {
    const targetUserId =
      chatMatch?.[1] ||
      queryUserId ||
      data.chatUserId ||
      data.userId ||
      data.senderId;

    if (targetUserId) {
      return {
        type: "chat",
        userId: String(targetUserId),
        name: senderName,
        avatar: senderAvatar,
      };
    }
    return { type: "route", path: "/(tabs)/chat" };
  }

  // 3. Voice Party / Rooms endpoints & deep links
  // e.g. /api/app/rooms/55, /app/rooms/55, /rooms/55, /voice-party?roomId=55
  const roomMatch =
    path.match(/\/rooms?\/(\d+)/i) ||
    path.match(/\/voice-party\/(\d+)/i);

  const queryRoomId =
    queryParams.get("roomId") ||
    queryParams.get("room_id") ||
    queryParams.get("channelId");

  if (
    roomMatch?.[1] ||
    queryRoomId ||
    path.includes("/voice-party") ||
    path === "/app/party" ||
    path === "/party" ||
    path === "/(tabs)/party"
  ) {
    const roomId =
      roomMatch?.[1] || queryRoomId || data.roomId || data.channelId;
    if (roomId) {
      return {
        type: "route",
        path: "/voice-party",
        params: { roomId: String(roomId) },
      };
    }
    return { type: "route", path: "/(tabs)/party" };
  }

  // 4. User Profile endpoints & deep links
  // e.g. /api/app/users/1001, /app/users/1001, /user-profile?userId=1001
  const profileMatch =
    path.match(/\/users?\/(\d+)/i) ||
    path.match(/\/user-profile\/(\d+)/i);

  if (profileMatch?.[1] || (path.includes("/user-profile") && queryUserId)) {
    const targetUserId =
      profileMatch?.[1] || queryUserId || data.userId || data.targetUserId;
    if (targetUserId) {
      return {
        type: "route",
        path: "/user-profile",
        params: {
          userId: String(targetUserId),
          name: data.name || senderName,
          avatar: data.avatar || senderAvatar,
        },
      };
    }
  }

  // 5. Check known in-app routes (with /app/ prefix stripped if present)
  let cleanPath = path.replace(/^\/app/i, "");
  if (!cleanPath.startsWith("/")) cleanPath = `/${cleanPath}`;

  const normalizedCleanPath = cleanPath.toLowerCase();
  if (normalizedCleanPath === "/home" || normalizedCleanPath === "/(tabs)/home")
    return { type: "route", path: "/(tabs)/home" };
  if (normalizedCleanPath === "/chat" || normalizedCleanPath === "/(tabs)/chat")
    return { type: "route", path: "/(tabs)/chat" };
  if (normalizedCleanPath === "/party" || normalizedCleanPath === "/(tabs)/party")
    return { type: "route", path: "/(tabs)/party" };
  if (normalizedCleanPath === "/profile" || normalizedCleanPath === "/(tabs)/profile")
    return { type: "route", path: "/(tabs)/profile" };
  if (normalizedCleanPath === "/blind-pick" || normalizedCleanPath === "/(tabs)/blind-pick")
    return { type: "route", path: "/(tabs)/blind-pick" };
  if (normalizedCleanPath === "/account") return { type: "route", path: "/account" };
  if (normalizedCleanPath === "/settings")
    return { type: "route", path: "/settings" };
  if (normalizedCleanPath === "/nearby") return { type: "route", path: "/nearby" };
  if (normalizedCleanPath === "/find-friends")
    return { type: "route", path: "/find-friends" };
  if (normalizedCleanPath === "/message-notification")
    return { type: "route", path: "/message-notification" };
  if (normalizedCleanPath === "/blocked-accounts")
    return { type: "route", path: "/blocked-accounts" };

  // 6. If it matches a known registered screen path
  if (KNOWN_APP_ROUTES.has(cleanPath)) {
    const paramsObj = {};
    queryParams.forEach((val, key) => {
      paramsObj[key] = val;
    });
    return { type: "route", path: cleanPath, params: paramsObj };
  }

  // 7. External Web URL (e.g. promotional links, landing pages)
  if (
    /^https?:\/\//i.test(urlStr) &&
    !urlStr.includes("/api/app/") &&
    !urlStr.includes("/api/v1/") &&
    !urlStr.includes("localhost")
  ) {
    return { type: "external", url: urlStr };
  }

  // Fallback: If targetUrl was not resolved to an exact route, check if data has senderId/chatUserId
  if (data.senderId || data.chatUserId || data.conversationId) {
    let fallbackUserId = data.chatUserId || data.senderId;
    if (!fallbackUserId && data.conversationId) {
      const parts = String(data.conversationId).split("_");
      const currentUserId = await getAppUserId().catch(() => null);
      fallbackUserId = String(currentUserId) === parts[0] ? parts[1] : parts[0];
    }
    if (fallbackUserId) {
      return {
        type: "chat",
        userId: String(fallbackUserId),
        name: senderName,
        avatar: senderAvatar,
      };
    }
  }

  return { type: "route", path: "/(tabs)/chat" };
};

/**
 * Handles navigation based on FCM notification payload or in-app notification item.
 * Supports targetUrl, conversationId, chatUserId, userId, roomId, pathname, etc.
 */
export const navigateFromNotification = async (router, rawData) => {
  if (!router || !rawData) {
    console.warn("[notificationNavigation] router or data missing", {
      hasRouter: Boolean(router),
      hasData: Boolean(rawData),
    });
    return false;
  }

  // Unpack nested payload/data if present
  let data = { ...rawData };
  if (typeof rawData.data === "string") {
    try {
      const parsed = JSON.parse(rawData.data);
      data = { ...data, ...parsed };
    } catch {}
  } else if (typeof rawData.data === "object" && rawData.data) {
    data = { ...data, ...rawData.data };
  }

  console.log(
    "[notificationNavigation] navigateFromNotification invoked with:",
    JSON.stringify(data, null, 2)
  );

  const rawTargetUrl =
    data.targetUrl ||
    data.target_url ||
    data.url ||
    data.actionUrl ||
    data.action_url ||
    data.link ||
    data.redirectUrl;

  // 1. Resolve and execute targetUrl action
  if (rawTargetUrl) {
    const action = await resolveTargetAction(rawTargetUrl, data);
    console.log("[notificationNavigation] Resolved target action:", action);
    if (action) {
      if (action.type === "chat") {
        console.log("[notificationNavigation] Opening chat with user:", action.userId);
        return openUserChat(router, {
          userId: action.userId,
          name: action.name,
          avatar: action.avatar,
        });
      }

      if (action.type === "route") {
        try {
          console.log("[notificationNavigation] Navigating to in-app route:", action.path, action.params);
          router.push({
            pathname: action.path,
            params: action.params ?? {},
          });
          return true;
        } catch (err) {
          console.warn("[notificationNavigation] router.push failed:", err);
        }
      }

      if (action.type === "external") {
        try {
          console.log("[notificationNavigation] Opening external URL:", action.url);
          const canOpen = await Linking.canOpenURL(action.url);
          if (canOpen) {
            await Linking.openURL(action.url);
            return true;
          }
        } catch (err) {
          console.warn("[notificationNavigation] Linking.openURL failed:", err);
        }
      }
    }
  }

  // 2. Direct chat message / sender fallback
  let chatUserId =
    data.chatUserId ||
    data.senderId ||
    data.authorId;

  // If conversationId like "1001_100003" is present, pick the other user's ID
  if (!chatUserId && data.conversationId && typeof data.conversationId === "string") {
    const parts = data.conversationId.split("_");
    if (parts.length === 2) {
      const currentUserId = await getAppUserId().catch(() => null);
      chatUserId = String(currentUserId) === parts[0] ? parts[1] : parts[0];
    }
  }

  const senderName =
    data.title ||
    data.senderName ||
    data.name ||
    data.authorName ||
    "Tuk Tuk Team";

  const senderAvatar =
    data.avatar ||
    data.imageUrl ||
    data.senderAvatar ||
    null;

  const type = (data.type || data.notificationType || "").toLowerCase();

  if (chatUserId || type === "chat" || type === "message") {
    if (chatUserId) {
      console.log("[notificationNavigation] Fallback navigating to chat with user:", chatUserId);
      return openUserChat(router, {
        userId: chatUserId,
        name: senderName,
        avatar: senderAvatar,
      });
    }
  }

  // 3. Voice party room invite fallback
  if (type === "party" || type === "voice_party" || data.roomId) {
    const roomId = data.roomId || data.channelId;
    if (roomId) {
      console.log("[notificationNavigation] Fallback navigating to voice party room:", roomId);
      router.push({
        pathname: "/voice-party",
        params: { roomId: String(roomId) },
      });
      return true;
    }
  }

  // 4. Fallback for custom pathname
  if (data.pathname) {
    try {
      console.log("[notificationNavigation] Fallback navigating to pathname:", data.pathname);
      router.push({
        pathname: data.pathname,
        params:
          data.params && typeof data.params === "string"
            ? JSON.parse(data.params)
            : (data.params ?? {}),
      });
      return true;
    } catch {
      // ignore
    }
  }

  console.log("[notificationNavigation] Default navigating to chat tab.");
  router.push("/(tabs)/chat");
  return true;
};
