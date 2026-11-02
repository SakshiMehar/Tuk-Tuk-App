/**
 * Notification Navigation Utilities
 */

let pendingNotificationPayload: any = null;

export const setPendingNotification = (payload: any) => {
  pendingNotificationPayload = payload;
};

export const consumePendingNotification = (): any => {
  const payload = pendingNotificationPayload;
  pendingNotificationPayload = null;
  return payload;
};

export const navigateFromNotification = (router: any, payload: any) => {
  if (!router || !payload) return;

  const data = payload?.data || payload;
  const roomId = data?.roomId || data?.channelId;

  if (roomId) {
    router.push({
      pathname: '/voice-party',
      params: { roomId: String(roomId) },
    });
    return;
  }

  const chatUserId = data?.chatUserId || data?.senderId;
  if (chatUserId) {
    router.push({
      pathname: '/chat-box',
      params: { chatId: String(chatUserId) },
    });
    return;
  }

  router.push('/(tabs)/home');
};

export default {
  setPendingNotification,
  consumePendingNotification,
  navigateFromNotification,
};
