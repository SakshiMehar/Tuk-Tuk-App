import API, { authRequestConfig } from '@/api/axios';
import { API_BASE_URL } from '@/config/env';
import { getNotifications, getUnreadNotificationCount } from '@/api/notificationApi';
import {
  createPost as apiCreatePost,
  deletePost as apiDeletePost,
  likePost as apiLikePost,
  unlikePost as apiUnlikePost,
  getPostComments as apiGetPostComments,
  addComment as apiAddComment,
  getOnlinePosts,
  getFollowingPosts,
  getDiscoverPosts,
} from '@/api/postApi';
import { getAppUserId } from '@/utils/sessionUser';
import { partyApi } from '@/features/party/api/partyApi';

export const toAbsoluteUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('ph://')
  ) {
    return trimmed;
  }

  if (
    trimmed.includes('.ngrok-free.dev') ||
    trimmed.includes('.ngrok.io') ||
    trimmed.includes('localhost:') ||
    trimmed.includes('127.0.0.1:') ||
    trimmed.includes('10.0.2.2:')
  ) {
    try {
      const match = trimmed.match(/^https?:\/\/[^\/]+(\/.*)$/);
      if (match && match[1]) {
        return `${API_BASE_URL}${match[1]}`;
      }
    } catch {}
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const firstText = (...values) =>
  values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

export const normalizePost = (post, currentUserId = null) => {
  if (!post) return null;
  const author =
    post.user ??
    post.author ??
    post.poster ??
    post.member ??
    post.userData ??
    post.userInfo ??
    (typeof post.createdBy === 'object' ? post.createdBy : null) ??
    {};
  const media = post.media ?? post.attachment ?? {};

  const isVideo = Boolean(
    post.hasVideo ||
    post.type === 'video' ||
    post.mediaType === 'video' ||
    media.type === 'video' ||
    media.mediaType === 'video'
  );

  const videoUrl = firstText(
    post.videoUrl,
    media.videoUrl,
    media.mediaUrl,
    isVideo ? media.url : null
  );

  const rawImageList = !isVideo
    ? (
        (Array.isArray(post.mediaUrls) && post.mediaUrls) ||
        (Array.isArray(post.imageUrls) && post.imageUrls) ||
        (Array.isArray(post.images) && post.images) ||
        (Array.isArray(post.media) && post.media) ||
        []
      )
    : [];

  const imageUrlList = rawImageList
    .map((item) => (typeof item === 'string' ? item : firstText(item?.url, item?.imageUrl, item?.mediaUrl)))
    .filter(Boolean)
    .map(toAbsoluteUrl);

  const imageUrl = firstText(
    post.imageUrl,
    post.mediaUrl,
    post.image,
    post.photoUrl,
    post.postImage,
    post.thumbnailUrl,
    media.imageUrl,
    media.mediaUrl,
    !isVideo ? media.url : null,
    imageUrlList[0] ?? null
  );

  const resolvedImageUrl = toAbsoluteUrl(imageUrl);
  const imageUrls = resolvedImageUrl
    ? [resolvedImageUrl, ...imageUrlList.filter((u) => u !== resolvedImageUrl)]
    : imageUrlList;

  const resolvedUserId = firstValue(
    post.userId,
    post.authorId,
    post.ownerId,
    post.createdBy,
    post.createdByUserId,
    post.postedBy,
    post.memberId,
    author.id,
    author.userId
  );

  const isOwn = Boolean(
    post._isOwn ||
    (currentUserId && resolvedUserId && String(resolvedUserId) === String(currentUserId))
  );

  return {
    ...post,
    id: String(firstValue(post.id, post.postId, post._id) || `post_${Date.now()}`),
    userId: resolvedUserId ? String(resolvedUserId) : null,
    name: firstText(
      post.name,
      post.username,
      post.authorName,
      post.displayName,
      author.name,
      author.username,
      author.displayName,
      author.fullName
    ) || 'User',
    avatar: toAbsoluteUrl(firstText(
      post.avatar,
      post.avatarUrl,
      post.profileImage,
      post.profileImageUrl,
      post.profilePic,
      post.authorAvatar,
      post.userAvatar,
      author.avatar,
      author.avatarUrl,
      author.profileImage,
      author.profileImageUrl,
      author.profilePic,
      author.photoUrl
    )),
    text: firstText(post.text, post.caption, post.content, post.description) || '',
    imageUrl: resolvedImageUrl,
    imageUrls,
    videoUrl: toAbsoluteUrl(videoUrl),
    hasVideo: Boolean(isVideo || toAbsoluteUrl(videoUrl)),
    duration: post.duration || null,
    likeCount: Number(post.likeCount ?? post.likes ?? post.totalLikes ?? 0),
    commentsCount: Number(post.commentsCount ?? post.comments ?? 0),
    createdAt: post.createdAt || post.timestamp || 'Just now',
    _isOwn: isOwn,
  };
};

const MOCK_BANNER_SLIDES = [
  {
    id: 'b1',
    title: 'Voice Party Weekend Carnival 🎉',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  },
  {
    id: 'b2',
    title: 'Top Creators VIP Showcase ✨',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  },
  {
    id: 'b3',
    title: 'Music & Jam Live Battle 🎸',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
  },
];

export const parseRoomsResponse = (data) => {
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

export const normalizeRoom = (room, index = 0) => {
  if (!room) return null;
  const rawRoom = room?.room ?? room?.data ?? room;
  const id = String(rawRoom.roomId || rawRoom.id || rawRoom._id || `room_${index}`);
  const name =
    firstText(rawRoom.name, rawRoom.title, rawRoom.roomName, rawRoom.displayName) ||
    'Live Party';
  const title =
    firstText(rawRoom.title, rawRoom.name, rawRoom.roomName, rawRoom.description) ||
    name;

  const rawImage = firstText(
    rawRoom.profileImageUrl,
    rawRoom.profilePicUrl,
    rawRoom.imageUrl,
    rawRoom.roomImageUrl,
    rawRoom.coverImage,
    rawRoom.coverUrl,
    rawRoom.avatarUrl,
    typeof rawRoom.image === 'string' ? rawRoom.image : null,
    rawRoom.image?.uri
  );

  const resolvedCover = toAbsoluteUrl(rawImage);
  const listenerCount = Number(
    rawRoom.userCount ??
    rawRoom.listenerCount ??
    rawRoom.memberCount ??
    rawRoom.onlineCount ??
    rawRoom.participantCount ??
    0
  );

  const region = firstText(rawRoom.countryCode, rawRoom.region, rawRoom.country) || 'Global';
  const isLive = String(rawRoom.status || '').toUpperCase() === 'LIVE' || rawRoom.isLive !== false;

  return {
    ...rawRoom,
    id,
    roomId: id,
    name,
    title,
    imageUrl: resolvedCover,
    profileImageUrl: resolvedCover,
    coverImage: resolvedCover,
    image: resolvedCover ? { uri: resolvedCover } : (typeof rawRoom.image === 'number' ? rawRoom.image : null),
    listenerCount,
    memberCount: listenerCount,
    userCount: listenerCount,
    region,
    countryCode: rawRoom.countryCode || null,
    status: rawRoom.status || (isLive ? 'LIVE' : 'OFFLINE'),
    isLive,
    hostId: rawRoom.hostId || null,
  };
};

const MOCK_GIFTS = [
  { id: 'g1', name: 'Rose', value: 10, emoji: '🌹', colors: ['#E11D48', '#BE123C'], isFree: true, description: 'Send sweet gesture' },
  { id: 'g2', name: 'Heart Ring', value: 99, emoji: '💍', colors: ['#9333EA', '#7E22CE'], description: 'Sparkle with grace' },
  { id: 'g3', name: 'Super Car', value: 499, emoji: '🏎️', colors: ['#D97706', '#B45309'], description: 'Cruise into party' },
  { id: 'g4', name: 'Super Rocket', value: 999, emoji: '🚀', colors: ['#2563EB', '#1D4ED8'], description: 'Full room animation' },
];

export const homeApi = {
  getHomeData: async () => {
    let notifsData = null;
    let unreadCount = 0;
    let currentUserId = null;

    try {
      currentUserId = await getAppUserId();
    } catch {}

    try {
      const [notifsRes, unreadRes] = await Promise.allSettled([
        getNotifications({ page: 0, size: 20 }),
        getUnreadNotificationCount(),
      ]);
      const rawList = notifsRes.status === 'fulfilled' ? notifsRes.value : null;
      const rawCount = unreadRes.status === 'fulfilled' ? unreadRes.value : null;
      const list = rawList?.content ?? rawList?.data ?? (Array.isArray(rawList) ? rawList : []);
      if (Array.isArray(list) && list.length > 0) {
        notifsData = list.map((n) => ({
          id: String(n.id || n.notificationId || `notif_${Date.now()}`),
          title: n.title || n.senderName || 'Notification',
          message: n.body || n.message || n.content || '',
          time: n.time || (n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
          unread: n.unread ?? !n.isRead ?? true,
          type: n.type || 'system',
          imageUrl: toAbsoluteUrl(n.imageUrl || n.avatar || null),
        }));
      }
      unreadCount = typeof rawCount === 'number' ? rawCount : (rawCount?.count ?? rawCount?.unreadCount ?? (notifsData ? notifsData.filter((n) => n.unread).length : 0));
    } catch {}

    let feedPosts = [];
    let feedHasMore = false;
    let homeInitData = null;

    try {
      const authCfg = await authRequestConfig().catch(() => ({}));
      const [initRes, feedRes] = await Promise.allSettled([
        API.get('/api/home/init', authCfg),
        API.get('/api/home/feed?tab=for_you&page=1&limit=10', authCfg),
      ]);

      if (initRes.status === 'fulfilled' && initRes.value?.data) {
        homeInitData = initRes.value.data;
      }

      if (feedRes.status === 'fulfilled' && feedRes.value?.data) {
        const rawFeed = feedRes.value.data;
        const rawList = Array.isArray(rawFeed) ? rawFeed : rawFeed?.posts || rawFeed?.content || rawFeed?.data || [];
        feedPosts = rawList.map((p) => normalizePost(p, currentUserId)).filter(Boolean);
        feedHasMore = Boolean(rawFeed?.hasMore ?? false);
      }
    } catch (err) {
      console.warn('[homeApi] getHomeData network fetch error:', err?.message);
    }

    let activeUsersCount = 1;
    let popularRooms = [];

    const [activeRes, roomsRes] = await Promise.allSettled([
      homeApi.getActiveUsersCount(),
      homeApi.getPopularRooms('Trending'),
    ]);

    if (activeRes.status === 'fulfilled' && typeof activeRes.value === 'number' && activeRes.value > 0) {
      activeUsersCount = activeRes.value;
    }

    if (roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value)) {
      popularRooms = roomsRes.value;
    }

    return {
      userProfile: homeInitData?.userProfile || {
        id: currentUserId || 'u_current',
        name: 'Sakshi',
        diamonds: 28961.4,
        avatarUrl: null,
      },
      stats: {
        activeUsers: activeUsersCount,
        featuredUserAvatar: toAbsoluteUrl(homeInitData?.stats?.featuredUserAvatar) || 'https://randomuser.me/api/portraits/men/45.jpg',
      },
      bannerSlides: homeInitData?.bannerSlides?.length ? homeInitData.bannerSlides.map((b) => ({
        ...b,
        imageUrl: toAbsoluteUrl(b.imageUrl),
      })) : MOCK_BANNER_SLIDES,
      popularRooms: popularRooms.length
        ? popularRooms
        : (homeInitData?.popularRooms?.length
            ? homeInitData.popularRooms.map(normalizeRoom).filter(Boolean)
            : []),
      feedPosts,
      feedHasMore,
      notifications: notifsData || [],
      unreadCount,
      gifts: homeInitData?.gifts || MOCK_GIFTS,
      searchSuggestions: homeInitData?.searchSuggestions || ['Voice Party', 'Aanya', 'Singing', 'Kabir', 'Gaming'],
      trendingTags: homeInitData?.trendingTags || ['#VoicePartyCarnival', '#LateNightVibes', '#TukTukStar', '#GamingZone'],
    };
  },

  refreshFeed: async (tab = 'For You', page = 1) => {
    let currentUserId = null;
    try {
      currentUserId = await getAppUserId();
    } catch {}

    const key = String(tab).toLowerCase().trim();

    try {
      if (key === 'online') {
        const data = await getOnlinePosts(Math.max(0, page - 1), 10);
        const list = Array.isArray(data) ? data : data?.posts || data?.content || data?.data || [];
        const posts = list.map((p) => normalizePost(p, currentUserId)).filter(Boolean);
        return { posts, hasMore: data?.hasMore ?? data?.hasNext ?? !data?.last ?? false };
      }

      if (key === 'following') {
        const data = await getFollowingPosts(Math.max(0, page - 1), 10);
        const list = Array.isArray(data) ? data : data?.posts || data?.content || data?.data || [];
        const posts = list.map((p) => normalizePost(p, currentUserId)).filter(Boolean);
        return { posts, hasMore: data?.hasMore ?? data?.hasNext ?? !data?.last ?? false };
      }

      if (key === 'new' || key === 'discover') {
        const data = await getDiscoverPosts(Math.max(0, page - 1), 10);
        const list = Array.isArray(data) ? data : data?.posts || data?.content || data?.data || [];
        const posts = list.map((p) => normalizePost(p, currentUserId)).filter(Boolean);
        return { posts, hasMore: data?.hasMore ?? data?.hasNext ?? !data?.last ?? false };
      }

      // Default: 'For You'
      const authCfg = await authRequestConfig().catch(() => ({}));
      const response = await API.get(`/api/home/feed?tab=for_you&page=${page}&limit=10`, authCfg);
      const data = response?.data;
      const list = Array.isArray(data) ? data : data?.posts || data?.content || data?.data || [];
      const posts = list.map((p) => normalizePost(p, currentUserId)).filter(Boolean);
      return { posts, hasMore: data?.hasMore ?? false };
    } catch (err) {
      console.warn(`[homeApi] refreshFeed failed for tab=${tab}:`, err?.message);
      return { posts: [], hasMore: false };
    }
  },

  getPopularRooms: async (filter = 'Trending') => {
    try {
      const key = String(filter || '').toLowerCase().trim();
      let rawData = null;

      if (key === 'following') {
        rawData = await partyApi.getFollowingRooms();
      } else if (key === 'nearby' || key === 'recently') {
        rawData = await partyApi.getRecentlyRooms();
      } else {
        // Trending, Global, or any other filter
        rawData = await partyApi.getRoomRecommendations();
      }

      const list = parseRoomsResponse(rawData);
      return list.map(normalizeRoom).filter(Boolean);
    } catch (err) {
      console.warn(`[homeApi] getPopularRooms failed for filter=${filter}:`, err?.message);
      return [];
    }
  },

  getPostComments: async (postId, page = 0, size = 20) => {
    try {
      const data = await apiGetPostComments(postId, page, size);
      const list = Array.isArray(data) ? data : data?.content || data?.comments || data?.data || [];
      return list;
    } catch (err) {
      console.warn('[homeApi] getPostComments failed:', err?.message);
      return [];
    }
  },

  addComment: async (postId, text) => {
    return apiAddComment(postId, text);
  },

  likePost: async (postId) => {
    return apiLikePost(postId);
  },

  unlikePost: async (postId) => {
    return apiUnlikePost(postId);
  },

  createPost: async (payload) => {
    return apiCreatePost(payload);
  },

  deletePost: async (postId) => {
    return apiDeletePost(postId);
  },

  searchPeople: async (query) => {
    try {
      const authCfg = await authRequestConfig().catch(() => ({}));
      const response = await API.get(`/api/app/users/search?q=${encodeURIComponent(query)}&page=0&limit=20`, authCfg);
      const data = response?.data;
      const list = Array.isArray(data) ? data : data?.users || data?.content || data?.data || [];
      return list.map((u) => ({
        id: String(u.id || u.userId),
        userId: String(u.userId || u.id),
        name: u.name || u.username || 'User',
        avatar: toAbsoluteUrl(u.avatar || u.avatarUrl || u.profileImage),
        isOnline: Boolean(u.isOnline || u.online),
        level: u.level || 1,
        vip: Boolean(u.vip),
      }));
    } catch {
      return [];
    }
  },

  getActiveUsersCount: async () => {
    try {
      const authCfg = await authRequestConfig().catch(() => ({}));
      const res = await API.get('/api/app/users/active/count', authCfg);
      const count = res?.data?.activeUsers ?? res?.data?.count;
      return typeof count === 'number' ? count : (Number(count) || 1);
    } catch (err) {
      console.warn('[homeApi] getActiveUsersCount error:', err?.message);
      return 1;
    }
  },
};

export default homeApi;
