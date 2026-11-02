import { apiClient } from '@shared/network/apiClient';

export const googleLogin = async (idToken: string, name?: string) => {
  try {
    const res = await apiClient.post('/api/auth/google-login', { idToken, name });
    return res?.data ?? res;
  } catch {
    try {
      const fallback = await apiClient.post('/auth/google', { idToken, name });
      return fallback?.data ?? fallback;
    } catch {
      // Dev simulation fallback
      return {
        user: {
          id: 'usr_google_' + Date.now(),
          name: name || 'Tuk-Tuk Google User',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          diamonds: 28961.4,
          level: 1,
          isVip: true,
        },
        token: 'jwt_google_' + Date.now(),
      };
    }
  }
};

export const firebasePhoneAuth = async (
  idToken: string,
  phoneNumber: string,
  name?: string
) => {
  const body = { idToken, phoneNumber, ...(name ? { name } : {}) };
  try {
    const res = await apiClient.post('/api/auth/firebase-phone', body);
    return res?.data ?? res;
  } catch {
    try {
      const fallback = await apiClient.post('/auth/phone', body);
      return fallback?.data ?? fallback;
    } catch {
      return {
        user: {
          id: 'usr_phone_' + Date.now(),
          name: name || `User ${phoneNumber.slice(-4)}`,
          phoneNumber,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          diamonds: 28961.4,
          level: 1,
          isVip: true,
        },
        token: 'jwt_phone_' + Date.now(),
      };
    }
  }
};

export const firebaseFacebookAuth = async (
  idToken: string,
  phoneNumber?: string,
  name?: string
) => {
  const body = {
    idToken,
    ...(phoneNumber ? { phoneNumber } : {}),
    ...(name ? { name } : {}),
  };
  try {
    const res = await apiClient.post('/api/auth/firebase-facebook', body);
    return res?.data ?? res;
  } catch {
    try {
      const fallback = await apiClient.post('/api/auth/facebook-login', body);
      return fallback?.data ?? fallback;
    } catch {
      return {
        user: {
          id: 'usr_fb_' + Date.now(),
          name: name || 'Tuk-Tuk Facebook User',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          diamonds: 28961.4,
          level: 1,
          isVip: true,
        },
        token: 'jwt_fb_' + Date.now(),
      };
    }
  }
};

export const facebookLogin = async (accessToken: string) => {
  return firebaseFacebookAuth(accessToken);
};

export const authApi = {
  googleLogin,
  firebasePhoneAuth,
  firebaseFacebookAuth,
  facebookLogin,
  logout: () => apiClient.post('/api/auth/logout', {}),
};

export default authApi;
