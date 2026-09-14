import API, {
  authRequestConfig,
  getBearerToken,
  refreshTokenCache,
} from "./axios";

const LOG_TAG = "[GiftAPI]";

const logRequest = (method, path, payload) => {
  console.log(`${LOG_TAG} → ${method} ${path}`, payload ?? "");
};

const logResponse = (method, path, data) => {
  console.log(`${LOG_TAG} ← ${method} ${path}`, data);
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

/** POST /api/app/gifts/buy — deduct diamonds, add to inventory */
export const buyGift = async ({ giftCode, giftId, quantity = 1 }) => {
  const path = "/api/app/gifts/buy";
  const qty = Math.max(1, Number(quantity) || 1);
  const numericGiftId = Number(giftId);
  const body = { quantity: qty };

  if (Number.isFinite(numericGiftId) && numericGiftId > 0) {
    body.giftId = numericGiftId;
  } else if (giftCode) {
    body.giftCode = String(giftCode);
  }

  if (!body.giftCode && !body.giftId) {
    throw new Error("Gift is missing.");
  }
  logRequest("POST", path, body);
  try {
    const { token, headers } = await buildAuthedConfig("gifts/buy");
    const response = await API.post(path, { ...body, token }, { headers });
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
