import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initFirebase } from "../src/lib/firebase";
import { setSessionExpiredHandler } from "../src/api/axios";

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
