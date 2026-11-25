import API, { authRequestConfig } from '@/api/axios';

export const partyApi = {
  getRoomRecommendations: async () => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.get('/api/v1/tuktuk/rooms/recommendations', config);
    return res.data;
  },

  getRecentlyRooms: async () => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.get('/api/v1/tuktuk/rooms/recently', config);
    return res.data;
  },

  getFollowingRooms: async () => {
    const config = await authRequestConfig().catch(() => ({}));
    try {
      const res = await API.get('/api/app/room-follows/my', config);
      return res.data;
    } catch {
      const res = await API.get('/api/v1/tuktuk/rooms/following', config);
      return res.data;
    }
  },

  getManagedRooms: async () => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.get('/api/v1/tuktuk/rooms/managed', config);
    return res.data;
  },

  getRoomById: async (roomId) => {
    const cleanId = String(roomId ?? '').trim();
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.get(`/api/v1/tuktuk/rooms/${encodeURIComponent(cleanId)}`, config);
    return res.data;
  },

  createRoom: async (body = {}) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.post('/api/v1/tuktuk/rooms/create', body, config);
    return res.data;
  },

  joinRoom: async (roomId) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.post(`/api/v1/tuktuk/rooms/${roomId}/join`, {}, config);
    return res.data;
  },

  exitRoom: async (roomId) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.post(`/api/v1/tuktuk/rooms/${roomId}/exit`, {}, config);
    return res.data;
  },

  joinRandomParty: async (body = {}) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.post('/api/v1/tuktuk/rooms/party', body, config);
    return res.data;
  },

  getVoiceToken: async (roomId, uid, isSpeaker = true) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.get(
      `/api/v1/tuktuk/rooms/${roomId}/voice-token?uid=${uid}&isSpeaker=${isSpeaker}`,
      config
    );
    return res.data;
  },

  claimSeat: async (roomId, seatNumber, profile = {}) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.post(
      `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/claim`,
      profile,
      config
    );
    return res.data;
  },

  leaveSeat: async (roomId, seatNumber) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.post(
      `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/leave`,
      {},
      config
    );
    return res.data;
  },

  toggleSeatMute: async (roomId, seatNumber, isMuted) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.post(
      `/api/v1/tuktuk/rooms/${roomId}/seat/${seatNumber}/toggle-mute?isMuted=${isMuted}`,
      {},
      config
    );
    return res.data;
  },

  followRoom: async (roomId) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.post(`/api/v1/tuktuk/rooms/${roomId}/follow`, {}, config);
    return res.data;
  },

  unfollowRoom: async (roomId) => {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.post(`/api/v1/tuktuk/rooms/${roomId}/unfollow`, {}, config);
    return res.data;
  },

  getExploreRooms: async (params = {}) => {
    return partyApi.getRoomRecommendations();
  },

  getCategories: async () => {
    return [
      { id: 'all', name: 'All' },
      { id: 'music', name: 'Music' },
      { id: 'chat', name: 'Chat' },
      { id: 'gaming', name: 'Gaming' },
      { id: 'singing', name: 'Singing' },
    ];
  },
};

export default partyApi;
