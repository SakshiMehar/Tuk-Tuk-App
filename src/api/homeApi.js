// ============================================================
// HOME PAGE API — Backend Developer Reference
// ============================================================
//
// APIs required for the Home screen. Currently running in MOCK
// mode (USE_MOCK = true). Flip it to false and the calls hit
// the real backend. No component code changes needed.
//
// ── ENDPOINT SUMMARY ────────────────────────────────────────
//
// 1. GET /api/home/init
//    Auth: Bearer token required
//    Returns initial page data in one shot to avoid waterfalls.
//    Response:
//    {
//      userProfile: {
//        id: string,
//        name: string,
//        avatarUrl: string | null,
//        diamonds: number,
//        isOnline: boolean
//      },
//      stats: {
//        activeUsers: number,          // platform-wide live count
//        featuredUserAvatar: string,   // random active user shown in header pill
//        unreadNotifications: number
//      },
//      bannerSlides: Array<{
//        id: string,
//        title: string,
//        imageUrl: string | null,      // CDN URL; null = use local fallback
//        actionRoute: string           // in-app route to navigate on tap
//      }>,
//      recommendedUsers: Array<{
//        id: string,
//        name: string,
//        avatar: string,               // CDN avatar URL
//        isOnline: boolean
//      }>,
//      searchSuggestions: string[],
//      trendingTags: string[]          // e.g. ["#VoiceParty", "#BlindDate"]
//    }
//
// 2. GET /api/home/feed?tab=for_you&page=1&limit=10
//    Auth: Bearer token required
//    tab: "for_you" | "selfie" | "online" | "following" | "new"
//    Response:
//    {
//      posts: Array<{
//        id: number,
//        userId: string,
//        name: string,
//        avatar: string,
//        text: string,
//        hasVideo: boolean,
//        duration: string | null,      // e.g. "00:28"
//        videoThumbnailUrl: string | null,
//        timestamp: string             // ISO 8601
//      }>,
//      hasMore: boolean,
//      nextPage: number
//    }
//
// 3. GET /api/notifications?page=1&limit=20
//    Auth: Bearer token required
//    Response:
//    {
//      notifications: Array<{
//        id: string,
//        type: "like" | "follow" | "gift" | "comment" | "party" | "system" | "reward",
//        icon: string,                 // emoji
//        title: string,
//        subtitle: string,
//        time: string,                 // human-readable: "2m ago"
//        timestamp: string,            // ISO 8601 for client-side sorting
//        avatar: string | null,        // null for system notifications
//        unread: boolean
//      }>,
//      unreadCount: number
//    }
//
// 4. GET /api/gifts/daily
//    Auth: Bearer token required
//    Response:
//    {
//      gifts: Array<{
//        id: string,
//        name: string,
//        emoji: string,
//        value: number,
//        colors: [string, string],     // gradient start/end hex
//        description: string,
//        isFree: boolean,
//        claimedToday: boolean         // true if user already claimed today
//      }>
//    }
//
// 5. POST /api/notifications/mark-read
//    Auth: Bearer token required
//    Body: { notificationIds: string[] | "all" }
//    Response: { success: boolean }
//
// ── NOTES FOR BACKEND ────────────────────────────────────────
// - All endpoints require Authorization: Bearer <jwt> header
// - /api/home/init should be a single batched endpoint to avoid
//   multiple round-trips on app launch
// - activeUsers count can be cached for 30s server-side
// - feedPosts support pagination; first load returns page 1
// - recommendedUsers: max 20 users, sorted by activity
// ============================================================

import API, { authRequestConfig } from "./axios";
import mockData from "../data/homeData.json";

const USE_MOCK = false; // Flip to true to use local mock data

// ── 1. Home Init ─────────────────────────────────────────────
export const getHomeInit = async () => {
  if (USE_MOCK) {
    return {
      userProfile: mockData.userProfile,
      stats: mockData.stats,
      bannerSlides: mockData.bannerSlides,
      recommendedUsers: mockData.recommendedUsers,
      searchSuggestions: mockData.searchSuggestions,
      trendingTags: mockData.trendingTags,
    };
  }
  const response = await API.get("/api/home/init", await authRequestConfig());
  return response.data;
};

// ── 2. Feed Posts ─────────────────────────────────────────────
export const getFeedPosts = async (tab = "for_you", page = 1, limit = 10) => {
  if (USE_MOCK) {
    const start = (page - 1) * limit;
    const posts = mockData.feedPosts.slice(start, start + limit);
    return {
      posts,
      hasMore: start + limit < mockData.feedPosts.length,
      nextPage: page + 1,
    };
  }
  const response = await API.get(
    `/api/home/feed?tab=${tab}&page=${page}&limit=${limit}`
  );
  return response.data;
};

// ── 3. Notifications ──────────────────────────────────────────
export const getNotifications = async (page = 1, limit = 20) => {
  if (USE_MOCK) {
    return {
      notifications: mockData.notifications,
      unreadCount: mockData.notifications.filter((n) => n.unread).length,
    };
  }
  const response = await API.get(
    `/api/notifications?page=${page}&limit=${limit}`
  );
  return response.data;
};

// ── 4. Daily Gifts ────────────────────────────────────────────
export const getDailyGifts = async () => {
  if (USE_MOCK) {
    return { gifts: mockData.gifts };
  }
  const response = await API.get("/api/gifts/daily");
  return response.data;
};

// ── 5. Wallet Balance ─────────────────────────────────────────
export const getWallet = async () => {
  const response = await API.get("/api/app/wallet/me");
  return response.data;
};

// ── 6. Wallet Transactions ────────────────────────────────────
export const getWalletTransactions = async (page = 0, size = 20) => {
  const response = await API.get(
    `/api/app/wallet/transactions?page=${page}&size=${size}`
  );
  return response.data;
};

// ── 7. User Search (query param) ──────────────────────────────
// GET /api/app/users/search?q=<query>&page=&limit=
export const searchUsers = async (q, page = 0, limit = 20) => {
  const url = `/api/app/users/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
  console.log("[homeApi] GET", url);
  const response = await API.get(url, await authRequestConfig());
  console.log(
    "[homeApi] GET /api/app/users/search response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

// ── 7b. User Search (path param) ──────────────────────────────
// GET /api/app/users/search/{query}
export const searchUsersByPath = async (query) => {
  const url = `/api/app/users/search/${encodeURIComponent(query)}`;
  console.log("[homeApi] GET", url);
  const response = await API.get(url, await authRequestConfig());
  console.log(
    "[homeApi] GET /api/app/users/search/{query} response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

// ── 7c. User by ID ────────────────────────────────────────────
// GET /api/app/users/{userId}
export const getUserById = async (userId) => {
  const url = `/api/app/users/${encodeURIComponent(userId)}`;
  console.log("[homeApi] GET", url);
  const response = await API.get(url, await authRequestConfig());
  console.log(
    "[homeApi] GET /api/app/users/{userId} response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

// ── 8. Mark Notifications Read ────────────────────────────────
export const markNotificationsRead = async (ids = "all") => {
  if (USE_MOCK) {
    return { success: true };
  }
  const response = await API.post("/api/notifications/mark-read", {
    notificationIds: ids,
  });
  return response.data;
};
