import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

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

const MOCK_ROOMS = [
  {
    id: 'room-1',
    name: 'Vipin Sharma n...',
    listenerCount: 0,
    image: require('@assets/images/room_good_vibes.jpg'),
    region: 'Global',
    isLive: true,
  },
  {
    id: 'room-2',
    name: 'TukTuk Official',
    listenerCount: 0,
    image: require('@assets/images/room_music_chill.jpg'),
    region: 'Global',
    isLive: true,
  },
  {
    id: 'room-3',
    name: 'New Updated...',
    listenerCount: 0,
    image: require('@assets/images/room_gaming_zone.jpg'),
    region: 'Global',
    isLive: true,
  },
  {
    id: 'room-4',
    name: "Good Vibes Only",
    listenerCount: 8200,
    image: require('@assets/images/room_lets_talk.jpg'),
    region: 'Global',
    isLive: true,
  },
];

const MOCK_POSTS = [
  {
    id: 'p1',
    userId: 'u101',
    name: 'Aanya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    text: 'What an energetic voice party tonight! Thank you everyone for the virtual gifts and love! 🚀💖',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    ],
    likeCount: 248,
    commentsCount: 36,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    hasVideo: false,
  },
  {
    id: 'p2',
    userId: 'u102',
    name: 'Kabir Singhania',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    text: 'Live podcast streaming starts at 10 PM sharp. Join room #101 for special guest revelations! 🎙️🔥',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    imageUrls: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80'],
    likeCount: 184,
    commentsCount: 19,
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    hasVideo: false,
  },
  {
    id: 'p3',
    userId: 'u103',
    name: 'Rohan Mehta',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    text: 'Met amazing friends on Tuk-Tuk today. Ready for the next Truth & Dare battle! 😎⚡',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    imageUrls: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80'],
    likeCount: 92,
    commentsCount: 11,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    hasVideo: false,
  },
];

const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Kabir Singhania',
    message: 'started a new Voice Party: Late Night Ghazals & Stories 🌙',
    time: '5m ago',
    unread: true,
    type: 'party',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
  },
  {
    id: 'n2',
    title: 'Daily Rewards',
    message: 'Your 500 Daily Free Diamonds are ready to claim! 💎',
    time: '1h ago',
    unread: true,
    type: 'gift',
  },
  {
    id: 'n3',
    title: 'Aanya Sharma',
    message: 'liked your moment: "What an energetic voice party tonight..." 👍',
    time: '2h ago',
    unread: false,
    type: 'like',
  },
];

const MOCK_GIFTS = [
  { id: 'g1', name: 'Rose', value: 10, emoji: '🌹', colors: ['#E11D48', '#BE123C'], isFree: true, description: 'Send sweet gesture' },
  { id: 'g2', name: 'Heart Ring', value: 99, emoji: '💍', colors: ['#9333EA', '#7E22CE'], description: 'Sparkle with grace' },
  { id: 'g3', name: 'Super Car', value: 499, emoji: '🏎️', colors: ['#D97706', '#B45309'], description: 'Cruise into party' },
  { id: 'g4', name: 'Super Rocket', value: 999, emoji: '🚀', colors: ['#2563EB', '#1D4ED8'], description: 'Full room animation' },
];

