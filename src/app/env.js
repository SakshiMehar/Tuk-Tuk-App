/**
 * Environment configuration for Tuk-Tuk
 * Centralizes all external endpoints, API bases, and feature toggles.
 * Never hardcode API or WebSocket URLs inside components.
 */

export const ENV = {
  APP_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: __DEV__,

  // Network URLs
  API_BASE_URL: 'https://api.tuktukapp.com/api/v1',
  WEBSOCKET_URL: 'wss://ws.tuktukapp.com/ws-stomp',

  // RTC / Media (Agora)
  AGORA_APP_ID: 'YOUR_AGORA_APP_ID_DEV',

  // Feature Toggles
  ENABLE_NETWORK_LOGS: __DEV__,
  ENABLE_WEBSOCKET_LOGS: __DEV__,
  ENABLE_STORE_LOGS: false,
  ENABLE_AGORA_LOGS: __DEV__,

  // Timeouts & Performance limits
  DEFAULT_API_TIMEOUT_MS: 15000,
  WS_RECONNECT_INTERVAL_MS: 3000,
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  SEAT_HEARTBEAT_INTERVAL_MS: 10000,
};

export default ENV;
