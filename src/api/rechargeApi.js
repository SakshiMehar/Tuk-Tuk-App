import API, { authRequestConfig, refreshTokenCache } from "./axios";

/** GET /api/app/offline-recharge/agent — assigned recharge agent details */
export const getOfflineRechargeAgent = async ({ countryName, country } = {}) => {
  await refreshTokenCache();
  const resolved = String(countryName || country || "").trim();
  const params = resolved ? { countryName: resolved, country: resolved } : undefined;
  const response = await API.get("/api/app/offline-recharge/agent", {
    ...(await authRequestConfig()),
    ...(params ? { params } : {}),
  });
  return response.data;
};
