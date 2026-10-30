import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const profileApi = {
  getMe: () => apiClient.get(ENDPOINTS.PROFILE.ME),
  getUser: (id) => apiClient.get(ENDPOINTS.PROFILE.USER_DETAILS(id)),
  updateProfile: (data) => apiClient.put(ENDPOINTS.PROFILE.UPDATE, data),
  followUser: (id) => apiClient.post(ENDPOINTS.PROFILE.FOLLOW(id), {}),
  unfollowUser: (id) => apiClient.post(ENDPOINTS.PROFILE.UNFOLLOW(id), {}),
};

export default profileApi;
