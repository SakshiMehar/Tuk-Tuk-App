import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import "./global.css"

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="enter-mobile" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="terms-of-use" />
      <Stack.Screen name="privacy-policy" />
    </Stack>
  );
}
