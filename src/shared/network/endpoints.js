/**
 * Centralized API endpoints
 */

export const ENDPOINTS = {
  // Auth
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    DEVICE_CHECK: '/auth/device-check',
  },

  // Home / Discovery
  HOME: {
    FEED: '/home/feed',
    RECOMMENDED: '/home/recommended-users',
    LIVE_USERS: '/home/live-users',
    NEARBY: '/discovery/nearby',
    EXPLORE: '/discovery/explore',
    SEARCH: '/discovery/search',
  },

  // Party / Voice Rooms
  PARTY: {
    ROOM_LIST: '/rooms/explore',
    ROOM_CATEGORIES: '/rooms/categories',
    ROOM_DETAILS: (id) => `/rooms/${id}`,
    CREATE_ROOM: '/rooms',
    LEAVE_ROOM: (id) => `/rooms/${id}/leave`,
    JOIN_ROOM: (id) => `/rooms/${id}/join`,
    SEATS: (roomId) => `/rooms/${roomId}/seats`,
    TAKE_SEAT: (roomId, seatIndex) => `/rooms/${roomId}/seats/${seatIndex}/take`,
    LEAVE_SEAT: (roomId, seatIndex) => `/rooms/${roomId}/seats/${seatIndex}/leave`,
    MUTE_SEAT: (roomId, seatIndex) => `/rooms/${roomId}/seats/${seatIndex}/mute`,
    SEAT_HEARTBEAT: (roomId) => `/rooms/${roomId}/seats/heartbeat`,
    FOLLOW_ROOM: (roomId) => `/rooms/${roomId}/follow`,
  },

  // Chat
  CHAT: {
    CONVERSATIONS: '/chats',
    MESSAGES: (chatId) => `/chats/${chatId}/messages`,
    SEND_MESSAGE: (chatId) => `/chats/${chatId}/messages`,
    READ_MESSAGES: (chatId) => `/chats/${chatId}/read`,
  },

  // Calling
  CALL: {
    INITIATE: '/call/initiate',
    ACCEPT: (callId) => `/call/${callId}/accept`,
    REJECT: (callId) => `/call/${callId}/reject`,
    END: (callId) => `/call/${callId}/end`,
  },

  // Wallet
  WALLET: {
    BALANCE: '/wallet/balance',
    RECHARGE_PACKAGES: '/wallet/packages',
    CREATE_ORDER: '/wallet/order',
    TRANSACTIONS: '/wallet/transactions',
  },

  // Gifts
  GIFTS: {
    CATALOG: '/gifts/catalog',
    CATEGORIES: '/gifts/categories',
    SEND_ROOM_GIFT: '/gifts/send/room',
    SEND_USER_GIFT: '/gifts/send/user',
  },

  // Profile
  PROFILE: {
    ME: '/users/me',
    USER_DETAILS: (userId) => `/users/${userId}`,
    UPDATE: '/users/me',
    FOLLOW: (userId) => `/users/${userId}/follow`,
    UNFOLLOW: (userId) => `/users/${userId}/unfollow`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    REGISTER_DEVICE: '/notifications/register-device',
  },
};

export default ENDPOINTS;
