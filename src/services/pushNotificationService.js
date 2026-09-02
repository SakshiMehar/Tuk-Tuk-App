import { Platform, PermissionsAndroid } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { registerDeviceToken, unregisterDeviceToken } from "../api/notificationApi";
import { getBearerToken } from "../api/axios";
import { setPendingNotification } from "../utils/notificationNavigation";

let listenersInitialized = false;
let currentDeviceToken = null;

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
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
};

/**
 * Requests OS permission and fetches the FCM token.
 * Registers the device token with the backend if an active user session exists.
 */
export const registerForPushNotifications = async () => {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;
    const deviceToken = await messaging().getToken();

    if (!deviceToken) return null;
    currentDeviceToken = deviceToken;

    // Only register with backend if user has an active, valid login session
    const authToken = await getBearerToken();
    if (!authToken) {
      return deviceToken;
    }

    // Register the device token with the backend.
    try {
      await registerDeviceToken(deviceToken);
    } catch (error) {
      console.warn("Failed to register device token with backend:", error?.response?.data ?? error?.message);
    }

    return deviceToken;
  } catch {
    return null;
  }
};

export const getCurrentDeviceToken = () => currentDeviceToken;

/** Unregisters the device token with the backend and deletes it locally on logout. */
export const unregisterDevicePushToken = async () => {
  try {
    const token = currentDeviceToken || (await messaging().getToken().catch(() => null));
    if (token) {
      // 1. Unregister from backend
      try {
        await unregisterDeviceToken(token);
      } catch (err) {
        console.warn("Failed to unregister FCM token from backend:", err?.response?.data ?? err?.message);
      }
    }
    // 2. Delete FCM token from device so next session gets a fresh token
    try {
      await messaging().deleteToken();
    } catch (delErr) {
      console.warn("Failed to delete local FCM token:", delErr?.message);
    }
  } catch (error) {
    console.warn("Failed to clean up push token on logout:", error?.message);
  } finally {
    currentDeviceToken = null;
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

  const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
    onForegroundMessage?.({
      title: remoteMessage?.notification?.title ?? "Tuk-Tuk",
      body: remoteMessage?.notification?.body ?? "",
      data: remoteMessage?.data ?? {},
    });
  });

  const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(async (token) => {
    currentDeviceToken = token;

    // When Firebase generates a new token, update backend only if logged in
    try {
      const authToken = await getBearerToken();
      if (authToken) {
        await registerDeviceToken(token);
      }
    } catch (error) {
      console.warn("Failed to update refreshed FCM token:", error?.response?.data ?? error?.message);
    }
  });

  // Tapped a notification while the app was backgrounded (not killed).
  const unsubscribeOnOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
    if (remoteMessage?.data) {
      onNotificationTap?.({ data: remoteMessage.data, isInitial: false });
    }
  });

  // Tapped a notification that launched the app from a killed state.
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage?.data) {
        setPendingNotification(remoteMessage.data);
        onNotificationTap?.({ data: remoteMessage.data, isInitial: true });
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
