import API, { authRequestConfig, getBearerToken, refreshTokenCache } from "./axios";

// NOTE: This endpoint path is a guess following this app's existing
// /api/app/users/me/* convention (see userSettingsApi.js) — confirm the
// real path/shape with backend before relying on it in production.

const buildAuthedConfig = async () => {
  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) {
    throw new Error("Please log in again to continue.");
  }
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

/** POST /api/app/users/me/device-token — register this device's FCM token for push delivery. */
export const registerDeviceToken = async (deviceToken, platform) => {
  const { token, headers } = await buildAuthedConfig();
  const body = { deviceToken, platform: String(platform ?? "android"), token };
  const response = await API.post("/api/app/users/me/device-token", body, { headers });
  return response.data;
};

/** DELETE /api/app/users/me/device-token — stop push delivery to this device (e.g. on logout). */
export const unregisterDeviceToken = async (deviceToken) => {
  const { headers } = await buildAuthedConfig();
  const response = await API.delete("/api/app/users/me/device-token", {
    ...(await authRequestConfig()),
    headers,
    data: { deviceToken },
  });
  return response.data;
};
