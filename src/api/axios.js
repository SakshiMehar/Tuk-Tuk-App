

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { DeviceEventEmitter } from "react-native";
import { API_BASE_URL, API_TIMEOUT_MS } from "../config/env";
import { getDeviceHeaders } from "../utils/deviceHeaders";

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
  .catch(() => { });

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

const decodeBase64 = (input) => {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(input);
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let str = input.replace(/=+$/, "");
  let output = "";
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ) {
    const idx = chars.indexOf(buffer);
    if (idx === -1) continue;
    bs = bc % 4 ? bs * 64 + idx : idx;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
};

export const isJwtExpired = (token, thresholdSeconds = 60) => {
  if (!token || typeof token !== "string") return true;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = decodeBase64(padded);
    const payload = JSON.parse(decoded);
    if (!payload?.exp) return false;
    return Math.floor(Date.now() / 1000) >= payload.exp - thresholdSeconds;
  } catch {
    return false;
  }
};

export const refreshAuthToken = async () => {
  if (_s.refreshPromise) {
    return _s.refreshPromise;
  }
  _s.refreshPromise = (async () => {
    try {
      let rToken = _s.refreshToken;
      if (!rToken) {
        rToken = await AsyncStorage.getItem("@refresh_token");
      }
      if (!rToken) {
        throw new Error("No refresh token available");
      }

      const deviceHeaders = await getDeviceHeaders().catch(() => ({}));

      const res = await axios.post(
        `${API_BASE_URL}/api/auth/refresh-token`,
        { refreshToken: rToken },
        {
          headers: {
            "Content-Type": "application/json",
            ...deviceHeaders,
          },
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
      return String(newAccessToken);
    } catch (refreshErr) {
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
  return _s.refreshPromise;
};

export const getValidAuthToken = async () => {
  if (!_s.token) {
    await refreshTokenCache();
  }
  let token = _s.token;
  if (!token) return null;

  if (isJwtExpired(token, 60)) {
    console.log("[axios] Stored access token is expired, refreshing via refresh-token...");
    try {
      token = await refreshAuthToken();
    } catch (err) {
      console.warn("[axios] Proactive token refresh failed:", err?.message || err);
      return null;
    }
  }
  return token;
};

export const getBearerToken = async () => {
  return getValidAuthToken();
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

    try {
      const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
      if (!config.headers) config.headers = {};
      Object.entries(deviceHeaders).forEach(([k, v]) => {
        if (!config.headers[k]) {
          if (typeof config.headers.set === "function") {
            try { config.headers.set(k, v); } catch (_) {}
          }
          config.headers[k] = v;
        }
      });
    } catch (_) {}

    const token = await getBearerToken();
    _s.token = token;

    if (token) {
      const auth = `Bearer ${token}`;
      if (!config.headers) config.headers = {};
      if (typeof config.headers.set === "function") {
        try { config.headers.set("Authorization", auth); } catch (_) { }
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

    // Suppress 404 "no active PK battle" — this is the normal, expected
    // response for a room with no ongoing battle; calling code already
    // treats it as null, not an error.
    const isNoActivePkBattle =
      status === 404 &&
      /\/api\/app\/pk-battles\/room\/[^/]+\/active/i.test(requestUrl);

    const shouldSuppressLog =
      isSeatOccupied ||
      isPendingInviteFriendsApi ||
      isNoActivePkBattle ||
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

    // ── Handle USER_BANNED response (WebSocket disconnected fallback) ───
    const responseData = error?.response?.data;
    const isUserBanned =
      responseData?.message === "USER_BANNED" ||
      responseData?.error === "USER_BANNED" ||
      responseData?.type === "USER_BANNED" ||
      responseData?.code === "USER_BANNED" ||
      /USER_BANNED/i.test(String(responseData?.message || responseData?.error || ""));

    if (isUserBanned) {
      console.warn("[axios] User banned response detected:", responseData);
      _s.token = null;
      _s.refreshToken = null;
      _s.refreshPromise = null;

      await AsyncStorage.multiRemove([
        "@auth_token",
        "@refresh_token",
        "@auth_user",
        "@terms_accepted",
        "accessToken",
        "refreshToken",
      ]).catch(() => { });
      clearTokenCache();

      try {
        const { endLocalSession } = require("../services/authSessionService");
        await endLocalSession().catch(() => { });
      } catch { }

      const banReason =
        responseData?.reason ||
        responseData?.error ||
        responseData?.message ||
        "Violation of community guidelines";
      const banMessage =
        responseData?.message ||
        "Your account has been banned due to a violation of our community guidelines.";

      // Display popup modal instantly on screen
      DeviceEventEmitter.emit("userBanned", {
        type: "USER_BANNED",
        message: banMessage,
        reason: banReason,
        userId: responseData?.userId,
        button: responseData?.button || responseData?.buttonText || "Close",
      });

      const banErr = new Error(banReason);
      banErr.status = status;
      banErr.isUserBanned = true;
      banErr.responseData = responseData;
      return Promise.reject(banErr);
    }

    // ── Handle HTTP 403 / DEVICE_BLOCKED response ────────────────
    const isDeviceBlocked =
      status === 403 ||
      responseData?.code === "DEVICE_BLOCKED" ||
      responseData?.error === "DEVICE_BLOCKED" ||
      /device.*(block|ban|restrict|denied)/i.test(
        String(responseData?.message || responseData?.error || "")
      );

    if (isDeviceBlocked) {
      console.warn("[axios] Device blocked / 403 response detected:", responseData);
      const blockedReason =
        responseData?.reason ||
        responseData?.error ||
        responseData?.message ||
        "Device blocked due to suspicious activity";
      const blockedMessage =
        responseData?.message ||
        "Your device has been blocked by the administrator.";

      // Display non-cancelable blocking modal on the current screen without navigating away
      DeviceEventEmitter.emit("deviceBlockedModal", {
        type: "DEVICE_BLOCKED",
        deviceId: responseData?.deviceId,
        message: blockedMessage,
        reason: blockedReason,
        button: responseData?.button || responseData?.buttonText || "Close",
      });

      const blockedErr = new Error(blockedReason);
      blockedErr.status = status || 403;
      blockedErr.isDeviceBlocked = true;
      blockedErr.responseData = responseData;
      blockedErr.requestUrl = requestUrl;
      return Promise.reject(blockedErr);
    }

    // ── 401: Automatic Token Refresh ────────────────────────────
    if (status === 401 && !skipRefresh && originalRequest) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAuthToken();
        const authHeader = `Bearer ${newAccessToken}`;
        if (!originalRequest.headers) originalRequest.headers = {};
        if (typeof originalRequest.headers.set === "function") {
          try { originalRequest.headers.set("Authorization", authHeader); } catch (_) { }
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
        ]).catch(() => { });
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
