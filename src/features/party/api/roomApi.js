import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const roomApi = {
  getRoomDetails: (roomId) => {
    return apiClient.get(ENDPOINTS.PARTY.ROOM_DETAILS(roomId));
  },

  createRoom: (roomData) => {
    return apiClient.post(ENDPOINTS.PARTY.CREATE_ROOM, roomData);
  },

  joinRoom: (roomId) => {
    return apiClient.post(ENDPOINTS.PARTY.JOIN_ROOM(roomId), {});
  },

  leaveRoom: (roomId) => {
    return apiClient.post(ENDPOINTS.PARTY.LEAVE_ROOM(roomId), {});
  },

  followRoom: (roomId) => {
    return apiClient.post(ENDPOINTS.PARTY.FOLLOW_ROOM(roomId), {});
  },
};

export default roomApi;
