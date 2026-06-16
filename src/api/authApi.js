import API, { authRequestConfig } from "./axios";
import { API_BASE_URL } from "../config/env";

const maskToken = (value) => {
  if (!value || typeof value !== "string") return value;
  if (value.length <= 20) return `${value.slice(0, 6)}…`;
  return `${value.slice(0, 12)}…${value.slice(-6)} (len=${value.length})`;
};

const logAuthRequest = (method, path, body) => {
  const safeBody = { ...body };
  if (safeBody.idToken) safeBody.idToken = maskToken(safeBody.idToken);
  if (safeBody.accessToken) safeBody.accessToken = maskToken(safeBody.accessToken);
  console.log(
    `[authApi] ${method} ${API_BASE_URL}${path}`,
    JSON.stringify(safeBody, null, 2)
  );
};

const logAuthResponse = (endpoint, data) => {
  console.log(`[authApi] ${endpoint} response:`, JSON.stringify(data, null, 2));
};

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
      2
    )
  );
};

const postAuthWithFallback = async (paths, body) => {
  let lastError;
  for (const path of paths) {
    try {
      logAuthRequest("POST", path, body);
      const response = await API.post(path, body);
      logAuthResponse(`POST ${path}`, response.data);
      if (path !== paths[0]) {
        console.warn(`[authApi] Facebook login used fallback endpoint: ${path}`);
      }
      return response.data;
    } catch (error) {
      logAuthError("POST", path, error);
      lastError = error;
      const status = error?.status ?? error?.response?.status;
      if (status !== 404 || path === paths[paths.length - 1]) {
        throw error;
      }
      console.warn(`[authApi] POST ${path} returned 404, trying next endpoint…`);
    }
  }
  throw lastError;
};

export const guestLogin = async () => {
  const response = await API.post("/api/auth/guest");
  logAuthResponse("POST /api/auth/guest", response.data);
  return response.data;
};

export const firebasePhoneAuth = async (idToken, phoneNumber, name) => {
  const body = { idToken, phoneNumber, ...(name ? { name } : {}) };
  const response = await API.post("/api/auth/firebase-phone", body);
  logAuthResponse("POST /api/auth/firebase-phone", response.data);
  return response.data;
};

export const emailLogin = async (email, password) => {
  const response = await API.post("/api/auth/login", { email, password });
  logAuthResponse("POST /api/auth/login", response.data);
  return response.data;
};

export const googleLogin = async (idToken, name) => {
  const response = await API.post("/api/auth/google-login", { idToken, name });
  logAuthResponse("POST /api/auth/google-login", response.data);
  return response.data;
};

export const facebookLogin = async (accessToken) => {
  const response = await API.post("/api/auth/facebook-login", { accessToken });
  logAuthResponse("POST /api/auth/facebook-login", response.data);
  return response.data;
};

export const facebookFirebaseLogin = async (idToken, name) => {
  const body = { idToken, ...(name ? { name } : {}) };
  const response = await API.post("/api/auth/facebook-login", body);
  logAuthResponse("POST /api/auth/facebook-login (firebase)", response.data);
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
    body
  );
};

export const appleLogin = async (identityToken) => {
  const response = await API.post("/api/auth/apple-login", { identityToken });
  logAuthResponse("POST /api/auth/apple-login", response.data);
  return response.data;
};

export const logout = async () => {
  console.log("[authApi] POST /api/auth/logout");
  const response = await API.post(
    "/api/auth/logout",
    {},
    await authRequestConfig()
  );
  logAuthResponse("POST /api/auth/logout", response.data);
  return response.data;
};

export const deleteAccount = async ({ reason, additionalComment } = {}) => {
  const body = {
    reason: String(reason ?? "").trim(),
    additionalComment: String(additionalComment ?? "").trim(),
  };
  console.log(
    "[authApi] DELETE /api/auth/account body:",
    JSON.stringify(body, null, 2)
  );
  const response = await API.delete("/api/auth/account", {
    ...(await authRequestConfig()),
    data: body,
  });
  logAuthResponse("DELETE /api/auth/account", response.data);
  return response.data;
};
