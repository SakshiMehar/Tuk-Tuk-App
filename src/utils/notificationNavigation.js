import { openUserChat } from "./chatNavigation";

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
 * Handles navigation based on FCM notification payload.
 * Supports various payload schemas (chatUserId, userId, type, roomId).
 */
export const navigateFromNotification = async (router, data) => {
  if (!router || !data) return false;

  const chatUserId =
    data.chatUserId ||
    data.userId ||
    data.senderId ||
    data.authorId;

  const senderName =
    data.senderName ||
    data.name ||
    data.authorName ||
    "User";

  const type = (data.type || data.notificationType || "").toLowerCase();

  // 1. Direct chat message
  if (chatUserId || type === "chat" || type === "message") {
    if (chatUserId) {
      return openUserChat(router, { userId: chatUserId, name: senderName });
    }
  }

  // 2. Voice party room invite
  if (type === "party" || type === "voice_party" || data.roomId) {
    const roomId = data.roomId || data.channelId;
    if (roomId) {
      router.push({
        pathname: "/voice-party",
        params: { roomId: String(roomId) },
      });
      return true;
    }
  }

  // 3. Fallback: if data provides a direct pathname
  if (data.pathname) {
    try {
      router.push({
        pathname: data.pathname,
        params: data.params ? JSON.parse(data.params) : {},
      });
      return true;
    } catch {
      // fallback
    }
  }

  return false;
};
