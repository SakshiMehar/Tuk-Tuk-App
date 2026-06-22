/**
 * Facebook login → Firebase idToken → POST /api/auth/firebase-facebook.
 *
 * Android: browser OAuth (native SDK requires key hash saved in Meta first).
 * iOS: native Facebook app when available.
 * Set EXPO_PUBLIC_FACEBOOK_USE_NATIVE=true after adding Android key hash in Meta.
 */
import Constants from "expo-constants";
import { Platform } from "react-native";
import { signInWithFacebookWeb } from "./facebookWebAuth";

const isExpoGo = Constants.appOwnership === "expo";

const canUseNativeAndroid =
  Platform.OS === "android" &&
  process.env.EXPO_PUBLIC_FACEBOOK_USE_NATIVE === "true";

const shouldUseNativeSdk =
  !isExpoGo && (Platform.OS === "ios" || canUseNativeAndroid);

export const configureFacebookSdk = () => {
  if (!shouldUseNativeSdk) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./facebookSdkNative").configureFacebookSdk();
};

export const signInWithFacebook = async (options = {}) => {
  if (!shouldUseNativeSdk) {
    return signInWithFacebookWeb(options);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return await require("./facebookSdkNative").signInWithFacebook();
  } catch (err) {
    const msg = (err?.message ?? "").toLowerCase();
    if (msg.includes("cancelled")) throw err;
    
    return signInWithFacebookWeb(options);
  }
};
