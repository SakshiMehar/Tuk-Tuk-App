import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSavedUsers, removeUserFromServer, saveUserOnServer } from "../api/userApi";
import { API_BASE_URL } from "../config/env";

// Local cache mirrors server saves for quick star-state checks offline.
// Profile → Saved menu uses GET /api/app/users/saved.
// Save action uses POST /api/app/users/saved/{targetUserId}.
// Remove uses DELETE /api/app/users/saved/{targetUserId}.
const SAVED_KEY = "@saved_users";

const listFrom = (value) => {
  if (Array.isArray(value)) return value;
  return value?.users ?? value?.content ?? value?.data ?? value?.items ?? [];
};

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const normalizeEntry = (user) => {
  const userId = String(user?.userId ?? user?.id ?? "");
  return {
    userId,
    name: user?.name ?? user?.title ?? user?.displayName ?? "User",
    avatarUrl:
      user?.avatarUrl ??
      user?.avatar ??
      user?.profilePicUrl ??
      user?.profileImageUrl ??
      null,
    occupation: user?.occupation ?? null,
    savedAt: Date.now(),
  };
};

export const loadSavedUsers = async () => {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

/** GET /api/app/users/saved — server saved list for Profile → Saved menu. */
export const fetchSavedUsersFromServer = async () => {
  const data = await getSavedUsers();
  
  return listFrom(data).map((user) => {
    const entry = normalizeEntry(user);
    return {
      ...entry,
      avatarUrl: resolveMediaUrl(entry.avatarUrl),
    };
  });
};

export const isUserSaved = async (userId) => {
  const list = await loadSavedUsers();
  return list.some((u) => u.userId === String(userId));
};

export const saveFavoriteUser = async (user) => {
  const entry = normalizeEntry(user);
  if (!entry.userId) {
    throw new Error("Missing user id.");
  }

  const data = await saveUserOnServer(entry.userId);
  

  const list = await loadSavedUsers();
  if (list.some((u) => u.userId === entry.userId)) {
    
    return list;
  }

  const next = [entry, ...list];
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
  
  return next;
};

export const removeFavoriteUser = async (userId) => {
  const targetUserId = String(userId ?? "");
  if (!targetUserId) {
    throw new Error("Missing user id.");
  }

  const data = await removeUserFromServer(targetUserId);
  

  const list = await loadSavedUsers();
  const next = list.filter((u) => u.userId !== targetUserId);
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
  
  return next;
};
