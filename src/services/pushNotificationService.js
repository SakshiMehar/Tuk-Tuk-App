import { Platform, PermissionsAndroid } from "react-native";
import {
  getMessaging,
  getToken,
  deleteToken,
  requestPermission,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
} from "@react-native-firebase/messaging";
import { registerDeviceToken, unregisterDeviceToken } from "../api/notificationApi";
import { getBearerToken } from "../api/axios";
import { getAppUserId } from "../utils/sessionUser";
import { setPendingNotification } from "../utils/notificationNavigation";

let listenersInitialized = false;
let currentDeviceToken = null;
let lastRegisteredKey = null;
let inFlightRegistration = null;
let registrationAttemptCount = 0;

const requestAndroidPermission = async () => {
  // POST_NOTIFICATIONS is only a runtime permission from Android 13 (API 33)+.
  if (Platform.OS !== "android" || Platform.Version < 33) return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

/** Requests OS notification permission. Resolves true if the user granted it. */
export const requestNotificationPermission = async () => {
  if (Platform.OS === "android") {
    return requestAndroidPermission();
  }
  try {
    const messagingInstance = getMessaging();
    const authStatus = await requestPermission(messagingInstance);
    return (
      authStatus === 1 || // AUTHORIZED
      authStatus === 2    // PROVISIONAL
    );
  } catch {
    return false;
  }
};

/**
 * Requests OS permission and fetches the FCM token.
 * Registers the device token with the backend if an active user session exists.
 */
export const registerForPushNotifications = async ({ force = false } = {}) => {
  if (inFlightRegistration) {
    return inFlightRegistration;
  }

  inFlightRegistration = (async () => {
    try {
      const granted = await requestNotificationPermission();
      if (!granted) return null;

      const messagingInstance = getMessaging();
      const deviceToken = await getToken(messagingInstance);

      if (!deviceToken) return null;
      currentDeviceToken = deviceToken;

      // Only register with backend if user has an active, valid login session
      const authToken = await getBearerToken();
      if (!authToken) {
        return deviceToken;
      }

      const userId = await getAppUserId().catch(() => null);
      const registrationKey = `${userId || "unknown"}_${deviceToken}`;

      if (!force && lastRegisteredKey === registrationKey) {
        return deviceToken;
      }

      registrationAttemptCount += 1;

      // Register the device token with the backend.
      try {
        await registerDeviceToken(deviceToken, Platform.OS, userId);
        lastRegisteredKey = registrationKey;
      } catch (error) {
        console.warn("[pushNotificationService] Failed to register device token with backend:", {
          status: error?.response?.status,
          error: error?.response?.data ?? error?.message,
          userId: userId ?? "unknown",
          tokenLength: deviceToken.length,
          attempt: registrationAttemptCount,
        });
      }

      return deviceToken;
    } catch {
      return null;
    } finally {
      inFlightRegistration = null;
    }
  })();

  return inFlightRegistration;
};

export const getCurrentDeviceToken = () => currentDeviceToken;

/** Unregisters the device token with the backend and deletes it locally on logout. */
export const unregisterDevicePushToken = async () => {
  try {
    const messagingInstance = getMessaging();
    const token = currentDeviceToken || (await getToken(messagingInstance).catch(() => null));
    if (token) {
      // 1. Unregister from backend
      try {
        const userId = await getAppUserId().catch(() => null);
        await unregisterDeviceToken(token, Platform.OS, userId);
      } catch (err) {
        console.warn("Failed to unregister FCM token from backend:", err?.response?.data ?? err?.message);
      }
    }
    // 2. Delete FCM token from device so next session gets a fresh token
    try {
      await deleteToken(messagingInstance);
    } catch (delErr) {
      console.warn("Failed to delete local FCM token:", delErr?.message);
    }
  } catch (error) {
    console.warn("Failed to clean up push token on logout:", error?.message);
  } finally {
    currentDeviceToken = null;
    lastRegisteredKey = null;
  }
};

/**
 * Wires up foreground/tap/refresh listeners. Call once from the root layout.
 *   onForegroundMessage({ title, body, data }) — a push arrived while the app was open.
 *   onNotificationTap({ data, isInitial })      — user tapped a push (background or killed state).
 * Returns an unsubscribe function.
 */
export const initPushNotificationListeners = ({
  onForegroundMessage,
  onNotificationTap,
} = {}) => {
  if (listenersInitialized) return () => {};
  listenersInitialized = true;

  const messagingInstance = getMessaging();

  const unsubscribeOnMessage = onMessage(messagingInstance, async (remoteMessage) => {
    onForegroundMessage?.({
      title: remoteMessage?.notification?.title ?? "Tuk-Tuk",
      body: remoteMessage?.notification?.body ?? "",
      data: remoteMessage?.data ?? {},
    });
  });

  const unsubscribeOnTokenRefresh = onTokenRefresh(messagingInstance, async (token) => {
    currentDeviceToken = token;

    // When Firebase generates a new token, update backend only if logged in and changed
    try {
      const authToken = await getBearerToken();
      if (authToken) {
        const userId = await getAppUserId().catch(() => null);
        const refreshKey = `${userId || "unknown"}_${token}`;
        if (lastRegisteredKey === refreshKey) {
          return;
        }
        await registerDeviceToken(token, Platform.OS, userId);
        lastRegisteredKey = refreshKey;
      }
    } catch (error) {
      console.warn("Failed to update refreshed FCM token:", error?.response?.data ?? error?.message);
    }
  });

  // Tapped a notification while the app was backgrounded (not killed).
  const unsubscribeOnOpenedApp = onNotificationOpenedApp(messagingInstance, (remoteMessage) => {
    const payload = {
      ...(remoteMessage?.notification ?? {}),
      ...(remoteMessage?.data ?? {}),
    };
    if (Object.keys(payload).length > 0) {
      onNotificationTap?.({ data: payload, isInitial: false });
    }
  });

  // Tapped a notification that launched the app from a killed state.
  getInitialNotification(messagingInstance)
    .then((remoteMessage) => {
      const payload = {
        ...(remoteMessage?.notification ?? {}),
        ...(remoteMessage?.data ?? {}),
      };
      if (Object.keys(payload).length > 0) {
        setPendingNotification(payload);
        onNotificationTap?.({ data: payload, isInitial: true });
      }
    })
    .catch(() => {});

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnTokenRefresh();
    unsubscribeOnOpenedApp();
    listenersInitialized = false;
  };
};
