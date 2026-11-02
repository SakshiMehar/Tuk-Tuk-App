import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, isFirebaseConfigured } from '../config/auth';

let authInstance: any = null;
let initAttempted = false;

export const getFirebaseAuth = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured.');
  }

  if (authInstance) return authInstance;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

  try {
    let getPersistence: any;
    try {
      // @ts-ignore
      const authModule = require('firebase/auth');
      getPersistence = authModule?.getReactNativePersistence;
    } catch {
      // fallback
    }

    if (getPersistence) {
      authInstance = initializeAuth(app, {
        persistence: getPersistence(ReactNativeAsyncStorage),
      });
    } else {
      authInstance = getAuth(app);
    }
  } catch {
    authInstance = getAuth(app);
  }

  return authInstance;
};

export const initFirebase = () => {
  if (initAttempted || !isFirebaseConfigured()) return;
  initAttempted = true;
  try {
    getFirebaseAuth();
  } catch {
    initAttempted = false;
  }
};

export default {
  getFirebaseAuth,
  initFirebase,
};
