/**
 * App environment — values from `.env` (EXPO_PUBLIC_*).
 * Restart Expo after changing .env: `npx expo start --clear`
 */

const trimTrailingSlash = (url) => (url ?? "").replace(/\/+$/, "");

/** Backend REST API origin (no trailing slash). */
export const API_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.tuktuk.live",
  // process.env.EXPO_PUBLIC_API_BASE_URL ??
  // "https://trench-launch-bleach.ngrok-free.dev",
);

export const API_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 15000,
);

/** Wraps a remote image URI in a source object. */
export const toRemoteImageSource = (uri) => {
  if (!uri) return null;
  return { uri };
};

/** Agora App ID — fallback if voice-token API does not return appId. */
export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? "";

/** Base URL for user-facing shareable deep links (separate from API_BASE_URL). */
export const ROOM_SHARE_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_ROOM_SHARE_URL ??
  process.env.EXPO_PUBLIC_APP_URL ??
  "https://tuktuk.live",
);

/** Generates a shareable deep-link using the custom tuktuk:// scheme.
 *  This opens the Tuk-Tuk app directly when tapped in WhatsApp, SMS, etc.
 *  because tuktuk:// is registered in AndroidManifest.xml.
 *  Note: https:// links require the web server to serve a page at /room/:id.
 *  Since tuktuk.live has no such web page, we use tuktuk:// to avoid the 404.
 */
export const getRoomShareUrl = (roomId) => {
  if (!roomId) return "";
  return `tuktuk://room/${encodeURIComponent(String(roomId))}`;
};
