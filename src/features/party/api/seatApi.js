import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const seatApi = {
  getSeats: (roomId) => {
    return apiClient.get(ENDPOINTS.PARTY.SEATS(roomId));
  },

  takeSeat: (roomId, seatIndex) => {
    return apiClient.post(ENDPOINTS.PARTY.TAKE_SEAT(roomId, seatIndex), {});
  },

  leaveSeat: (roomId, seatIndex) => {
    return apiClient.post(ENDPOINTS.PARTY.LEAVE_SEAT(roomId, seatIndex), {});
  },

  muteSeat: (roomId, seatIndex, isMuted) => {
    return apiClient.post(ENDPOINTS.PARTY.MUTE_SEAT(roomId, seatIndex), { isMuted });
  },

  sendHeartbeat: (roomId) => {
    return apiClient.post(ENDPOINTS.PARTY.SEAT_HEARTBEAT(roomId), {});
  },
};

export default seatApi;
