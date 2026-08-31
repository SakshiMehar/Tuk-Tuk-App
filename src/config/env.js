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

/** ngrok free tier needs this header to skip the browser warning page. */
export const isNgrokBaseUrl = () =>
  /ngrok-free\.dev|ngrok\.io/i.test(API_BASE_URL);

/**
 * Wraps a remote image URI in a source object, adding the ngrok header
 * when the URL passes through ngrok. Use this for every <Image> that
 * loads a URL from the backend — otherwise ngrok returns its HTML
 * warning page instead of the actual image.
 *
 * Works with both expo-image and React Native's native Image component.
 */
export const toRemoteImageSource = (uri) => {
  if (!uri) return null;
  const isNgrok = /ngrok-free\.dev|ngrok\.io/i.test(uri);
  return isNgrok
    ? { uri, headers: { "ngrok-skip-browser-warning": "true" } }
    : { uri };
};

/** Agora App ID — fallback if voice-token API does not return appId. */
export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? "";
