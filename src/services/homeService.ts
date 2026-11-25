import API, { authRequestConfig } from '../api/axios';
import { homeApi } from '../features/home/api/homeApi';

export interface RecommendedUser {
  id: string;
  userId?: string;
  name: string;
  avatar: string | null;
  isOnline: boolean;
  online: boolean;
  status?: string;
  vipProfileFrameUrl?: string | null;
  verifiedBadgeUrl?: string | null;
  level?: number;
}

const MOCK_RECOMMENDED_USERS: RecommendedUser[] = [
  {
    id: 'u1',
    userId: 'u1',
    name: 'Aanya ✨',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    isOnline: true,
    online: true,
    level: 12,
  },
  {
    id: 'u2',
    userId: 'u2',
    name: 'Kabir 🎧',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    isOnline: true,
    online: true,
    level: 8,
  },
  {
    id: 'u3',
    userId: 'u3',
    name: 'Simran 💫',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    isOnline: false,
    online: false,
    level: 15,
  },
  {
    id: 'u4',
    userId: 'u4',
    name: 'Dev 🎸',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    isOnline: true,
    online: true,
    level: 9,
  },
  {
    id: 'u5',
    userId: 'u5',
    name: 'Pooja 🌺',
    avatar: 'https://randomuser.me/api/portraits/women/24.jpg',
    isOnline: false,
    online: false,
    level: 6,
  },
];

export const getRecommendedUsers = async (): Promise<RecommendedUser[]> => {
  try {
    const config = await authRequestConfig().catch(() => ({}));
    const res = await API.get('/api/home/init', config);
    const data = res?.data;
    const rawList =
      data?.recommendedUsers ??
      data?.data?.recommendedUsers ??
      data?.recommended_users ??
      data?.users ??
      [];

    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((u: any, idx: number) => ({
        id: String(u.id || u.userId || `rec_${idx}`),
        userId: String(u.userId || u.id || `rec_${idx}`),
        name: u.name || u.username || 'User',
        avatar: u.avatar || u.avatarUrl || u.profileImage || u.profileImageUrl || null,
        isOnline: Boolean(u.isOnline || u.online || u.status === 'ONLINE'),
        online: Boolean(u.isOnline || u.online || u.status === 'ONLINE'),
        status: u.isOnline || u.online ? 'ONLINE' : 'OFFLINE',
        vipProfileFrameUrl: u.vipProfileFrameUrl || null,
        verifiedBadgeUrl: u.verifiedBadgeUrl || null,
        level: u.level || 1,
      }));
    }
  } catch (err) {
    console.warn('[homeService] getRecommendedUsers fetch error:', err);
  }

  return MOCK_RECOMMENDED_USERS;
};

export default {
  getRecommendedUsers,
};
