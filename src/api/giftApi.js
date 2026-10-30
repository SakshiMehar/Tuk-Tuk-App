import axios from "axios";
import { Platform } from "react-native";
import API, {
  authRequestConfig,
  getBearerToken,
  refreshTokenCache,
} from "./axios";

const LOG_TAG = "[GiftAPI]";

const logRequest = (method, path, payload) => {
};

const logResponse = (method, path, data) => {
};

const logError = (method, path, error) => {
  console.error(
    `${LOG_TAG} ✗ ${method} ${path}`,
    error?.response?.data ?? error?.message ?? error
  );
};

const buildAuthedConfig = async (label) => {
  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) {
    throw new Error("Please log in again to continue.");
  }
  const authConfig = await authRequestConfig();
  return {
    token,
    headers: {
      ...authConfig.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

/** GET /api/app/gifts/catalog — optional ?category=gift|pk|special|vip|... */
export const getGiftCatalog = async (category) => {
  const path = category
    ? `/api/app/gifts/catalog?category=${encodeURIComponent(category)}`
    : "/api/app/gifts/catalog";
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig("gifts/catalog");
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** GET /api/app/gifts/party/catalog — all party gift tabs in one response */
export const getPartyGiftCatalog = async () => {
  const path = "/api/app/gifts/party/catalog";
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig("gifts/party/catalog");
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** GET /api/app/gifts/inventory — user's backpack */
export const getGiftInventory = async () => {
  const path = "/api/app/gifts/inventory";
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig("gifts/inventory");
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

export const INTIMACY_INVENTORY_TYPES = {
  RING: "RING",
  JEWELRY: "JEWELRY",
  LOVE_ZONE: "LOVE_ZONE",
  MIC_LINK: "MIC_LINK",
  SPECIAL_CARD: "SPECIAL_CARD",
  CP_CARD: "CP_CARD",
  INTIMACY_CARD: "INTIMACY_CARD",
};

/**
 * GET http://localhost:8084/api/app/gifts/inventory/intimecy/{type}?page=0&size=20
 * Types: RING, JEWELRY, LOVE_ZONE, MIC_LINK, SPECIAL_CARD, CP_CARD, INTIMACY_CARD
 */
export const getIntimacyBackpackInventory = async (type = "RING", page = 0, size = 20) => {
  const normalizedType = String(type || "RING").toUpperCase();
  const subPath = `/api/app/gifts/inventory/intimecy/${encodeURIComponent(normalizedType)}?page=${page}&size=${size}`;
  logRequest("GET", subPath);

  const LOCAL_BASE_URL = "http://localhost:8084";
  const ANDROID_EMU_BASE_URL = "http://10.0.2.2:8084";

  await refreshTokenCache().catch(() => {});
  const token = await getBearerToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const candidates = [
    `${LOCAL_BASE_URL}${subPath}`,
    ...(Platform.OS === "android" ? [`${ANDROID_EMU_BASE_URL}${subPath}`] : []),
    subPath,
  ];

  let lastError = null;
  for (const url of candidates) {
    try {
      if (url.startsWith("http")) {
        const res = await axios.get(url, { headers, timeout: 3500 });
        logResponse("GET", url, res.data);
        return res.data;
      } else {
        const { headers: authHeaders } = await buildAuthedConfig(`gifts/inventory/intimecy/${type}`);
        const res = await API.get(url, { headers: authHeaders });
        logResponse("GET", url, res.data);
        return res.data;
      }
    } catch (err) {
      lastError = err;
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        throw err;
      }
    }
  }

  logError("GET", subPath, lastError);
  throw lastError;
};

/** POST /api/app/gifts/buy — deduct diamonds, add to inventory */
export const buyGift = async ({ giftCode, giftId, quantity = 1 }) => {
  const path = "/api/app/gifts/buy";
  const qty = Math.max(1, Number(quantity) || 1);
  const numericGiftId = Number(giftId);
  const body = { quantity: qty };

  // Send both when available — the confirmed-working request shape includes
  // giftId AND giftCode together; giftId alone was returning "Gift not found".
  if (Number.isFinite(numericGiftId) && numericGiftId > 0) {
    body.giftId = numericGiftId;
  }
  if (giftCode) {
    body.giftCode = String(giftCode);
  }

  if (!body.giftCode && !body.giftId) {
    throw new Error("Gift is missing.");
  }
  logRequest("POST", path, body);
  try {
    const { headers } = await buildAuthedConfig("gifts/buy");
    const response = await API.post(path, body, { headers });
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    const status = error?.status ?? error?.response?.status;
    const apiError = error?.responseData?.error ?? error?.message;
    if (status === 400) {
      throw new Error(
        apiError === "Insufficient diamonds"
          ? "Not enough diamonds to buy this gift."
          : apiError || "Could not buy this gift."
      );
    }
    if (status === 500) {
      throw new Error("Server error while buying gift. Please try again.");
    }
    throw error;
  }
};

const buildGiveGiftBody = ({
  roomId,
  receiverId,
  giftCode,
  giftId,
  quantity = 1,
}) => {
  const body = {
    receiverId: Number(receiverId),
    quantity: Math.max(1, Number(quantity) || 1),
  };
  if (roomId) body.roomId = String(roomId);
  const numericGiftId = Number(giftId);
  if (Number.isFinite(numericGiftId) && numericGiftId > 0) {
    body.giftId = numericGiftId;
  } else if (giftCode) {
    body.giftCode = String(giftCode);
  }

  if (!body.giftCode && !body.giftId) throw new Error("Gift is missing.");
  if (!Number.isFinite(body.receiverId) || body.receiverId <= 0) {
    throw new Error("Choose who receives this gift.");
  }
  return body;
};

/** POST /api/app/gifts/give — send owned gift to another user */
export const giveGift = async (params) => {
  const path = "/api/app/gifts/give";
  const body = buildGiveGiftBody(params);
  logRequest("POST", path, body);
  try {
    const { headers } = await buildAuthedConfig("gifts/give");
    const response = await API.post(path, body, { headers });
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** POST /api/app/gifts/room/send — alias of /give for party rooms */
export const sendGiftInRoom = async (params) => {
  const path = "/api/app/gifts/room/send";
  const body = buildGiveGiftBody(params);
  if (!body.roomId) throw new Error("Room is not ready.");

  logRequest("POST", path, body);
  try {
    const { headers } = await buildAuthedConfig("gifts/room/send");
    const response = await API.post(path, body, { headers });
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** POST /api/app/gifts/send — legacy gift send (giftId only) */
export const sendGiftLegacy = async ({ receiverId, giftId, roomId }) => {
  const path = "/api/app/gifts/send";
  const body = {
    receiverId: Number(receiverId),
    giftId: Number(giftId),
  };
  if (roomId) body.roomId = String(roomId);
  if (!Number.isFinite(body.receiverId) || body.receiverId <= 0) {
    throw new Error("Choose who receives this gift.");
  }
  if (!Number.isFinite(body.giftId) || body.giftId <= 0) {
    throw new Error("Gift is missing.");
  }
  logRequest("POST", path, body);
  try {
    const { headers } = await buildAuthedConfig("gifts/send");
    const response = await API.post(path, body, { headers });
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** GET /api/app/gifts/gift-receive — gifts received by the current user */
export const getGiftsReceived = async () => {
  const path = "/api/app/gifts/gift-receive";
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig("gifts/gift-receive");
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** GET /api/app/gifts/gift-send — gifts sent by the current user */
export const getGiftsSent = async () => {
  const path = "/api/app/gifts/gift-send";
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig("gifts/gift-send");
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** GET /api/app/rewards/listen/status — daily listening progress and reward tier status */
export const getListenRewardStatus = async () => {
  const path = "/api/app/rewards/listen/status";
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig("rewards/listen/status");
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** POST /api/app/rewards/listen/claim — claim unlocked daily listen reward tier */
export const claimListenReward = async ({ tier, roomId }) => {
  const path = "/api/app/rewards/listen/claim";
  const body = {
    tier: Number(tier),
    ...(roomId ? { roomId: String(roomId) } : {}),
  };
  logRequest("POST", path, body);
  try {
    const { headers } = await buildAuthedConfig("rewards/listen/claim");
    const response = await API.post(path, body, { headers });
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** POST /api/app/rewards/listen/progress — record incremental listening progress */
export const recordListenRewardProgress = async ({ roomId, deltaSeconds }) => {
  const path = "/api/app/rewards/listen/progress";
  const body = {
    roomId: String(roomId),
    deltaSeconds: Number(deltaSeconds),
  };
  try {
    const { headers } = await buildAuthedConfig("rewards/listen/progress");
    const response = await API.post(path, body, { headers });
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** GET /api/gifts/category/{category} — fetch gifts by category (ring, jewelry, love_zone, mic_link, special_card, cp_card, intimacy_card) */
export const getGiftsByCategory = async (category) => {
  const normalizedCategory = encodeURIComponent(String(category ?? "").trim().toLowerCase());
  const path = normalizedCategory
    ? `/api/gifts/category/${normalizedCategory}`
    : "/api/gifts";
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig(`gifts/category/${category}`);
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** GET /api/gifts — fetch all gifts from system */
export const getAllGifts = async () => {
  const path = "/api/gifts";
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig("gifts/all");
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};


