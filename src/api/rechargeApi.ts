import API, { authRequestConfig, refreshTokenCache } from './axios';

/** GET /api/app/diamond-stock-manager/diamond-stock-manager — purchasable diamond packages. */
export const getDiamondStockManager = async (): Promise<any> => {
  await refreshTokenCache();
  const config = await authRequestConfig().catch(() => ({}));
  const response = await API.get(
    '/api/app/diamond-stock-manager/diamond-stock-manager',
    config
  );
  return response.data;
};

export default { getDiamondStockManager };
