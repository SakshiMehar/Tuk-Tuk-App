import { isNgrokBaseUrl } from "../config/env";

/** ngrok free tier needs this header for media + API requests. */
export const ngrokMediaHeaders = () =>
  isNgrokBaseUrl() ? { "ngrok-skip-browser-warning": "true" } : undefined;

/** Build an expo-video source from a remote URL or local asset id. */
export const resolveVideoSource = (uri) => {
  if (uri == null || uri === "") return null;
  if (typeof uri === "number") return uri;

  const url = String(uri);
  const headers = ngrokMediaHeaders();
  if (headers && /ngrok-free\.dev|ngrok\.io/i.test(url)) {
    return { uri: url, headers };
  }

  return url;
};

/** Image source with ngrok headers when needed. */
export const resolveImageSource = (uri) => {
  if (!uri) return null;
  const headers = ngrokMediaHeaders();
  return headers ? { uri: String(uri), headers } : { uri: String(uri) };
};
