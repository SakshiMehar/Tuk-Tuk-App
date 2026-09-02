import { useEffect } from "react";
import { Alert, DeviceEventEmitter, Text, TextInput } from "react-native";
import { Stack, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initFirebase } from "../src/lib/firebase";
import { setSessionExpiredHandler } from "../src/api/axios";
import {
  registerForPushNotifications,
  initPushNotificationListeners,
} from "../src/services/pushNotificationService";
import { openUserChat } from "../src/utils/chatNavigation";
import { navigateFromNotification } from "../src/utils/notificationNavigation";

// ── Global font-scale guard ────────────────────────────────────────────────

// This runs once at module load, before any component mounts.
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.maxFontSizeMultiplier = 1.3;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.maxFontSizeMultiplier = 1.3;
// ──────────────────────────────────────────────────────────────────────────

// NOTE: Splash screen is handled manually inside app/index.jsx
// using Animated transitions. SplashScreen.preventAutoHideAsync()
// is intentionally NOT called here to avoid the keep-awake error.

export default function RootLayout() {
  useEffect(() => {
    initFirebase();
  }, []);

  useEffect(() => {
    // When any API call returns 401 (expired / missing token), clear the
    // session and return the user to the login screen.
    setSessionExpiredHandler(() => {
      router.replace("/login");
    });
    return () => {
      setSessionExpiredHandler(null);
    };
  }, []);

  useEffect(() => {
    // Covers "already logged in, cold app start". Also re-fires after every
    // login (see saveSession in authStore.js) since a device token is only
    // worth sending to the backend once we have a session to attach it to.
    registerForPushNotifications();

    const sessionSub = DeviceEventEmitter.addListener("sessionSaved", () => {
      registerForPushNotifications();
    });

    const unsubscribePush = initPushNotificationListeners({
      onForegroundMessage: ({ title, body, data }) => {
        if (!body && !title) return;
        Alert.alert(
          title || "Tuk-Tuk",
          body || "",
          [
            { text: "Dismiss", style: "cancel" },
            {
              text: "View",
              onPress: () => {
                if (data) navigateFromNotification(router, data);
              },
            },
          ],
          { cancelable: true }
        );
      },
      onNotificationTap: ({ data, isInitial }) => {
        // Initial notification on cold boot is consumed by app/index.jsx after splash finishes.
        // For background notifications, navigate immediately.
        if (!isInitial && data) {
          navigateFromNotification(router, data);
        }
      },
    });

    return () => {
      sessionSub.remove();
      unsubscribePush();
    };
  }, []);

  return (
    <SafeAreaProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="enter-mobile" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="terms-of-use" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="account" />
      <Stack.Screen name="voice-party" />
      <Stack.Screen name="find-friends" />
      <Stack.Screen name="nearby" />
    </Stack>
    </SafeAreaProvider>
  );
}
