import {
  getRoomRecommendations,
  getRecentlyRooms,
  getFollowingRooms,
  getManagedRooms,
  getRoomById,
  getPartyRanking as getPartyRankingApi,
  getPartyFamilies as getPartyFamiliesApi,
  createRoom as createRoomApi,
} from '../api/partyApi';
import exploreData from '../data/partyExploreData.json';

const firstText = (...values: any[]) =>
  values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? null;

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

export const parseRoomsResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  return (
    data?.content ??
    data?.data ??
    data?.items ??
    data?.rooms ??
    data?.recommendations ??
    data?.recently ??
    data?.following ??
    data?.managed ??
    data?.follows ??
    []
  );
};

export const normalizeRoom = (rawRoom: any): any => {
  if (!rawRoom) return null;
  const room = rawRoom?.room ?? rawRoom?.data ?? rawRoom ?? {};
  const id = String(firstValue(room?.roomId, room?.id, rawRoom?.roomId, rawRoom?.id, rawRoom?._id) || '');
  const name =
    firstText(room?.name, room?.title, room?.roomName, rawRoom?.name, rawRoom?.roomName) ??
    'Voice Room';
  const title =
    firstText(room?.title, room?.name, room?.roomName, rawRoom?.title, rawRoom?.name) ??
    name;
  const roomTypeLabel =
    firstText(
      room?.roomTypeLabel,
      room?.roomType,
      room?.type,
      rawRoom?.roomTypeLabel,
      room?.category ? String(room.category).toUpperCase() : null
    ) ?? 'Party';

  const rawCat = firstText(room?.category, rawRoom?.category, roomTypeLabel) ?? 'recommend';
  const category = rawCat.toLowerCase().replace(/\s+/g, '_');

  const rawImage = firstText(
    room?.coverImage,
    room?.profileImageUrl,
    room?.imageUrl,
    room?.roomImageUrl,
    room?.coverUrl,
    room?.thumbnail,
    rawRoom?.coverImage,
    rawRoom?.profileImageUrl,
    rawRoom?.imageUrl,
    rawRoom?.roomImageUrl,
    rawRoom?.thumbnail,
    typeof room?.image === 'string' ? room.image : null,
    room?.image?.uri,
    typeof rawRoom?.image === 'string' ? rawRoom.image : null
  );

  const thumbnail = rawImage || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200';
  const userCount = Number(
    firstValue(
      room?.userCount,
      room?.listenerCount,
      room?.memberCount,
      room?.onlineCount,
      rawRoom?.userCount,
      rawRoom?.listenerCount,
      rawRoom?.memberCount,
      0
    )
  );

  const countryCode = firstText(room?.countryCode, rawRoom?.countryCode) ?? null;
  const region = firstText(room?.region, rawRoom?.region, countryCode) ?? 'Global';
  const badges = Array.isArray(room?.badges) ? room.badges : Array.isArray(rawRoom?.badges) ? rawRoom.badges : [];
  const statusIcons = Array.isArray(room?.statusIcons) ? room.statusIcons : Array.isArray(rawRoom?.statusIcons) ? rawRoom.statusIcons : [];
  const hasChat = Boolean(room?.hasChat ?? rawRoom?.hasChat ?? true);
  const isOfficial = Boolean(
    room?.isOfficial ?? room?.official ?? rawRoom?.isOfficial ?? rawRoom?.official ?? category === 'official'
  );

  return {
    ...rawRoom,
    ...room,
    id,
    roomId: id,
    name,
    title,
    roomTypeLabel,
    category,
    thumbnail,
    imageUrl: thumbnail,
    profileImageUrl: thumbnail,
    coverImage: thumbnail,
    userCount,
    listenerCount: userCount,
    memberCount: userCount,
    countryCode,
    region,
    badges,
    statusIcons,
    hasChat,
    isOfficial,
  };
};

