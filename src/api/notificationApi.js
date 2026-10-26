import { Platform } from "react-native";
import API, {
  authRequestConfig,
  getBearerToken,
  refreshTokenCache,
} from "./axios";
import { getAppUserId } from "../utils/sessionUser";

const buildAuthConfig = async () => {
  await refreshTokenCache();

  const token = await getBearerToken();

  if (!token) {
    throw new Error("Please log in again to continue.");
  }

  const config = await authRequestConfig();

  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// GET - Notifications list

export const getNotifications = async ({
  page = 0,
  size = 20,
} = {}) => {
  const config = await buildAuthConfig();

  const response = await API.get("/api/notifications", {
    ...config,
    params: {
      page,
      size,
    },
  });

  return response.data;
};


// GET - Unread notification count

export const getUnreadNotificationCount = async () => {
  const config = await buildAuthConfig();

  const response = await API.get("/api/notifications/unread-count", config);
  return response.data;
};

// POST - Mark notifications as read.
// Pass "all" (string) to mark every notification, or an array of IDs
// to mark specific ones.  The backend never receives `all:true` or userId.
//   markNotificationsRead("all")      → { "notificationIds": "all" }
//   markNotificationsRead([12, 25])   → { "notificationIds": [12, 25] }

export const markNotificationsRead = async (notificationIds) => {
  const config = await buildAuthConfig();

  const body = {
    notificationIds:
      notificationIds === "all" ? "all" : Array.isArray(notificationIds) ? notificationIds : [],
  };

  const response = await API.post(
    "/api/notifications/mark-read",
    body,
    config
  );

  return response.data;
};

// POST - Register FCM device token

export const registerDeviceToken = async (
  deviceToken,
  platform = Platform.OS,
  userId = null
) => {
  if (!deviceToken || typeof deviceToken !== "string") {
    throw new Error("FCM device token is required.");
  }

  const config = await buildAuthConfig();

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    resolvedUserId = await getAppUserId().catch(() => null);
  }

  const numericUserId =
    resolvedUserId && !isNaN(Number(resolvedUserId))
      ? Number(resolvedUserId)
      : resolvedUserId;

  const normalizedPlatform = (platform || Platform.OS || "ANDROID").toUpperCase();

  const body = {
    ...(numericUserId ? { userId: numericUserId } : {}),
    fcmToken: deviceToken,
    platform: normalizedPlatform,
  };

  try {
    const response = await API.post(
      "/api/app/users/me/device-token",
      body,
      config
    );
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    console.error("[notificationApi] POST /api/app/users/me/device-token -> FAILED", {
      userId: numericUserId ?? "none",
      tokenExists: Boolean(deviceToken),
      tokenLength: deviceToken.length,
      platform: normalizedPlatform,
      status,
      error: error?.response?.data ?? error?.message,
    });
    throw error;
  }
};

// DELETE - Unregister FCM device token - Removes the current FCM device token.

export const unregisterDeviceToken = async (
  deviceToken,
  platform = Platform.OS,
  userId = null
) => {
  const config = await buildAuthConfig();

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    resolvedUserId = await getAppUserId().catch(() => null);
  }

  const numericUserId =
    resolvedUserId && !isNaN(Number(resolvedUserId))
      ? Number(resolvedUserId)
      : resolvedUserId;

  const normalizedPlatform = (platform || Platform.OS || "ANDROID").toUpperCase();

  const body = {
    ...(numericUserId ? { userId: numericUserId } : {}),
    fcmToken: deviceToken,
    platform: normalizedPlatform,
  };

  try {
    const response = await API.delete("/api/app/users/me/device-token", {
      ...config,
      data: body,
    });
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    console.error("[notificationApi] DELETE /api/app/users/me/device-token -> FAILED", {
      userId: numericUserId ?? "none",
      tokenExists: Boolean(deviceToken),
      tokenLength: deviceToken ? deviceToken.length : 0,
      platform: normalizedPlatform,
      status,
      error: error?.response?.data ?? error?.message,
    });
    throw error;
  }
};

// ── Legacy Token APIs (Optional compatibility helpers — NOT called in normal flow) ──

/**
 * Legacy FCM Token Registration
 * Contract: POST /api/notifications/register-token
 * Body: { fcmToken: string, platform: string }
 */
export const registerLegacyDeviceToken = async (deviceToken, platform = Platform.OS) => {
  if (!deviceToken || typeof deviceToken !== "string") {
    throw new Error("FCM device token is required.");
  }

  const config = await buildAuthConfig();

  const body = {
    fcmToken: deviceToken,
    platform: (platform || Platform.OS || "android").toLowerCase(),
  };

  const response = await API.post(
    "/api/notifications/register-token",
    body,
    config
  );

  return response.data;
};

/**
 * Legacy FCM Token Unregistration
 * Contract: POST /api/notifications/unregister-token
 * Body: { fcmToken: string, platform: string }
 */
export const unregisterLegacyDeviceToken = async (deviceToken, platform = Platform.OS) => {
  const config = await buildAuthConfig();

  const body = {
    fcmToken: deviceToken,
    platform: (platform || Platform.OS || "android").toLowerCase(),
  };

  const response = await API.post(
    "/api/notifications/unregister-token",
    body,
    config
  );

  return response.data;
};

// GET - Notification Switch
export const getNotificationSwitch = async () => {
  const config = await buildAuthConfig();

  const response = await API.get(
    "/api/app/users/me/notification-switch",
    config
  );

  return response.data;
};

// PATCH - Update Notification Switch

export const patchNotificationSwitch = async (enabled) => {
  const config = await buildAuthConfig();

  const response = await API.patch(
    "/api/app/users/me/notification-switch",
    {
      enabled: Boolean(enabled),
    },
    config
  );

  return response.data;
};