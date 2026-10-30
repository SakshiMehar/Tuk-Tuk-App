import axios from "axios";
import { Platform } from "react-native";
import { getBearerToken, refreshTokenCache } from "./axios";
import { API_BASE_URL } from "../config/env";

const LOG_TAG = "[AvatarAPI]";

/**
 * Endpoint configurations
 * Backend URL provided: http://localhost:8084
 * Types supported:
 *  - AVATAR_FRAME
 *  - CP_AVATAR_FRAME
 *  - DYNAMIC_AVATAR
 * Inventory endpoint:
 *  - GET /api/store/avatar/inventory
 */
export const LOCAL_AVATAR_BASE_URL = "http://localhost:8084";
export const ANDROID_EMULATOR_BASE_URL = "http://10.0.2.2:8084";

export const AVATAR_TYPES = {
  AVATAR_FRAME: "AVATAR_FRAME",
  CP_AVATAR_FRAME: "CP_AVATAR_FRAME",
  DYNAMIC_AVATAR: "DYNAMIC_AVATAR",
};

/**
 * Normalizes backend dynamic avatar item into standard StorePanel item format
 */
export const normalizeDynamicAvatar = (item, type = "AVATAR_FRAME") => {
  if (!item) return null;

  const numericId = item.id ?? item.avatarId ?? item.itemId;
  const name = item.name ?? item.title ?? item.label ?? "Avatar Item";
  const diamonds = Math.round(Number(item.diamonds ?? item.price ?? item.cost ?? 0));

  // Validity / Duration
  let duration = item.duration;
  if (!duration) {
    if (item.validityDays) {
      duration = `${item.validityDays} Day${item.validityDays > 1 ? "s" : ""}`;
    } else if (item.expiryDays) {
      duration = `${item.expiryDays} Day${item.expiryDays > 1 ? "s" : ""}`;
    } else {
      duration = "1 Day";
    }
  }

  // SubCategory mapping
  let subCategory = "avatar_frame";
  if (type === "CP_AVATAR_FRAME") subCategory = "cp_avatar_frame";
  else if (type === "DYNAMIC_AVATAR") subCategory = "dynamic_avatar";

  // Outfit type: all, normal, privilege
  const rawOutfit = String(item.outfitType ?? item.outfit ?? "all").toLowerCase();
  const outfitType = rawOutfit.includes("privilege")
    ? "privilege"
    : rawOutfit.includes("normal")
    ? "normal"
    : "all";

  // Button type
  const buttonType =
    item.buttonType ||
    (item.vipLevel || item.isVip
      ? "VIP"
      : item.monthlyCard
      ? "Monthly Card"
      : "Purchase");

  // Icon / Frame URL
  const iconUrl =
    item.iconUrl ||
    item.imageUrl ||
    item.assetUrl ||
    item.frameUrl ||
    item.resourceUri ||
    item.coverImage ||
    null;

  return {
    id: `api_avatar_${numericId || Math.random().toString(36).substr(2, 9)}`,
    avatarId: numericId,
    name,
    diamonds,
    duration,
    buttonType,
    vipLevel: item.vipLevel ?? (item.isVip ? "VIP" : null),
    category: "avatar",
    subCategory,
    outfitType,
    grade: item.grade ?? null,
    tag:
      item.tag ??
      (item.isNewUser ? "NEW USER" : item.rechargeBonus ? "Recharge Bonus" : null),
    iconUrl,
    imageKey: iconUrl ? null : "sample_frame",
    rawItem: item,
  };
};

/**
 * Execute request attempting local 8084 server first, then emulator host, then API_BASE_URL
 */
async function requestWithFallback(path, options = {}) {
  await refreshTokenCache().catch(() => {});
  const token = await getBearerToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const candidates = [
    // 1. Configured local port 8084
    `${LOCAL_AVATAR_BASE_URL}${path}`,
    // 2. Android emulator host loopback if running on Android
    ...(Platform.OS === "android" ? [`${ANDROID_EMULATOR_BASE_URL}${path}`] : []),
    // 3. Fallback to API_BASE_URL
    ...(API_BASE_URL && !API_BASE_URL.includes("localhost:8084") ? [`${API_BASE_URL}${path}`] : []),
  ];

  let lastError = null;
  for (const url of candidates) {
    try {
      console.log(`${LOG_TAG} Attempting GET ${url}`);
      const res = await axios.get(url, {
        headers,
        timeout: options.timeout || 3500,
      });
      console.log(`${LOG_TAG} Success from ${url}:`, res.status);
      return res.data;
    } catch (err) {
      console.log(
        `${LOG_TAG} GET ${url} failed with status:`,
        err?.response?.status ?? err?.code ?? err?.message
      );
      lastError = err;
      // If server responded with 401 or 403, auth is rejected
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        throw err;
      }
    }
  }

  throw lastError;
}

/**
 * GET /api/dynamic-avatars/type/{type}
 * Valid types: AVATAR_FRAME, CP_AVATAR_FRAME, DYNAMIC_AVATAR
 */
export const getDynamicAvatarsByType = async (type) => {
  const normalizedType = String(type || "AVATAR_FRAME").toUpperCase();
  const path = `/api/dynamic-avatars/type/${encodeURIComponent(normalizedType)}`;
  try {
    const data = await requestWithFallback(path);
    console.log(`${LOG_TAG} Dynamic avatars (${normalizedType}) response:`, data);
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.items)
      ? data.items
      : [];
    return list.map((item) => normalizeDynamicAvatar(item, normalizedType)).filter(Boolean);
  } catch (error) {
    console.warn(
      `${LOG_TAG} getDynamicAvatarsByType (${normalizedType}) error:`,
      error?.response?.data ?? error?.message ?? error
    );
    throw error;
  }
};

/**
 * GET /api/store/avatar/inventory — user's owned avatars & frames
 */
export const getAvatarInventory = async () => {
  const path = "/api/store/avatar/inventory";
  try {
    const data = await requestWithFallback(path);
    console.log(`${LOG_TAG} Avatar inventory response:`, data);
    return data;
  } catch (error) {
    console.warn(
      `${LOG_TAG} getAvatarInventory error:`,
      error?.response?.data ?? error?.message ?? error
    );
    throw error;
  }
};
