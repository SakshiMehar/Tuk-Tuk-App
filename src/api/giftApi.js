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

/** @deprecated Use getPartyGiftCatalog for party room tabs */
export const getGiftCatalog = async (category) => {
  const path = "/api/app/gifts/catalog";
  const params = category ? { category: String(category) } : undefined;
  logRequest("GET", path, params);
  try {
    const { headers } = await buildAuthedConfig("gifts/catalog");
    const response = await API.get(path, { headers, params });
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
export const buyGift = async ({ giftCode, quantity = 1 }) => {
  const path = "/api/app/gifts/buy";
  const body = {
    giftCode: String(giftCode),
    quantity: Math.max(1, Number(quantity) || 1),
  };
  if (!body.giftCode) {
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

/** POST /api/app/gifts/room/send — send gift in a party room (from backpack inventory) */
export const sendGiftInRoom = async ({
  roomId,
  receiverId,
  giftCode,
  quantity = 1,
}) => {
  const path = "/api/app/gifts/room/send";
  const body = {
    roomId: String(roomId),
    receiverId: Number(receiverId),
    giftCode: String(giftCode),
    quantity: Math.max(1, Number(quantity) || 1),
  };

  if (!body.roomId) throw new Error("Room is not ready.");
  if (!body.giftCode) throw new Error("Gift is missing.");
  if (!Number.isFinite(body.receiverId) || body.receiverId <= 0) {
    throw new Error("Choose who receives this gift.");
  }

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

/** @deprecated Use sendGiftInRoom for party room backpack sends */
export const giveGift = async ({ giftCode, receiverId, quantity = 1 }) => {
  const path = "/api/app/gifts/give";
  const body = {
    giftCode: String(giftCode),
    receiverId: Number(receiverId),
    quantity: Math.max(1, Number(quantity) || 1),
  };
  logRequest("POST", path, body);
  try {
    const { token, headers } = await buildAuthedConfig("gifts/give");
    const response = await API.post(path, { ...body, token }, { headers });
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};
