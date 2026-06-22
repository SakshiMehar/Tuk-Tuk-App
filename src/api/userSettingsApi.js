import API, { authRequestConfig, getBearerToken, refreshTokenCache } from "./axios";

const requireAuthToken = async (label) => {
  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) {
    
    throw new Error("Please log in again to continue.");
  }
  
  return token;
};

const buildAuthedConfig = async (label) => {
  const token = await requireAuthToken(label);
  const authConfig = await authRequestConfig();
  
  return {
    token,
    headers: {
      ...authConfig.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const postWithAuth = async (url, body, label) => {
  const { token, headers } = await buildAuthedConfig(label);
  const payload = {
    ...body,
    token,
  };
  
  const response = await API.post(url, payload, { headers });
  
  return response.data;
};

export const getUserSettings = async () => {
  const { headers } = await buildAuthedConfig("get-settings");
  
  const response = await API.get("/api/app/users/me/settings", { headers });
  
  return response.data;
};

export const patchUserSettings = async (settings = {}) => {
  const { headers } = await buildAuthedConfig("patch-settings");
  
  const response = await API.patch(
    "/api/app/users/me/settings",
    settings,
    { headers }
  );
  
  return response.data;
};

/** GET /api/app/users/match-switch — read current match switch status. */
export const getMatchSwitch = async () => {
  const { headers } = await buildAuthedConfig("get-match-switch");
  
  const response = await API.get("/api/app/users/match-switch", { headers });
  
  return response.data;
};

/** PATCH /api/app/users/me/match-switch — toggle the match switch only. */
export const patchMatchSwitch = async (enabled) => {
  const { token, headers } = await buildAuthedConfig("patch-match-switch");
  const matchEnable = Boolean(enabled);
  const body = {
    matchSwitchEnabled: matchEnable,
    matchEnable,
    enabled: matchEnable,
    token,
  };
  
  const response = await API.patch(
    "/api/app/users/me/match-switch",
    body,
    { headers }
  );
  
  return response.data;
};

export const clearAppCache = async () => {
  return postWithAuth(
    "/api/app/users/me/settings/clear-cache",
    {},
    "clear-cache"
  );
};

export const clearChatCache = async (userIds = []) => {
  return postWithAuth(
    "/api/app/users/me/settings/clear-chat-cache",
    { userIds: userIds.map(String) },
    "clear-chat-cache"
  );
};

export const checkForUpdate = async ({ currentVersion, platform } = {}) => {
  await refreshTokenCache();
  const token = await getBearerToken();
  const query = {
    currentVersion: String(currentVersion ?? "1.0.0"),
    platform: String(platform ?? "android").toLowerCase(),
  };
  
  if (token) {
    
  }
  const response = await API.get("/api/app/check-update", {
    ...(await authRequestConfig()),
    params: query,
  });
  
  return response.data;
};

export const submitFeedback = async (message) => {
  return postWithAuth(
    "/api/app/help/feedback",
    { message: String(message).trim() },
    "help/feedback"
  );
};
