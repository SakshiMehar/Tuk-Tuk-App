import API, { authRequestConfig, getBearerToken, refreshTokenCache } from "./axios";

const requireAuthToken = async (label) => {
  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) {
    console.warn(`[userSettingsApi] ${label} skipped — no auth token in storage`);
    throw new Error("Please log in again to continue.");
  }
  console.log(
    `[userSettingsApi] ${label} auth ok — token length:`,
    token.length
  );
  return token;
};

const buildAuthedConfig = async (label) => {
  const token = await requireAuthToken(label);
  const authConfig = await authRequestConfig();
  console.log(
    `[userSettingsApi] ${label} Authorization: Bearer (${token.length} chars)`
  );
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
  console.log(
    `[userSettingsApi] POST ${url} body:`,
    JSON.stringify(payload, null, 2)
  );
  const response = await API.post(url, payload, { headers });
  console.log(
    `[userSettingsApi] POST ${url} response:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getUserSettings = async () => {
  const { headers } = await buildAuthedConfig("get-settings");
  console.log("[userSettingsApi] GET /api/app/users/me/settings");
  const response = await API.get("/api/app/users/me/settings", { headers });
  console.log(
    "[userSettingsApi] GET /api/app/users/me/settings response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const patchUserSettings = async (settings = {}) => {
  const { headers } = await buildAuthedConfig("patch-settings");
  console.log(
    "[userSettingsApi] PATCH /api/app/users/me/settings body:",
    JSON.stringify(settings, null, 2)
  );
  const response = await API.patch(
    "/api/app/users/me/settings",
    settings,
    { headers }
  );
  console.log(
    "[userSettingsApi] PATCH /api/app/users/me/settings response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

/** GET /api/app/users/match-switch — read current match switch status. */
export const getMatchSwitch = async () => {
  const { headers } = await buildAuthedConfig("get-match-switch");
  console.log("[userSettingsApi] GET /api/app/users/match-switch");
  const response = await API.get("/api/app/users/match-switch", { headers });
  console.log(
    "[userSettingsApi] GET /api/app/users/match-switch response:",
    JSON.stringify(response.data, null, 2)
  );
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
  console.log(
    "[userSettingsApi] PATCH /api/app/users/me/match-switch body:",
    JSON.stringify(body, null, 2)
  );
  const response = await API.patch(
    "/api/app/users/me/match-switch",
    body,
    { headers }
  );
  console.log(
    "[userSettingsApi] PATCH /api/app/users/me/match-switch response:",
    JSON.stringify(response.data, null, 2)
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
  console.log(
    "[userSettingsApi] GET /api/app/check-update params:",
    JSON.stringify(query, null, 2)
  );
  if (token) {
    console.log(
      "[userSettingsApi] GET /api/app/check-update Authorization: Bearer",
      `(${token.length} chars)`
    );
  }
  const response = await API.get("/api/app/check-update", {
    ...(await authRequestConfig()),
    params: query,
  });
  console.log(
    "[userSettingsApi] GET /api/app/check-update response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const submitFeedback = async (message) => {
  return postWithAuth(
    "/api/app/help/feedback",
    { message: String(message).trim() },
    "help/feedback"
  );
};
