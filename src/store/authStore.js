import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@auth_token";
const USER_KEY  = "@auth_user";

// ── Save token + user after any successful login ────────────
export const saveSession = async (token, user) => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
};

// ── Read stored token ───────────────────────────────────────
export const getToken = async () => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

// ── Read stored user object ─────────────────────────────────
export const getUser = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

// ── Clear session on logout ─────────────────────────────────
export const clearSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};