export const loadRoomRecommendations = async (): Promise<any[]> => {
  try {
    const raw = await getRoomRecommendations();
    const list = parseRoomsResponse(raw);
    if (Array.isArray(list) && list.length > 0) {
      return list.map(normalizeRoom).filter(Boolean);
    }
  } catch (err) {
    console.warn('[partyService] loadRoomRecommendations error:', err);
  }

  // Fallback to exploreData rooms
  if (Array.isArray((exploreData as any).rooms)) {
    return (exploreData as any).rooms.map(normalizeRoom).filter(Boolean);
  }
  return [];
};

export const loadRecentlyRooms = async (): Promise<any[]> => {
  try {
    const raw = await getRecentlyRooms();
    const list = parseRoomsResponse(raw);
    if (Array.isArray(list) && list.length > 0) {
      return list.map(normalizeRoom).filter(Boolean);
    }
  } catch (err) {
    console.warn('[partyService] loadRecentlyRooms error:', err);
  }

  if (Array.isArray((exploreData as any).recentlyRooms)) {
    return (exploreData as any).recentlyRooms.map(normalizeRoom).filter(Boolean);
  }
  return [];
};

export const loadFollowingRooms = async (): Promise<any[]> => {
  try {
    const raw = await getFollowingRooms();
    const list = parseRoomsResponse(raw);
    if (Array.isArray(list) && list.length > 0) {
      return list.map(normalizeRoom).filter(Boolean);
    }
  } catch (err) {
    console.warn('[partyService] loadFollowingRooms error:', err);
  }
  return [];
};

export const loadManagedRooms = async (): Promise<any[]> => {
  try {
    const raw = await getManagedRooms();
    const list = parseRoomsResponse(raw);
    if (Array.isArray(list) && list.length > 0) {
      return list.map(normalizeRoom).filter(Boolean);
    }
  } catch (err) {
    console.warn('[partyService] loadManagedRooms error:', err);
  }
  return [];
};

export const searchRoomById = async (roomId: string) => {
  const query = String(roomId || '').trim();
  if (!query) {
    return { success: false, status: 'EMPTY_QUERY', message: 'Please enter a Room ID', room: null };
  }

  try {
    const data = await getRoomById(query);
    if (!data) {
      return { success: false, status: 'ROOM_NOT_FOUND', message: 'Room is not live or does not exist', room: null };
    }

    if (
      data?.status === 'ROOM_NOT_LIVE' ||
      data?.status === 'NOT_LIVE' ||
      String(data?.message || '').toLowerCase().includes('not live') ||
      String(data?.message || '').toLowerCase().includes('does not exist')
    ) {
      return {
        success: false,
        status: data?.status || 'ROOM_NOT_LIVE',
        message: data?.message || 'Room is not live or does not exist',
        room: null,
      };
    }

    const raw = data?.data ?? data?.room ?? data;
    if (raw && (raw.id || raw.roomId || raw.name || raw.title)) {
      return {
        success: true,
        status: 'LIVE',
        message: null,
        room: normalizeRoom(raw),
      };
    }

    return {
      success: false,
      status: data?.status || 'ROOM_NOT_FOUND',
      message: data?.message || 'Room is not live or does not exist',
      room: null,
    };
  } catch (err: any) {
    const resData = err?.response?.data;
    if (resData?.status === 'ROOM_NOT_LIVE' || resData?.message) {
      return {
        success: false,
        status: resData?.status || 'ROOM_NOT_LIVE',
        message: resData?.message || 'Room is not live or does not exist',
        room: null,
      };
    }
    return {
      success: false,
      status: 'ERROR',
      message: err?.message || 'Could not search room. Please try again.',
      room: null,
    };
  }
};

