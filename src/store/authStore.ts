import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { useAuthStore } from './auth/authStore';
import { refreshTokenCache } from '../api/axios';
import { resolveAppUserId } from '../utils/sessionUser';
import { safeSetMany } from '../utils/asyncStorageCompat';

const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const USER_KEY = '@auth_user';
const TERMS_ACCEPTED_KEY = '@terms_accepted';
const PENDING_INVITE_CODE_KEY = '@pending_invite_code';

export const saveSession = async (
  tokenOrTokens: any,
  user: any,
  refreshTokenParam: string | null = null
) => {
  let sessionUser = user ?? {};
  let accessToken: string | null = null;
  let refreshToken: string | null = refreshTokenParam;

  if (tokenOrTokens && typeof tokenOrTokens === 'object') {
    accessToken = tokenOrTokens.accessToken ?? tokenOrTokens.token ?? null;
    refreshToken = tokenOrTokens.refreshToken ?? refreshTokenParam ?? null;
  } else if (typeof tokenOrTokens === 'string') {
    accessToken = tokenOrTokens;
  }

  try {
    const userId = resolveAppUserId(sessionUser, accessToken);
    if (userId) {
      sessionUser = {
        ...sessionUser,
        id: sessionUser?.id ?? userId,
        userId: sessionUser?.userId ?? userId,
      };
    }
  } catch {}

  await useAuthStore.getState().setAuth(sessionUser, accessToken, refreshToken);
};

export const saveTokens = async (accessToken: string, refreshToken: string | null = null) => {
  const entries: Record<string, string> = {};
  if (accessToken) entries[TOKEN_KEY] = String(accessToken);
  if (refreshToken) entries[REFRESH_TOKEN_KEY] = String(refreshToken);
  if (Object.keys(entries).length > 0) {
    await safeSetMany(entries);
    await refreshTokenCache();
  }
};

export const getToken = async (): Promise<string | null> => {
  const storeToken = useAuthStore.getState().token;
  if (storeToken) return storeToken;
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const getAccessToken = async (): Promise<string | null> => {
  return getToken();
};

export const getRefreshToken = async (): Promise<string | null> => {
  const storeRefresh = useAuthStore.getState().refreshToken;
  if (storeRefresh) return storeRefresh;
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getUser = async (): Promise<any> => {
  const storeUser = useAuthStore.getState().user;
  if (storeUser) return storeUser;
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUser = async (user: any): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  useAuthStore.getState().updateUser(user);
};

export const updateUser = async (updates: any): Promise<any> => {
  return useAuthStore.getState().updateUser(updates);
};

export const clearSession = async (): Promise<void> => {
  await useAuthStore.getState().logout();
};

export const hasAcceptedTerms = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
    return val === '1' || val === 'true';
  } catch {
    return false;
  }
};

export const setTermsAccepted = async (accepted: boolean = true): Promise<void> => {
  try {
    await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, accepted ? '1' : '0');
  } catch {}
};

export const clearTermsAccepted = async (): Promise<void> => {
  await AsyncStorage.removeItem(TERMS_ACCEPTED_KEY);
};

export const setPendingInviteCode = async (code: string): Promise<void> => {
  const trimmed = String(code ?? '').trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(PENDING_INVITE_CODE_KEY);
    return;
  }
  await AsyncStorage.setItem(PENDING_INVITE_CODE_KEY, trimmed);
};

export const getPendingInviteCode = async (): Promise<string | null> => {
  return AsyncStorage.getItem(PENDING_INVITE_CODE_KEY);
};

export const clearPendingInviteCode = async (): Promise<void> => {
  await AsyncStorage.removeItem(PENDING_INVITE_CODE_KEY);
};

export { useAuthStore };
export default {
  saveSession,
  saveTokens,
  getToken,
  getAccessToken,
  getRefreshToken,
  getUser,
  setUser,
  updateUser,
  clearSession,
  hasAcceptedTerms,
  setTermsAccepted,
  clearTermsAccepted,
  setPendingInviteCode,
  getPendingInviteCode,
  clearPendingInviteCode,
  useAuthStore,
};
