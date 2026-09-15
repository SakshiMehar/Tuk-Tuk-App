import { Stack, router } from "expo-router";
import { useEffect } from "react";
import {
  Alert,
  DeviceEventEmitter,
  LogBox,
  Text,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setSessionExpiredHandler } from "../src/api/axios";
import { Colors } from "../src/constants/colors";
import { getToken } from "../src/store/authStore";
import { initFirebase } from "../src/lib/firebase";
import {
  initPushNotificationListeners,
  registerForPushNotifications,
} from "../src/services/pushNotificationService";
import { openUserChat } from "../src/utils/chatNavigation";
import { navigateFromNotification } from "../src/utils/notificationNavigation";
import {
  extractRoomIdFromUrl,
  setPendingDeepLink,
} from "../src/utils/deepLinkUtils";

LogBox.ignoreAllLogs();
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
      onNotificationTap: ({ data }) => {
        if (data) {
          console.log("[_layout] Push notification tapped -> navigating:", data);
          navigateFromNotification(router, data);
        }
      },
    });

    return () => {
      sessionSub.remove();
      unsubscribePush();
    };
  }, []);

  useEffect(() => {
    const handleDeepLinkUrl = (event) => {
      const url = event?.url;
      if (!url) return;
      console.log("[_layout] Incoming deep link URL:", url);
      const roomId = extractRoomIdFromUrl(url);
      if (roomId) {
        getToken()
          .then((token) => {
            if (token) {
              router.push({
                pathname: "/voice-party",
                params: { roomId: String(roomId) },
              });
            } else {
              setPendingDeepLink(url);
              router.push("/login");
            }
          })
          .catch(() => {
            setPendingDeepLink(url);
            router.push("/login");
          });
      }
    };

    const linkSub = Linking.addEventListener("url", handleDeepLinkUrl);
    return () => {
      linkSub.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: "slide_from_right",
        }}
      >
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
        <Stack.Screen name="chat-box" />
        <Stack.Screen name="user-profile" />
        <Stack.Screen name="blocked-accounts" />
        <Stack.Screen name="message-notification" />
        <Stack.Screen name="room/[roomId]" />
      </Stack>
    </SafeAreaProvider>
  );
}
