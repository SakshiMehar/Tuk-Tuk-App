import Constants from "expo-constants";
import { isFirebaseConfigured } from "../config/auth";

/** True when running inside the Expo Go app. */
export const isExpoGo = Constants.appOwnership === "expo";

/** Firebase phone OTP (works in Expo Go with expo-firebase-recaptcha). */
export const useFirebasePhone = () => isFirebaseConfigured();
