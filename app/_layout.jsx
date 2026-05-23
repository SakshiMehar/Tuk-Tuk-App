import { Stack } from "expo-router";

// NOTE: Splash screen is handled manually inside app/index.jsx
// using Animated transitions. SplashScreen.preventAutoHideAsync()
// is intentionally NOT called here to avoid the keep-awake error.

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="enter-mobile" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="terms-of-use" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="voice-party" />
      <Stack.Screen name="find-friends" />
      <Stack.Screen name="nearby" />
    </Stack>
  );
}
