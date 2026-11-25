import API, { authRequestConfig } from './axios';
import { partyApi as featurePartyApi } from '../features/party/api/partyApi';

export const getRoomRecommendations = async () => {
  return featurePartyApi.getRoomRecommendations();
};

export const getRecentlyRooms = async () => {
  return featurePartyApi.getRecentlyRooms();
};

export const getFollowingRooms = async () => {
  return featurePartyApi.getFollowingRooms();
};

export const getManagedRooms = async () => {
  return featurePartyApi.getManagedRooms();
};

export const getRoomById = async (roomId: string | number) => {
  return featurePartyApi.getRoomById(roomId);
};

export const createRoom = async (body: any = {}) => {
  return featurePartyApi.createRoom(body);
};

export const joinRoom = async (roomId: string | number) => {
  return featurePartyApi.joinRoom(roomId);
};

export const exitRoom = async (roomId: string | number) => {
  return featurePartyApi.exitRoom(roomId);
};

export const getRoomUserCount = async (roomId: string | number): Promise<number | null> => {
  if (!roomId) return null;
  try {
    const res = await API.get(`/api/public/rooms/${roomId}/count`);
    const count =
      res?.data?.onlineCount ??
      res?.data?.count ??
      res?.data?.userCount ??
      res?.data?.data?.onlineCount ??
      res?.data?.data?.count ??
      res?.data;
    if (typeof count === 'number' && Number.isFinite(count)) return count;
  } catch {
    // fallback
  }
  return null;
};

export const getPartyRanking = async (period: string = 'daily') => {
  try {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.get(`/api/app/party/ranking?period=${encodeURIComponent(period)}`, config);
    return res.data;
  } catch {
    return [];
  }
};

export const getPartyFamilies = async () => {
  try {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.get('/api/app/party/families', config);
    return res.data;
  } catch {
    return [];
  }
};

export const searchRooms = async (query: string) => {
  try {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.get(`/api/v1/tuktuk/rooms/search?q=${encodeURIComponent(query)}`, config);
    return res.data;
  } catch {
    return [];
  }
};

export const partyApi = {
  ...featurePartyApi,
  getRoomUserCount,
  getPartyRanking,
  getPartyFamilies,
  searchRooms,
};

export default partyApi;
