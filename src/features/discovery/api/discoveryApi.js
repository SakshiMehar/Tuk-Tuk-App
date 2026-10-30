import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const discoveryApi = {
  getNearby: (lat, lng) => apiClient.get(ENDPOINTS.HOME.NEARBY, { params: { lat, lng } }),
  getExplore: () => apiClient.get(ENDPOINTS.HOME.EXPLORE),
};

export default discoveryApi;
