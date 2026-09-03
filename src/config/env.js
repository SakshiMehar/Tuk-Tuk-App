/**
 * App environment — values from `.env` (EXPO_PUBLIC_*).
 * Restart Expo after changing .env: `npx expo start --clear`
 */

const trimTrailingSlash = (url) => (url ?? "").replace(/\/+$/, "");

/** Backend REST API origin (no trailing slash). */
export const API_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.tuktuk.live"
);

export const API_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 15000
);

/** Wraps a remote image URI in a source object. */
export const toRemoteImageSource = (uri) => {
  if (!uri) return null;
  return { uri };
};

/** Agora App ID — fallback if voice-token API does not return appId. */
export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? "";
