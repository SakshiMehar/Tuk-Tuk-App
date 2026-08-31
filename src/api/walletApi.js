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

// GET /api/app/wallet/me
export const getWalletMe = async () => {
  const { headers } = await buildAuthedConfig("wallet/me");
  
  const response = await API.get("/api/app/wallet/me", { headers });
  
  
  return response.data;
};

// GET /api/app/wallet/transactions?page=&size=
export const getWalletTransactions = async (page = 0, size = 20) => {
  const { headers } = await buildAuthedConfig("wallet/transactions");
  const url = `/api/app/wallet/transactions?page=${page}&size=${size}`;
  
  const response = await API.get(url, { headers });
  
  
  return response.data;
};
