import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/auth/authStore';

export const getUser = async () => {
  const storeUser = useAuthStore.getState()?.user;
  if (storeUser) return storeUser;
  try {
    const raw = await AsyncStorage.getItem('@auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getToken = async () => {
  const storeToken = useAuthStore.getState()?.token;
  if (storeToken) return storeToken;
  try {
    return await AsyncStorage.getItem('@auth_token');
  } catch {
    return null;
  }
};

export const resolveAppUserId = (user, token) => {
  if (user) {
    const directId = user.userId ?? user.id ?? user.user_id ?? user._id;
    if (directId != null && directId !== '') return directId;
  }

  if (token && typeof token === 'string') {
    const parts = token.split('.');
    if (parts.length >= 2) {
      try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        let jsonStr = '';
        if (typeof globalThis.atob === 'function') {
          jsonStr = globalThis.atob(padded);
        } else {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
          let str = padded.replace(/=+$/, '');
          for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ) {
            const idx = chars.indexOf(buffer);
            if (idx === -1) continue;
            bs = bc % 4 ? bs * 64 + idx : idx;
            if (bc++ % 4) jsonStr += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
          }
        }
        const payload = JSON.parse(jsonStr);
        const sub = payload.sub ?? payload.userId ?? payload.id;
        if (sub != null && sub !== '') return sub;
      } catch {}
    }
  }

  return null;
};

export const getAppUserId = async () => {
  const user = await getUser();
  const token = await getToken();
  const userId = resolveAppUserId(user, token);
  if (userId != null) return userId;

  // Fallback to random session id if user is in guest/dev mode
  return 'user_guest_' + Date.now();
};

export const isOwnContent = async (ownerId) => {
  if (ownerId == null) return false;
  try {
    const currentId = await getAppUserId();
    return String(currentId) === String(ownerId);
  } catch {
    return false;
  }
};

export default {
  getUser,
  getToken,
  resolveAppUserId,
  getAppUserId,
  isOwnContent,
};
