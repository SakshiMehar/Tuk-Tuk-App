import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const giftApi = {
  getCatalog: () => apiClient.get(ENDPOINTS.GIFTS.CATALOG),
  sendRoomGift: (data) => apiClient.post(ENDPOINTS.GIFTS.SEND_ROOM_GIFT, data),
  sendUserGift: (data) => apiClient.post(ENDPOINTS.GIFTS.SEND_USER_GIFT, data),
};

export default giftApi;
