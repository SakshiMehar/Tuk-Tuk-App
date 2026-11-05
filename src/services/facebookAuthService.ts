import { FacebookAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';
import { firebaseFacebookAuth } from '../api/authApi';
import { establishSessionFromApi } from './authSessionService';
import {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_NAME,
  FACEBOOK_APP_SECRET,
} from '../config/auth';

let isFbConfigured = false;

export const configureFacebookSdk = () => {
  if (isFbConfigured) return;
  isFbConfigured = true;
};

interface FacebookLoginOptions {
  openWebView?: (config: {
    url?: string;
    authUrl?: string;
    onSuccess: (tokenOrCode: string, isCode?: boolean) => void;
    onCancel: () => void;
  }) => void;
}

export const getFacebookAuthUrl = (): string => {
  const redirectUri = 'https://www.facebook.com/connect/login_success.html';
  return (
    `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token,code` +
    `&scope=email,public_profile`
  );
};

export const exchangeCodeForAccessToken = async (code: string): Promise<string> => {
  const redirectUri = 'https://www.facebook.com/connect/login_success.html';
  const url = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data?.access_token) {
    return data.access_token;
  }
  throw new Error(data?.error?.message || 'Failed to exchange Facebook authorization code.');
};

export const fetchFacebookUserProfile = async (accessToken: string) => {
  try {
    const url = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      id: data?.id,
      name: data?.name,
      email: data?.email,
      avatar: data?.picture?.data?.url,
    };
  } catch (err) {
    console.warn('[FacebookAuth] Graph API profile fetch warning:', err);
    return null;
  }
};

export const exchangeFacebookToken = async (accessToken: string) => {
  let profile: any = null;
  try {
    profile = await fetchFacebookUserProfile(accessToken);
  } catch {
    // Ignore fetch failure and continue
  }

  const name = profile?.name || 'Facebook User';
  const avatar =
    profile?.avatar ||
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';

  try {
    const auth = getFirebaseAuth();
    const credential = FacebookAuthProvider.credential(accessToken);
    const userCredential = await signInWithCredential(auth, credential);

    const idToken = await userCredential.user.getIdToken();
    const { displayName, phoneNumber, photoURL } = userCredential.user;

    return await establishSessionFromApi(
      (c: any) => firebaseFacebookAuth(c.idToken, c.phoneNumber, c.name, c.avatar),
      {
        idToken,
        phoneNumber: phoneNumber ?? null,
        name: displayName || name,
        avatar: photoURL || avatar,
      }
    );
  } catch (err) {
    console.warn('[FacebookAuth] Firebase credential exchange fallback:', err);
    return await establishSessionFromApi(
      (c: any) => firebaseFacebookAuth(c.idToken, c.phoneNumber, c.name, c.avatar),
      {
        idToken: accessToken,
        phoneNumber: null,
        name,
        avatar,
      }
    );
  }
};

export const signInWithFacebook = async (options?: FacebookLoginOptions): Promise<any> => {
  return new Promise((resolve, reject) => {
    const authUrl = getFacebookAuthUrl();

    if (options?.openWebView) {
      options.openWebView({
        url: authUrl,
        authUrl,
        onSuccess: async (tokenOrCode: string, isCode?: boolean) => {
          try {
            let accessToken = tokenOrCode;
            if (isCode) {
              accessToken = await exchangeCodeForAccessToken(tokenOrCode);
            }
            const session = await exchangeFacebookToken(accessToken);
            resolve(session);
          } catch (e) {
            reject(e);
          }
        },
        onCancel: () => {
          reject(new Error('Facebook sign in cancelled'));
        },
      });
    } else {
      setTimeout(async () => {
        try {
          const mockToken = 'fb_token_' + Date.now();
          const session = await exchangeFacebookToken(mockToken);
          resolve(session);
        } catch (e) {
          reject(e);
        }
      }, 500);
    }
  });
};

export const getFacebookAuthErrorMessage = (err: any): string => {
  if (!err) return '';
  const message = err.message || String(err);
  if (message.toLowerCase().includes('cancel')) {
    return '';
  }
  return message || 'Facebook sign in failed.';
};

export default {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_NAME,
  FACEBOOK_APP_SECRET,
  configureFacebookSdk,
  getFacebookAuthUrl,
  exchangeCodeForAccessToken,
  fetchFacebookUserProfile,
  signInWithFacebook,
  getFacebookAuthErrorMessage,
};
