import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig, isFirebaseConfigured } from "../config/auth";

let authInstance = null;
let initAttempted = false;

export const getFirebaseAuth = () => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Add keys to FIREBASE_DEV_CONFIG in src/config/auth.js or to a .env file."
    );
  }

  if (authInstance) return authInstance;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    authInstance = getAuth(app);
  }

  return authInstance;
};

/** Call once at app start so Auth is ready before phone OTP. */
export const initFirebase = () => {
  if (initAttempted || !isFirebaseConfigured()) return;
  initAttempted = true;
  try {
    getFirebaseAuth();
  } catch (e) {
    console.warn("Firebase init:", e?.message ?? e);
    initAttempted = false;
  }
};
