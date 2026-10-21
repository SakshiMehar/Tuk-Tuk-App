import { API_BASE_URL } from "../config/env";
import { getDeviceHeaders } from "../utils/deviceHeaders";
import API, { authRequestConfig } from "./axios";
import { getDeviceHeaders } from "../utils/deviceHeaders";

const maskToken = (value) => {
  if (!value || typeof value !== "string") return value;
  if (value.length <= 20) return `${value.slice(0, 6)}…`;
  return `${value.slice(0, 12)}…${value.slice(-6)} (len=${value.length})`;
};

const logAuthRequest = (method, path, body) => {
  const safeBody = { ...body };
  if (safeBody.idToken) safeBody.idToken = maskToken(safeBody.idToken);
  if (safeBody.accessToken)
    safeBody.accessToken = maskToken(safeBody.accessToken);
};

const logAuthResponse = (endpoint, data) => { };

const logAuthError = (method, path, error) => {
  console.error(
    `[authApi] ${method} ${API_BASE_URL}${path} failed:`,
    JSON.stringify(
      {
        status: error?.status ?? error?.response?.status ?? null,
        message: error?.message,
        data: error?.responseData ?? error?.response?.data ?? null,
      },
      null,
      2,
    ),
  );
};

const postAuthWithFallback = async (paths, body, extraHeaders = {}) => {
  let lastError;
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  for (const path of paths) {
    try {
      logAuthRequest("POST", path, body);
      const response = await API.post(path, body, {
        headers: {
          ...deviceHeaders,
          ...extraHeaders,
        },
      });
      logAuthResponse(`POST ${path}`, response.data);
      if (path !== paths[0]) {
      }
      return response.data;
    } catch (error) {
      logAuthError("POST", path, error);
      lastError = error;
      const status = error?.status ?? error?.response?.status;
      if (status !== 404 || path === paths[paths.length - 1]) {
        throw error;
      }
    }
  }
  throw lastError;
};

export const guestLogin = async () => {
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post("/api/auth/guest", {}, {
    headers: deviceHeaders,
  });
  logAuthResponse("POST /api/auth/guest", response.data);
  return response.data;
};

export const firebasePhoneAuth = async (idToken, phoneNumber, name) => {
  const body = { idToken, phoneNumber, ...(name ? { name } : {}) };
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post("/api/auth/firebase-phone", body, {
    headers: deviceHeaders,
  });
  logAuthResponse("POST /api/auth/firebase-phone", response.data);
  return response.data;
};

export const googleLogin = async (idToken, name) => {
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post(
    "/api/auth/google-login",
    { idToken, name },
    { headers: deviceHeaders },
  );
  logAuthResponse("POST /api/auth/google-login", response.data);
  return response.data;
};

export const appleLogin = async (identityToken, name) => {
  const body = { identityToken, ...(name ? { name } : {}) };
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post("/api/auth/apple-login", body, {
    headers: deviceHeaders,
  });
  logAuthResponse("POST /api/auth/apple-login", response.data);
  return response.data;
};

export const firebaseFacebookAuth = async (idToken, phoneNumber, name) => {
  const body = {
    idToken,
    ...(phoneNumber ? { phoneNumber } : {}),
    ...(name ? { name } : {}),
  };
  return postAuthWithFallback(
    ["/api/auth/firebase-facebook", "/api/auth/facebook-login"],
    body,
  );
};

export const refreshToken = async (refreshTokenValue) => {
  const token =
    typeof refreshTokenValue === "string"
      ? refreshTokenValue
      : refreshTokenValue?.refreshToken;
  const body = { refreshToken: token };
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post("/api/auth/refresh-token", body, {
    _skipAuthRefresh: true,
    headers: deviceHeaders,
  });
  logAuthResponse("POST /api/auth/refresh-token", response.data);
  return response.data;
};

export const logout = async (payload = {}) => {
  const refreshTokenValue =
    typeof payload === "string" ? payload : payload?.refreshToken;
  const body = refreshTokenValue ? { refreshToken: refreshTokenValue } : {};
  return postAuthWithFallback(
    ["/api/app/users/logout", "/api/auth/logout"],
    body,
  );
};

export const deleteAccount = async ({ reason, additionalComment } = {}) => {
  const body = {
    reason: String(reason ?? "").trim(),
    additionalComment: String(additionalComment ?? "").trim(),
  };

  const response = await API.delete("/api/auth/account", {
    ...(await authRequestConfig()),
    data: body,
  });
  logAuthResponse("DELETE /api/auth/account", response.data);
  return response.data;
};
