/**
 * App environment — values from `.env` (EXPO_PUBLIC_*).
 * Restart Expo after changing .env: `npx expo start --clear`
 */

const trimTrailingSlash = (url) => (url ?? "").replace(/\/+$/, "");

/** Backend REST API origin (no trailing slash). */
export const API_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL ??
    "https://neatly-twisted-agile.ngrok-free.dev"
);

export const API_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 15000
);

/** ngrok free tier needs this header to skip the browser warning page. */
export const isNgrokBaseUrl = () =>
  /ngrok-free\.dev|ngrok\.io/i.test(API_BASE_URL);
