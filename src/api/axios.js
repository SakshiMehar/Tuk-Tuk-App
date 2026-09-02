import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL, API_TIMEOUT_MS, isNgrokBaseUrl } from "../config/env";

const API = axios.create({

  baseURL: API_BASE_URL,

  headers: {

    "Content-Type": "application/json",

    ...(isNgrokBaseUrl() ? { "ngrok-skip-browser-warning": "true" } : {}),

  },

  timeout: API_TIMEOUT_MS,

});

// All mutable module state in one const object.
// A single const avoids the TypeScript false-positive 6133
// ("declared but never read") that fires for module-level `let`
// variables whose only reads are inside interceptor callbacks.
const _s = {
  token: null,
  handlingUnauth: false,
  onSessionExpired: null,
};

AsyncStorage.getItem("@auth_token")
  .then((t) => { _s.token = t; })
  .catch(() => {});

const isTokenExpired = (token) => {
  if (!token || typeof token !== "string") return true;
  const parts = token.split(".");
  if (parts.length < 2) return false;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    let jsonStr = "";
    if (typeof globalThis.atob === "function") {
      jsonStr = globalThis.atob(padded);
    } else {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let str = padded.replace(/=+$/, "");
      for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ) {
        const idx = chars.indexOf(buffer);
        if (idx === -1) continue;
        bs = bc % 4 ? bs * 64 + idx : idx;
        if (bc++ % 4) jsonStr += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
    const payload = JSON.parse(jsonStr);
    if (payload?.exp && typeof payload.exp === "number") {
      // 5-second buffer for potential clock drift
      return Date.now() >= payload.exp * 1000 - 5000;
    }
    return false;
  } catch {
    return false;
  }
};

export const refreshTokenCache = async () => {
  _s.token = await AsyncStorage.getItem("@auth_token");
  // Reset the 401 guard so future expiry is caught after re-login.
  if (_s.token) _s.handlingUnauth = false;
};

export const getBearerToken = async () => {
  await refreshTokenCache();
  if (!_s.token) {
    _s.token = await AsyncStorage.getItem("@auth_token");
  }
  if (_s.token && isTokenExpired(_s.token)) {
    _s.token = null;
    AsyncStorage.multiRemove(["@auth_token", "@auth_user"]).catch(() => {});
    if (!_s.handlingUnauth) {
      _s.handlingUnauth = true;
      _s.onSessionExpired?.();
    }
    return null;
  }
  return _s.token;
};

/** Merge Authorization into axios/fetch config (RN-safe). */
export const authRequestConfig = async (config = {}) => {
  const token = await getBearerToken();
  const headers = { ...(config.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { ...config, headers };
};

export const clearTokenCache = () => { _s.token = null; };

/**
 * Register a handler that is called once when a 401 is detected on a
 * non-auth endpoint (expired / missing token).
 * Call this in the root layout so the router is always available:
 *   setSessionExpiredHandler(() => router.replace('/login'));
 */
export const setSessionExpiredHandler = (fn) => {
  _s.onSessionExpired = fn;
};

API.interceptors.request.use(

  async (config) => {

    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isFormData) {
      config.headers.delete?.("Content-Type");
      config.headers.delete?.("content-type");
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }

    const token = await getBearerToken();
    _s.token = token;

    if (token) {
      const auth = `Bearer ${token}`;
      if (!config.headers) config.headers = {};
      if (typeof config.headers.set === "function") {
        try { config.headers.set("Authorization", auth); } catch (_) {}
      }
      config.headers.Authorization = auth;
    }

    return config;

  },

  (error) => Promise.reject(error)

);

API.interceptors.response.use(

  (response) => response,

  (error) => {

    const status = error?.response?.status;
    const requestUrl = `${error?.config?.baseURL ?? ""}${error?.config?.url ?? ""}`;

    const isAuthEndpoint = /\/api\/auth\//i.test(requestUrl);
    const isExplicitTokenError =
      status === 401 &&
      (error?.response?.data?.error === "Invalid or expired token" ||
       error?.response?.data?.message === "Invalid or expired token" ||
       error?.response?.data?.error === "Authentication token is required" ||
       error?.response?.data?.message === "Authentication token is required");
    const isCoreProfileEndpoint = /\/api\/app\/users\/me\/profile/i.test(requestUrl);

    // Suppress noisy but expected 409 seat-occupied conflicts — the calling
    // code handles them via retry logic, no need to log them as errors.
    const isSeatOccupied =
      status === 409 &&
      /\/seat\/\d+\/claim/i.test(requestUrl);

    // Suppress 404s on invite-friends endpoints — backend hasn't shipped
    // this feature yet (client is wired ahead of the API); calling code
    // already degrades to an empty/"not live yet" state.
    const isPendingInviteFriendsApi =
      status === 404 &&
      /\/api\/app\/invite-friends\//i.test(requestUrl);

    const shouldSuppressLog =
      isSeatOccupied ||
      isPendingInviteFriendsApi ||
      (status === 401 && _s.handlingUnauth);

    if (!shouldSuppressLog) {
      console.error(
        "[axios] request failed:",
        status,
        requestUrl,
        error?.response?.data,
        "code:", error?.code,
        "message:", error?.message,
        "timedOut:", error?.request?._timedOut
      );
    }

    // ── 401: token expired / missing ────────────────────────────
    // If the server explicitly returns "Invalid or expired token" or "Authentication token is required",
    // or if the core profile endpoint fails with 401, trigger session expiry immediately.
    if (status === 401 && !isAuthEndpoint && (isExplicitTokenError || isCoreProfileEndpoint) && !_s.handlingUnauth) {
      _s.handlingUnauth = true;
      _s.token = null;
      // Wipe stored session so the app starts clean on next launch.
      AsyncStorage.multiRemove(["@auth_token", "@auth_user"]).catch(() => {});
      // Invoke the handler registered by the root layout.
      _s.onSessionExpired?.();
    }

    const responseData = error?.response?.data;
    const responseText =
      typeof responseData === "string" ? responseData : JSON.stringify(responseData ?? "");

    let message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Something went wrong";

    if (
      /ERR_NGROK_3200|endpoint.*is offline|ngrok-free\.dev is offline/i.test(responseText)
    ) {
      message =
        "Backend is offline. Start your server and ngrok tunnel, then update EXPO_PUBLIC_API_BASE_URL in .env if the ngrok URL changed.";
    }

    const err = new Error(message);
    err.status = status;
    err.responseData = error?.response?.data;
    err.requestUrl = requestUrl;

    return Promise.reject(err);

  }

);

export default API;
