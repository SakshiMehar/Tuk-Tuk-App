import API, {
  authRequestConfig,
  getBearerToken,
  refreshTokenCache,
} from "./axios";

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

// 1. Next random user card
// GET /api/app/blind-match/next
export const getNextBlindMatch = async () => {
  const { token, headers } = await buildAuthedConfig("blind-match/next");
  const url = `/api/app/blind-match/next?token=${encodeURIComponent(token)}`;
  
  const response = await API.get(url, { headers });
  
  return response.data;
};

// 2. Like or skip current card
// POST /api/app/blind-match/action  { targetUserId, action }
// action: "LIKE" | "SKIP"
export const sendBlindMatchAction = async (targetUserId, action) => {
  const { token, headers } = await buildAuthedConfig(`blind-match/action ${action}`);
  const body = { targetUserId, action, token };
  
  const response = await API.post("/api/app/blind-match/action", body, { headers });
  
  return response.data;
};

// 3. Open direct chat with current card
// POST /api/app/blind-match/chat  { targetUserId }
export const openBlindMatchChat = async (targetUserId) => {
  const { token, headers } = await buildAuthedConfig("blind-match/chat");
  const body = { targetUserId, token };
  
  const response = await API.post("/api/app/blind-match/chat", body, { headers });
  
  return response.data;
};
