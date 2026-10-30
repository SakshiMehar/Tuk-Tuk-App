import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const walletApi = {
  getBalance: () => apiClient.get(ENDPOINTS.WALLET.BALANCE),
  getPackages: () => apiClient.get(ENDPOINTS.WALLET.RECHARGE_PACKAGES),
  createOrder: (packageId) => apiClient.post(ENDPOINTS.WALLET.CREATE_ORDER, { packageId }),
};

export default walletApi;
