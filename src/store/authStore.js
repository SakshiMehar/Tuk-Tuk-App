import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import { refreshTokenCache } from "../api/axios";

const resetVoiceUid = () => {
  try {
    require("../utils/voiceUid").resetVoiceUidCache();
  } catch {
    // voice util optional at startup
  }
};

const TOKEN_KEY = "@auth_token";
const REFRESH_TOKEN_KEY = "@refresh_token";
const USER_KEY  = "@auth_user";
const TERMS_ACCEPTED_KEY = "@terms_accepted";
const PENDING_INVITE_CODE_KEY = "@pending_invite_code";

// ── Save token(s) + user after any successful login ─────────
export const saveSession = async (tokenOrTokens, user, refreshTokenParam = null) => {
  let sessionUser = user ?? {};
  let accessToken = null;
  let refreshToken = refreshTokenParam;

  if (tokenOrTokens && typeof tokenOrTokens === "object") {
    accessToken = tokenOrTokens.accessToken ?? tokenOrTokens.token ?? null;
    refreshToken = tokenOrTokens.refreshToken ?? refreshTokenParam ?? null;
  } else if (typeof tokenOrTokens === "string") {
    accessToken = tokenOrTokens;
  }

  try {
    const { resolveAppUserId } = require("../utils/sessionUser");
    const userId = resolveAppUserId(sessionUser, accessToken);
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

  const pairs = [
    [TOKEN_KEY, String(accessToken || "")],
    [USER_KEY, JSON.stringify(sessionUser)],
  ];
  if (refreshToken) {
    pairs.push([REFRESH_TOKEN_KEY, String(refreshToken)]);
  }

  await AsyncStorage.multiSet(pairs);
  await refreshTokenCache();
  resetVoiceUid();
  DeviceEventEmitter.emit("sessionSaved", sessionUser);
};

// ── Update access + refresh tokens (e.g. after refresh rotation) ──
export const saveTokens = async (accessToken, refreshToken = null) => {
  const pairs = [];
  if (accessToken) pairs.push([TOKEN_KEY, String(accessToken)]);
  if (refreshToken) pairs.push([REFRESH_TOKEN_KEY, String(refreshToken)]);
  if (pairs.length > 0) {
    await AsyncStorage.multiSet(pairs);
    await refreshTokenCache();
  }
};

// ── Read stored token ───────────────────────────────────────
export const getToken = async () => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const getAccessToken = async () => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = async () => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
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

// Captured from the login screen's optional "invite code" field. Stored
// locally only — there is no backend endpoint yet to redeem it against the
// inviter's account. Kept around so that once one exists, it can be read
// here and applied right after the first successful login.
export const setPendingInviteCode = async (code) => {
  const trimmed = String(code ?? "").trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(PENDING_INVITE_CODE_KEY);
    return;
  }
  await AsyncStorage.setItem(PENDING_INVITE_CODE_KEY, trimmed);
};

export const getPendingInviteCode = async () => {
  return AsyncStorage.getItem(PENDING_INVITE_CODE_KEY);
};

export const clearPendingInviteCode = async () => {
  await AsyncStorage.removeItem(PENDING_INVITE_CODE_KEY);
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
  DeviceEventEmitter.emit("userProfileUpdated", next);
  return next;
};

// ── Clear session on logout ─────────────────────────────────
export const clearSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, TERMS_ACCEPTED_KEY]);
  resetVoiceUid();
};