export const homeApi = {
  getHomeData: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.HOME.FEED);
      if (response && response.data) return response.data;
    } catch {
      // Graceful fallback to mock data
    }
    return {
      userProfile: {
        id: 'u_current',
        name: 'Sakshi',
        diamonds: 28961.4,
        avatarUrl: null,
      },
      stats: {
        activeUsers: 1,
        featuredUserAvatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      },
      bannerSlides: MOCK_BANNER_SLIDES,
      popularRooms: MOCK_ROOMS,
      feedPosts: MOCK_POSTS,
      notifications: MOCK_NOTIFICATIONS,
      unreadCount: 20,
      gifts: MOCK_GIFTS,
      searchSuggestions: ['Voice Party', 'Aanya', 'Singing', 'Kabir', 'Gaming'],
      trendingTags: ['#VoicePartyCarnival', '#LateNightVibes', '#TukTukStar', '#GamingZone'],
    };
  },

  refreshFeed: async (tab = 'For You', page = 1) => {
    try {
      const response = await apiClient.get(
        `${ENDPOINTS.HOME.FEED}?tab=${encodeURIComponent(tab)}&page=${page}`
      );
      if (response && response.data) return response.data;
    } catch {
      // fallback
    }

    if (tab === 'Online') {
      return {
        posts: [
          {
            id: 'p_on_1',
            userId: 'u101',
            name: 'Aanya Sharma',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
            text: 'Live right now in Room #101! Join for special guest announcements 🎉',
            imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
            imageUrls: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80'],
            likeCount: 312,
            commentsCount: 45,
            createdAt: 'Just now',
          },
          {
            id: 'p_on_2',
            userId: 'u102',
            name: 'Kabir Singhania',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
            text: 'Chilling online with new tracks. Drop your song requests! 🎶',
            likeCount: 154,
            commentsCount: 22,
            createdAt: '5m ago',
          },
        ],
        hasMore: false,
      };
    }

    if (tab === 'Following') {
      return {
        posts: [
          {
            id: 'p_fol_1',
            userId: 'u101',
            name: 'Aanya Sharma',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
            text: 'Behind the scenes at today’s stream! Thank you for 10K followers! ❤️✨',
            imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
            imageUrls: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'],
            likeCount: 420,
            commentsCount: 68,
            createdAt: '1h ago',
          },
        ],
        hasMore: false,
      };
    }

    if (tab === 'New') {
      return {
        posts: [
          {
            id: 'p_new_1',
            userId: 'u104',
            name: 'Neha Kapoor',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            text: 'Just joined Tuk-Tuk! Excited to meet everyone and host my first party soon! 🌸👋',
            likeCount: 18,
            commentsCount: 5,
            createdAt: '2m ago',
          },
          ...MOCK_POSTS,
        ],
        hasMore: false,
      };
    }

    return {
      posts: MOCK_POSTS,
      hasMore: false,
    };
  },

  getPopularRooms: async (filter = 'Trending') => {
    try {
      const response = await apiClient.get(
        `${ENDPOINTS.PARTY.ROOM_LIST}?filter=${encodeURIComponent(filter)}`
      );
      if (response && response.data) return response.data;
    } catch {
      // fallback
    }

    if (filter === 'Nearby') {
      return [
        {
          id: 'room-near-1',
          name: 'Delhi NCR Friends ☕',
          listenerCount: 3400,
          image: require('@assets/images/room_music_chill.jpg'),
          region: 'Delhi, IN',
          isLive: true,
        },
        {
          id: 'room-near-2',
          name: 'Mumbai Night Live 🌃',
          listenerCount: 5100,
          image: require('@assets/images/room_good_vibes.jpg'),
          region: 'Mumbai, IN',
          isLive: true,
        },
        {
          id: 'room-near-3',
          name: 'Bangalore Tech & Chai 💻',
          listenerCount: 2900,
          image: require('@assets/images/room_gaming_zone.jpg'),
          region: 'Bengaluru, IN',
          isLive: true,
        },
      ];
    }

    if (filter === 'Following') {
      return [
        {
          id: 'room-fol-1',
          name: 'Aanya Live Concert 🎤',
          listenerCount: 9400,
          image: require('@assets/images/room_lets_talk.jpg'),
          region: 'Global',
          isLive: true,
        },
        {
          id: 'room-fol-2',
          name: 'Kabir & Friends Jam 🎸',
          listenerCount: 7100,
          image: require('@assets/images/room_music_chill.jpg'),
          region: 'India',
          isLive: true,
        },
      ];
    }

    return MOCK_ROOMS;
  },

  getPostComments: async (postId) => {
    return [
      {
        id: 'c1',
        user: { name: 'Kabir', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
        text: 'Loved this live stream so much! Great energy! 🙌🔥',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
      {
        id: 'c2',
        user: { name: 'Aanya', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
        text: 'Looking forward to the next party tomorrow night! ❤️',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ];
  },

  addComment: async (postId, text) => {
    return {
      id: `c_${Date.now()}`,
      user: { name: 'You' },
      text,
      createdAt: new Date().toISOString(),
    };
  },

  likePost: async (postId) => {
    return { success: true };
  },

  unlikePost: async (postId) => {
    return { success: true };
  },

  createPost: async ({ caption, photos, video, mediaType }) => {
    return {
      id: `post_${Date.now()}`,
      text: caption,
      imageUrls: photos?.map((p) => p.uri) || [],
      imageUrl: photos?.[0]?.uri || null,
      hasVideo: mediaType === 'video',
      likeCount: 0,
      createdAt: new Date().toISOString(),
    };
  },

  deletePost: async (postId) => {
    return { success: true };
  },

  searchPeople: async (query) => {
    const q = query.toLowerCase();
    const mockUsers = [
      { id: 'u101', name: 'Aanya Sharma', isOnline: true, level: 14, vip: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
      { id: 'u102', name: 'Kabir Singhania', isOnline: true, level: 22, vip: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
      { id: 'u103', name: 'Rohan Mehta', isOnline: false, level: 18, vip: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
    ];
    return mockUsers.filter((u) => u.name.toLowerCase().includes(q));
  },
};

export default homeApi;
