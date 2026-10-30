/**
 * Real-Time WebSocket & STOMP Protocol Constants
 */

export const WS_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR',
};

export const WS_COMMANDS = {
  CONNECT: 'CONNECT',
  CONNECTED: 'CONNECTED',
  SUBSCRIBE: 'SUBSCRIBE',
  UNSUBSCRIBE: 'UNSUBSCRIBE',
  SEND: 'SEND',
  DISCONNECT: 'DISCONNECT',
  MESSAGE: 'MESSAGE',
  PING: 'PING',
  PONG: 'PONG',
};

export const TOPIC_PATTERNS = {
  ROOM: (roomId) => `/topic/room/${roomId}`,
  ROOM_SEATS: (roomId) => `/topic/room/${roomId}/seats`,
  ROOM_CHAT: (roomId) => `/topic/room/${roomId}/chat`,
  ROOM_GIFTS: (roomId) => `/topic/room/${roomId}/gifts`,
  USER_CHAT: (userId) => `/user/${userId}/queue/chat`,
  USER_NOTIFICATIONS: (userId) => `/user/${userId}/queue/notifications`,
};
