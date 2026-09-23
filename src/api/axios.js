import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL, API_TIMEOUT_MS } from "../config/env";

const API = axios.create({

  baseURL: API_BASE_URL,

  headers: {

    "Content-Type": "application/json",

  },

  timeout: API_TIMEOUT_MS,

});

// All mutable module state in one const object.
// A single const avoids the TypeScript false-positive 6133
// ("declared but never read") that fires for module-level `let`
// variables whose only reads are inside interceptor callbacks.
const _s = {
  token: null,
  refreshToken: null,
  refreshPromise: null,
  handlingUnauth: false,
  onSessionExpired: null,
};

AsyncStorage.multiGet(["@auth_token", "@refresh_token"])
  .then((entries) => {
    const map = Object.fromEntries(entries || []);
    _s.token = map["@auth_token"] || null;
    _s.refreshToken = map["@refresh_token"] || null;
  })
  .catch(() => {});

export const refreshTokenCache = async () => {
  try {
    const entries = await AsyncStorage.multiGet(["@auth_token", "@refresh_token"]);
    const map = Object.fromEntries(entries || []);
    _s.token = map["@auth_token"] || null;
    _s.refreshToken = map["@refresh_token"] || null;
    if (_s.token) _s.handlingUnauth = false;
  } catch {
    // ignore
  }
};

export const getBearerToken = async () => {
  if (!_s.token) {
    await refreshTokenCache();
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

export const clearTokenCache = () => {
  _s.token = null;
  _s.refreshToken = null;
  _s.refreshPromise = null;
};

/**
 * Register a handler that is called once when a session expiry is detected on a
 * non-auth endpoint (expired / invalid refreshToken).
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

    // TEMP DEBUG — remove before committing.
    console.log("[axios] LOGIN TOKEN:", token);

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

  async (error) => {

    const status = error?.response?.status;
    const originalRequest = error?.config;
    const requestUrl = `${originalRequest?.baseURL ?? ""}${originalRequest?.url ?? ""}`;

    const isAuthEndpoint =
      /\/api\/auth\/(?!user|me)/i.test(requestUrl) ||
      /\/api\/app\/users\/logout/i.test(requestUrl);
    const isRefreshEndpoint = /\/api\/auth\/refresh-token/i.test(requestUrl);
    const skipRefresh =
      Boolean(originalRequest?._skipAuthRefresh) ||
      Boolean(originalRequest?._retry) ||
      isAuthEndpoint ||
      isRefreshEndpoint;

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

    // ── 401: Automatic Token Refresh ────────────────────────────
    if (status === 401 && !skipRefresh && originalRequest) {
      originalRequest._retry = true;

      if (!_s.refreshPromise) {
        _s.refreshPromise = (async () => {
          try {
            let rToken = _s.refreshToken;
            if (!rToken) {
              rToken = await AsyncStorage.getItem("@refresh_token");
            }
            if (!rToken) {
              throw new Error("No refresh token available");
            }
            console.log("[axios] refresh started");

            const res = await axios.post(
              `${API_BASE_URL}/api/auth/refresh-token`,
              { refreshToken: rToken },
              {
                headers: { "Content-Type": "application/json" },
                timeout: API_TIMEOUT_MS,
              }
            );

            const data = res?.data || {};
            const newAccessToken = data.accessToken || data.token;
            const newRefreshToken = data.refreshToken;

            if (!newAccessToken) {
              throw new Error("Token refresh response missing accessToken");
            }

            const pairs = [["@auth_token", String(newAccessToken)]];
            if (newRefreshToken) {
              pairs.push(["@refresh_token", String(newRefreshToken)]);
            }
            await AsyncStorage.multiSet(pairs);

            _s.token = String(newAccessToken);
            if (newRefreshToken) {
              _s.refreshToken = String(newRefreshToken);
            }
            _s.handlingUnauth = false;
            console.log("[axios] refresh succeeded");
            return String(newAccessToken);
          } catch (refreshErr) {
            console.log("[axios] refresh failed");
            _s.token = null;
            _s.refreshToken = null;
            await AsyncStorage.multiRemove([
              "@auth_token",
              "@refresh_token",
              "@auth_user",
              "@terms_accepted",
            ]).catch(() => {});
            if (!_s.handlingUnauth) {
              _s.handlingUnauth = true;
              _s.onSessionExpired?.();
            }
            throw refreshErr;
          } finally {
            _s.refreshPromise = null;
          }
        })();
      }

      try {
        const newAccessToken = await _s.refreshPromise;
        const authHeader = `Bearer ${newAccessToken}`;
        if (!originalRequest.headers) originalRequest.headers = {};
        if (typeof originalRequest.headers.set === "function") {
          try { originalRequest.headers.set("Authorization", authHeader); } catch (_) {}
        }
        originalRequest.headers.Authorization = authHeader;
        return API(originalRequest);
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }

    // ── 401 on refresh endpoint or when refresh was skipped ───
    if (status === 401 && (isRefreshEndpoint || (skipRefresh && !isAuthEndpoint))) {
      if (!_s.handlingUnauth) {
        _s.handlingUnauth = true;
        _s.token = null;
        _s.refreshToken = null;
        AsyncStorage.multiRemove([
          "@auth_token",
          "@refresh_token",
          "@auth_user",
          "@terms_accepted",
        ]).catch(() => {});
        _s.onSessionExpired?.();
      }
    }

    let message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Something went wrong";

    if (/unable to connect to redis/i.test(String(message))) {
      message = "Voice party is temporarily unavailable. Please try again in a moment.";
    }

    const err = new Error(message);
    err.status = status;
    err.responseData = error?.response?.data;
    err.requestUrl = requestUrl;

    return Promise.reject(err);

  }

);

export default API;

