import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  getUserSettings as apiGetUserSettings,
  patchUserSettings as apiPatchUserSettings,
  getMatchSwitch as apiGetMatchSwitch,
  patchMatchSwitch as apiPatchMatchSwitch,
  clearAppCache as apiClearAppCache,
  clearChatCache as apiClearChatCache,
  checkForUpdate as apiCheckForUpdate,
  submitFeedback as apiSubmitFeedback,
} from "../api/userSettingsApi";

const CHAT_PERMISSION_TO_API = {
  Everyone: "EVERYONE",
  "Friends only": "FRIENDS_ONLY",
  Nobody: "NOBODY",
};

const CHAT_PERMISSION_FROM_API = {
  EVERYONE: "Everyone",
  FRIENDS_ONLY: "Friends only",
  NOBODY: "Nobody",
};

const NOTIFICATION_TO_API = {
  "All notifications": "ALL",
  "Only message, moments & interaction alerts": "MESSAGE_MOMENTS_INTERACTION",
  "Only message alerts": "MESSAGE_ONLY",
  "No notifications": "NONE",
};

const NOTIFICATION_FROM_API = Object.fromEntries(
  Object.entries(NOTIFICATION_TO_API).map(([label, value]) => [value, label])
);

const SETTINGS_KEYS = [
  "matchSwitchEnabled",
  "matchSwitch",
  "matchEnabled",
  "notificationPreference",
  "notificationOption",
  "notifications",
  "preventFollowIntoRoom",
  "preventFollowing",
  "chatPermission",
  "whoCanChat",
  "mysteriousVisitor",
  "systemLanguage",
  "contentLanguage",
];

const unwrapSettings = (data) => data?.settings ?? data?.data ?? data ?? {};

const responseHasSettings = (data) => {
  const raw = unwrapSettings(data);
  return SETTINGS_KEYS.some((key) => raw[key] !== undefined && raw[key] !== null);
};

export const buildSettingsPatchPayload = (updates = {}) => {
  const payload = {};

  if (updates.matchSwitchEnabled !== undefined) {
    payload.matchSwitchEnabled = Boolean(updates.matchSwitchEnabled);
  }
  if (updates.notificationOption !== undefined) {
    payload.notificationPreference =
      NOTIFICATION_TO_API[updates.notificationOption] ?? updates.notificationOption;
  }
  if (updates.preventFollowing !== undefined) {
    payload.preventFollowIntoRoom = Boolean(updates.preventFollowing);
  }
  if (updates.chatPermission !== undefined) {
    payload.chatPermission =
      CHAT_PERMISSION_TO_API[updates.chatPermission] ?? updates.chatPermission;
  }
  if (updates.mysteriousVisitor !== undefined) {
    payload.mysteriousVisitor = Boolean(updates.mysteriousVisitor);
  }
  if (updates.systemLanguage !== undefined) {
    payload.systemLanguage = updates.systemLanguage;
  }
  if (updates.contentLanguage !== undefined) {
    payload.contentLanguage = updates.contentLanguage;
  }

  return payload;
};

export const parseUserSettings = (data) => {
  const raw = unwrapSettings(data);

  const notificationPreference =
    raw.notificationPreference ?? raw.notificationOption ?? raw.notifications;
  const chatPermissionRaw = raw.chatPermission ?? raw.whoCanChat;

  return {
    matchSwitchEnabled: Boolean(
      raw.matchSwitchEnabled ?? raw.matchSwitch ?? raw.matchEnabled ?? false
    ),
    notificationOption:
      NOTIFICATION_FROM_API[notificationPreference] ??
      notificationPreference ??
      "All notifications",
    preventFollowing: Boolean(
      raw.preventFollowIntoRoom ?? raw.preventFollowing ?? false
    ),
    chatPermission:
      CHAT_PERMISSION_FROM_API[chatPermissionRaw] ??
      chatPermissionRaw ??
      "Everyone",
    mysteriousVisitor: Boolean(raw.mysteriousVisitor ?? false),
    systemLanguage: raw.systemLanguage ?? "English",
    contentLanguage: raw.contentLanguage ?? "English",
  };
};

export const loadUserSettings = async () => {
  const data = await apiGetUserSettings();
  const parsed = parseUserSettings(data);
  
  return parsed;
};

export const updateUserSettings = async (updates = {}, previous = {}) => {
  const payload = buildSettingsPatchPayload(updates);
  const data = await apiPatchUserSettings(payload);
  const parsed = responseHasSettings(data)
    ? parseUserSettings(data)
    : { ...previous, ...updates };
  
  return parsed;
};

export const loadMatchSwitch = async () => {
  const data = await apiGetMatchSwitch();
  const raw = unwrapSettings(data);
  const resolved = Boolean(
    raw.matchSwitchEnabled ??
      raw.matchSwitch ??
      raw.matchEnable ??
      raw.matchEnabled ??
      raw.enabled ??
      false
  );
  
  return resolved;
};

export const updateMatchSwitch = async (enabled) => {
  const data = await apiPatchMatchSwitch(enabled);
  const raw = unwrapSettings(data);
  const resolved = Boolean(
    raw.matchSwitchEnabled ??
      raw.matchSwitch ??
      raw.matchEnable ??
      raw.matchEnabled ??
      raw.enabled ??
      enabled
  );
  
  return resolved;
};

export const clearAppCache = () => apiClearAppCache();

export const clearChatCache = (userIds = []) => apiClearChatCache(userIds);

export const checkForUpdate = async () => {
  const params = {
    platform: Platform.OS === "ios" ? "ios" : "android",
    currentVersion:
      Constants.expoConfig?.version ??
      Constants.nativeAppVersion ??
      "1.0.0",
  };
  const data = await apiCheckForUpdate(params);
  
  return data;
};

export const submitFeedback = async (message) => {
  const data = await apiSubmitFeedback(message);
  
  return data;
};
