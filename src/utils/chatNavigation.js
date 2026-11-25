import { ROUTES } from '../navigation/navigationConstants';

/**
 * Opens 1-on-1 chat box with target user
 */
export const openUserChat = (router, user = {}) => {
  const userId = user?.userId ?? user?.id;
  if (!router || !userId) return false;
  try {
    if (typeof router.push === 'function') {
      router.push({
        pathname: '/chat-box',
        params: {
          chatId: String(userId),
          userId: String(userId),
          name: user.name || 'Chat',
          avatar: user.avatar || null,
        },
      });
      return true;
    }
  } catch (err) {
    console.warn('[openUserChat] Navigation failed:', err);
  }
  return false;
};

export default { openUserChat };
