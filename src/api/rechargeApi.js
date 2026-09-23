import API, { authRequestConfig, refreshTokenCache } from "./axios";

/** GET /api/app/diamond-stock-manager/diamond-stock-manager — purchasable diamond packages. */
export const getDiamondStockManager = async () => {
  await refreshTokenCache();
  const response = await API.get(
    "/api/app/diamond-stock-manager/diamond-stock-manager",
    await authRequestConfig()
  );
  return response.data;
};
