import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const partyApi = {
  getExploreRooms: (params = {}) => {
    return apiClient.get(ENDPOINTS.PARTY.ROOM_LIST, { params });
  },

  getCategories: () => {
    return apiClient.get(ENDPOINTS.PARTY.ROOM_CATEGORIES);
  },
};

export default partyApi;
