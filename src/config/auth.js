/**
 * Auth provider IDs — match backend application.properties.
 * Firebase: paste web app config below OR use .env (EXPO_PUBLIC_FIREBASE_*).
 */

/**
 * Must be a **Web application** OAuth client (Google Cloud Console).
 * Do not use the Android/iOS client ID here — that causes Error 400 in Expo Go.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  "807444567658-l9gq0ophos92739p6o9vjms7kmq0407o.apps.googleusercontent.com";

export const FACEBOOK_APP_ID =
  process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? "999372849281178";

/**
 * Paste Firebase web config here during development (Firebase Console → Project settings → Your apps → Web).
 * Leave empty if you use .env instead.
 */
export const FIREBASE_DEV_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

const fromEnv = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

const pick = (key) => fromEnv[key] || FIREBASE_DEV_CONFIG[key] || "";

export const firebaseConfig = {
  apiKey: pick("apiKey"),
  authDomain: pick("authDomain"),
  projectId: pick("projectId"),
  storageBucket: pick("storageBucket"),
  messagingSenderId: pick("messagingSenderId"),
  appId: pick("appId"),
};

/** All fields required by Firebase JS SDK + expo-firebase-recaptcha. */
export const isFirebaseConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
