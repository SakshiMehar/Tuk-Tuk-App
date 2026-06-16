import AsyncStorage from "@react-native-async-storage/async-storage";
import { refreshTokenCache } from "../api/axios";

const resetVoiceUid = () => {
  try {
    require("../utils/voiceUid").resetVoiceUidCache();
  } catch {
    // voice util optional at startup
  }
};

const TOKEN_KEY = "@auth_token";
const USER_KEY  = "@auth_user";
const TERMS_ACCEPTED_KEY = "@terms_accepted";

// ── Save token + user after any successful login ────────────
export const saveSession = async (token, user) => {
  let sessionUser = user ?? {};
  try {
    const { resolveAppUserId } = require("../utils/sessionUser");
    const userId = resolveAppUserId(sessionUser, token);
    if (userId) {
      sessionUser = {
        ...sessionUser,
        id: sessionUser?.id ?? userId,
        userId: sessionUser?.userId ?? userId,
      };
    }
  } catch {
    // keep raw user payload
  }

  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(sessionUser)],
  ]);
  await refreshTokenCache();
  resetVoiceUid();
};

// ── Read stored token ───────────────────────────────────────
export const getToken = async () => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const setTermsAccepted = async (accepted = true) => {
  await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, accepted ? "1" : "0");
};

export const hasAcceptedTerms = async () => {
  const value = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
  return value === "1";
};

export const clearTermsAccepted = async () => {
  await AsyncStorage.removeItem(TERMS_ACCEPTED_KEY);
};

// ── Read stored user object ─────────────────────────────────
export const getUser = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setUser = async (user) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const updateUser = async (updates) => {
  const current = (await getUser()) || {};
  const next = { ...current, ...updates };
  await setUser(next);
  return next;
};

// ── Clear session on logout ─────────────────────────────────
export const clearSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, TERMS_ACCEPTED_KEY]);
  resetVoiceUid();
};
