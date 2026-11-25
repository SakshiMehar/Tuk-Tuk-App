/**
 * App environment — values from `.env` (EXPO_PUBLIC_*).
 * Centralizes all external endpoints, API bases, and feature toggles.
 */

const trimTrailingSlash = (url) => (url ?? '').replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    'https://skydiver-trapdoor-sagging.ngrok-free.dev'
);

export const API_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 15000
);

export const toRemoteImageSource = (uri) => {
  if (!uri) return null;
  return { uri };
};

export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '';

export const ROOM_SHARE_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_ROOM_SHARE_URL ??
    process.env.EXPO_PUBLIC_APP_URL ??
    'https://tuktuk.live'
);

export const getRoomShareUrl = (roomId) => {
  if (!roomId) return '';
  return `${ROOM_SHARE_BASE_URL}/room/${encodeURIComponent(String(roomId))}`;
};

export const ENV = {
  APP_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: __DEV__,

  // Network URLs
  API_BASE_URL,
  WEBSOCKET_URL:
    process.env.WEBSOCKET_URL ||
    API_BASE_URL.replace(/^http/i, 'ws') +
      '/ws-tuktuk-native' +
      (API_BASE_URL.includes('ngrok') ? '?ngrok-skip-browser-warning=true' : ''),

  // RTC / Media (Agora)
  AGORA_APP_ID,

  // Deep linking
  ROOM_SHARE_BASE_URL,
  getRoomShareUrl,

  // Feature Toggles
  ENABLE_NETWORK_LOGS: __DEV__,
  ENABLE_WEBSOCKET_LOGS: __DEV__,
  ENABLE_STORE_LOGS: false,
  ENABLE_AGORA_LOGS: __DEV__,

  // Timeouts & Performance limits
  DEFAULT_API_TIMEOUT_MS: API_TIMEOUT_MS,
  WS_RECONNECT_INTERVAL_MS: 3000,
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  SEAT_HEARTBEAT_INTERVAL_MS: 10000,
};

export default ENV;
