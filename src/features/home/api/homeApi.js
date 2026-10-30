import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const homeApi = {
  getFeed: () => apiClient.get(ENDPOINTS.HOME.FEED),
  getRecommendedUsers: () => apiClient.get(ENDPOINTS.HOME.RECOMMENDED),
  getLiveUsers: () => apiClient.get(ENDPOINTS.HOME.LIVE_USERS),
};

export default homeApi;
