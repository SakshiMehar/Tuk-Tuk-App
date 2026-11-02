/**
 * Auth configuration for Tuk-Tuk
 * Matches Firebase project tuk-tuk-application & backend auth endpoints.
 */

export const GOOGLE_WEB_CLIENT_ID =
  '969637468541-g2tea78vrhg915eklstvv4q612223129.apps.googleusercontent.com';

export const FACEBOOK_APP_ID = '978713374875936';

export const firebaseConfig = {
  apiKey: 'AIzaSyCWckmHnO5vjpWdb2F6Qpp8r36cteVfgoo',
  authDomain: 'tuk-tuk-application.firebaseapp.com',
  projectId: 'tuk-tuk-application',
  storageBucket: 'tuk-tuk-application.firebasestorage.app',
  messagingSenderId: '969637468541',
  appId: '1:969637468541:android:560e24f2bfa8aae8671414',
};

export const isFirebaseConfigured = (): boolean =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );

export default {
  GOOGLE_WEB_CLIENT_ID,
  FACEBOOK_APP_ID,
  firebaseConfig,
  isFirebaseConfigured,
};