const MOCK_RANKING: Record<string, any[]> = {
  daily: [
    { id: 'r1', rank: 1, name: 'Royal Queen ✨', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', score: '128.5K', level: 25 },
    { id: 'r2', rank: 2, name: 'RockStar 🎸', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', score: '98.2K', level: 19 },
    { id: 'r3', rank: 3, name: 'Angel Eyes 🌸', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', score: '74.6K', level: 16 },
    { id: 'r4', rank: 4, name: 'Thunder Bolt', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', score: '52.1K', level: 12 },
    { id: 'r5', rank: 5, name: 'Golden Heart', avatar: 'https://randomuser.me/api/portraits/women/24.jpg', score: '43.9K', level: 10 },
  ],
  weekly: [
    { id: 'w1', rank: 1, name: 'Diamond King 👑', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', score: '450.2K', level: 32 },
    { id: 'w2', rank: 2, name: 'Royal Queen ✨', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', score: '380.0K', level: 25 },
    { id: 'w3', rank: 3, name: 'Silver Wolf 🐺', avatar: 'https://randomuser.me/api/portraits/men/52.jpg', score: '290.4K', level: 22 },
    { id: 'w4', rank: 4, name: 'RockStar 🎸', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', score: '210.8K', level: 19 },
  ],
  monthly: [
    { id: 'm1', rank: 1, name: 'Diamond King 👑', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', score: '1.8M', level: 32 },
    { id: 'm2', rank: 2, name: 'Royal Queen ✨', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', score: '1.4M', level: 25 },
    { id: 'm3', rank: 3, name: 'Legendary Vibe', avatar: 'https://randomuser.me/api/portraits/men/85.jpg', score: '950K', level: 28 },
  ],
};

export const loadPartyRanking = async (period: string = 'daily'): Promise<any[]> => {
  try {
    const data = await getPartyRankingApi(period);
    const list = Array.isArray(data) ? data : data?.ranking ?? data?.data ?? [];
    if (list.length > 0) {
      return list.map((entry: any, index: number) => ({
        id: String(entry.id || entry.userId || `rank_${index}`),
        rank: entry.rank ?? entry.position ?? index + 1,
        name: entry.name || entry.username || 'User',
        avatar: entry.avatar || entry.avatarUrl || entry.profileImageUrl || null,
        score: entry.score || entry.diamonds || entry.points || 0,
        level: entry.level || null,
        vipProfileFrameUrl: entry.vipProfileFrameUrl || null,
      }));
    }
  } catch (err) {
    console.warn('[partyService] loadPartyRanking error:', err);
  }
  return MOCK_RANKING[period] || MOCK_RANKING.daily;
};

const MOCK_FAMILIES = [
  { id: 'f1', rank: 1, name: 'Kingdom of TukTuk', emoji: '👑', avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200', memberCount: 142, level: 8, score: '8.4M' },
  { id: 'f2', rank: 2, name: 'Vibe Tribe Official', emoji: '🔥', avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200', memberCount: 98, level: 6, score: '5.2M' },
  { id: 'f3', rank: 3, name: 'Night Owls Syndicate', emoji: '🦉', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200', memberCount: 75, level: 5, score: '3.9M' },
  { id: 'f4', rank: 4, name: 'Neon Dreamers', emoji: '⚡', avatar: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200', memberCount: 62, level: 4, score: '2.1M' },
];

export const loadFamilies = async (): Promise<any[]> => {
  try {
    const data = await getPartyFamiliesApi();
    const list = Array.isArray(data) ? data : data?.families ?? data?.data ?? [];
    if (list.length > 0) {
      return list.map((f: any, index: number) => ({
        id: String(f.id || f.familyId || `family_${index}`),
        rank: f.rank ?? f.position ?? index + 1,
        name: f.name || f.familyName || 'Family',
        emoji: f.emoji || '👪',
        avatar: f.avatar || f.avatarUrl || null,
        memberCount: f.memberCount ?? f.members ?? 0,
        level: f.level ?? 1,
        score: f.score ?? f.prosperity ?? 0,
      }));
    }
  } catch (err) {
    console.warn('[partyService] loadFamilies error:', err);
  }
  return MOCK_FAMILIES;
};

export const createPartyRoom = async (payload: any = {}) => {
  return createRoomApi(payload);
};

export default {
  loadRoomRecommendations,
  loadRecentlyRooms,
  loadFollowingRooms,
  loadManagedRooms,
  searchRoomById,
  loadPartyRanking,
  loadFamilies,
  normalizeRoom,
  createPartyRoom,
};
