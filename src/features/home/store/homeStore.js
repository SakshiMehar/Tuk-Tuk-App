import { create } from 'zustand';

export const useHomeStore = create((set) => ({
  userProfile: {
    id: 'u_me',
    name: 'Sakshi',
    diamonds: 28961.4,
    avatarUrl: null,
  },
  walletDiamonds: 28961.4,
  activeUsers: 1,
  featuredUserAvatar: 'https://randomuser.me/api/portraits/men/45.jpg',

  selectedTab: 'For You',
  roomFilter: 'Trending',

  bannerSlides: [],
  popularRooms: [],
  recommendedUsers: [],
  feedPosts: [],
  feedLoading: false,
  feedHasMore: false,

  likedPostIds: [],
  followingUserIds: [],
  unreadNotifications: Array.from({ length: 20 }, (_, i) => `n_${i + 1}`),

  // Active Modals & Overlays
  modals: {
    search: false,
    notifications: false,
    gifts: false,
    createPost: false,
    recharge: false,
    genderPicker: false,
    comingSoon: null,
    postMore: null,
    commentPostId: null,
    reportTarget: null,
    imageViewer: null,
  },

  // Setters
  setUserProfile: (userProfile) => set({ userProfile }),
  setWalletDiamonds: (walletDiamonds) => set({ walletDiamonds }),
  setActiveUsers: (activeUsers) => set({ activeUsers }),
  setFeaturedUserAvatar: (featuredUserAvatar) => set({ featuredUserAvatar }),
  setSelectedTab: (selectedTab) => set({ selectedTab }),
  setRoomFilter: (roomFilter) => set({ roomFilter }),

  setBannerSlides: (bannerSlides) => set({ bannerSlides }),
  setPopularRooms: (popularRooms) => set({ popularRooms }),
  setRecommendedUsers: (recommendedUsers) => set({ recommendedUsers }),
  setFeedPosts: (feedPosts) => set({ feedPosts }),
  setFeedLoading: (feedLoading) => set({ feedLoading }),
  setFeedHasMore: (feedHasMore) => set({ feedHasMore }),

  setLikedPostIds: (likedPostIds) => set({ likedPostIds }),
  toggleLikePost: (postId) =>
    set((state) => {
      const isLiked = state.likedPostIds.includes(postId);
      const nextLiked = isLiked
        ? state.likedPostIds.filter((id) => id !== postId)
        : [...state.likedPostIds, postId];
      const nextPosts = state.feedPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likeCount: Math.max(0, (p.likeCount || 0) + (isLiked ? -1 : 1)),
          };
        }
        return p;
      });
      return { likedPostIds: nextLiked, feedPosts: nextPosts };
    }),

  toggleFollowUser: (userId) =>
    set((state) => {
      const isFollowing = state.followingUserIds.includes(userId);
      const nextFollowing = isFollowing
        ? state.followingUserIds.filter((id) => id !== userId)
        : [...state.followingUserIds, userId];
      return { followingUserIds: nextFollowing };
    }),

  addPost: (newPost) =>
    set((state) => ({
      feedPosts: [newPost, ...state.feedPosts],
    })),

  deletePost: (postId) =>
    set((state) => ({
      feedPosts: state.feedPosts.filter((p) => String(p.id) !== String(postId)),
    })),

  setUnreadNotifications: (unreadNotifications) =>
    set({ unreadNotifications }),

  setModalVisible: (modalKey, value) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [modalKey]: value,
      },
    })),
}));

export default useHomeStore;
