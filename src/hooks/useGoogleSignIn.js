
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "../config/auth";

// Configure Google Sign-In once (call this before any sign-in attempt)
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();
  return tokens.idToken;
}

export const getGoogleAuthErrorMessage = (err) => {
  if (!err) return null;
  if (err.code === statusCodes.SIGN_IN_CANCELLED) return "cancelled";
  if (err.code === statusCodes.IN_PROGRESS) return "Sign-in already in progress.";
  if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
    return "Google Play Services not available.";
  const message = err?.message ?? "Google sign-in failed.";
  if (/DEVELOPER_ERROR/i.test(message)) {
    return (
      "Google Sign-In is not configured for this APK signing key. " +
      "Add the EAS/release SHA-1 fingerprint in Firebase (Android app tuk.tuk.app), " +
      "download an updated google-services.json, then rebuild. " +
      "Run: npm run google:android-sha"
    );
  }
  return message;
};
