import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "../config/auth";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
    scopes: ["profile", "email"],
  });
  configured = true;
}

export async function signInWithGoogle() {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  return response;
}

export function getGoogleIdToken(response) {
  if (!response) return null;
  if (response.type === "success") {
    return response.data?.idToken ?? null;
  }
  return response.idToken ?? null;
}

export function getGoogleAuthErrorMessage(error) {
  if (!error) return null;
  if (error.code === statusCodes.SIGN_IN_CANCELLED) return "cancelled";
  if (error.code === statusCodes.IN_PROGRESS)
    return "Sign-in already in progress.";
  if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
    return "Google Play Services not available on this device.";
  return error.message ?? "Google sign-in failed.";
}
