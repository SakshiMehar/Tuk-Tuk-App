import { getProfileVisits } from '../api/userApi';
import { getFollowing, getFollowers } from '../api/relationshipApi';

const countFromResponse = (data: any, list: any[] = []): number => {
  if (typeof data === 'number') return data;
  if (!data || typeof data !== 'object') {
    return Array.isArray(list) ? list.length : 0;
  }
  if (typeof data.totalElements === 'number') return data.totalElements;
  if (typeof data.total === 'number') return data.total;
  if (typeof data.count === 'number') return data.count;
  if (typeof data.totalCount === 'number') return data.totalCount;

  const nested = data.profile ?? data.data ?? data.result ?? null;
  if (nested && nested !== data && typeof nested === 'object') {
    const nestedCount = countFromResponse(nested, list);
    if (nestedCount > 0) return nestedCount;
  }
  return Array.isArray(list) ? list.length : 0;
};

const extractList = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  return data?.content ?? data?.users ?? data?.data ?? data?.items ?? [];
};

export const loadProfileStats = async () => {
  const [followingRes, followersRes, visitsRes] = await Promise.allSettled([
    getFollowing().catch(() => 0),
    getFollowers().catch(() => 0),
    getProfileVisits(50).catch(() => []),
  ]);

  const followingData = followingRes.status === 'fulfilled' ? followingRes.value : 0;
  const followersData = followersRes.status === 'fulfilled' ? followersRes.value : 0;
  const visitsData = visitsRes.status === 'fulfilled' ? visitsRes.value : [];

  const followingList = extractList(followingData);
  const followersList = extractList(followersData);
  const visitsList = extractList(visitsData);

  return {
    followingCount: countFromResponse(followingData, followingList),
    followersCount: countFromResponse(followersData, followersList),
    visitorCount: visitsList.length,
  };
};

export default {
  loadProfileStats,
};
