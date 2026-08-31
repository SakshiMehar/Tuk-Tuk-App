import { Platform, PermissionsAndroid } from "react-native";
import messaging from "@react-native-firebase/messaging";

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
 * Device token registration with the backend has been removed.
 */
export const registerForPushNotifications = async () => {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;
    const deviceToken = await messaging().getToken();
    currentDeviceToken = deviceToken;
    return deviceToken;
  } catch {
    return null;
  }
};

export const getCurrentDeviceToken = () => currentDeviceToken;

/**
 * Wires up foreground/tap/refresh listeners. Call once from the root layout.
 *   onForegroundMessage({ title, body, data }) — a push arrived while the app was open.
 *   onNotificationTap({ data })                — user tapped a push (background or killed state).
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

  const unsubscribeOnTokenRefresh = messaging().onTokenRefresh((token) => {
    currentDeviceToken = token;
  });

  // Tapped a notification while the app was backgrounded (not killed).
  const unsubscribeOnOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
    if (remoteMessage) onNotificationTap?.({ data: remoteMessage?.data ?? {} });
  });

  // Tapped a notification that launched the app from a killed state.
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) onNotificationTap?.({ data: remoteMessage?.data ?? {} });
    })
    .catch(() => {});

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnTokenRefresh();
    unsubscribeOnOpenedApp();
    listenersInitialized = false;
  };
};
