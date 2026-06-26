import {
  getHomeInit,
  getFeedPosts,
  getNotifications,
  getDailyGifts,
  getWallet,
  getWalletTransactions,
  searchUsers,
  searchUsersByPath,
  getUserById,
  markNotificationsRead,
} from "../api/homeApi";
import {
  getOnlinePosts,
  getFollowingPosts,
  getDiscoverPosts,
} from "../api/postApi";
import { getActiveUsersCount } from "../api/userApi";
import { getToken } from "../store/authStore";
import { resolveAppUserId } from "../utils/sessionUser";
import { API_BASE_URL } from "../config/env";

// Backend returns relative paths like "/uploads/feed/abc.jpg".
// React Native Image requires a full https:// URL.
const toAbsoluteUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
};

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const listFrom = (value, key) => {
  const target = key && value?.[key] !== undefined ? value[key] : value;
  if (Array.isArray(target)) return target;
  return target?.content ?? target?.data ?? target?.items ?? [];
};

const normalizeUserProfile = (profile, token = null) => {
  if (!profile) return null;
  const userId =
    resolveAppUserId(profile, token) ??
    firstValue(profile?.userId, profile?.id, profile?.user_id, profile?._id);

  return {
    ...profile,
    id: userId,
    userId,
    avatarUrl: toAbsoluteUrl(firstText(
      profile.avatarUrl,
      profile.avatar,
      profile.profileImage,
      profile.profilePic,
      profile.photoUrl,
      profile.imageUrl
    )),
  };
};

export const RECOMMEND_AVATAR_FALLBACK =
  "https://randomuser.me/api/portraits/men/34.jpg";

const profileFrom = (user) => user?.profile ?? user?.userProfile ?? user?.user ?? null;

const normalizeRecommendedUser = (user) => {
  const profile = profileFrom(user);
  return {
    ...user,
    id: firstValue(user?.id, user?.userId, user?._id, profile?.id, profile?.userId),
    userId: firstValue(user?.userId, user?.id, user?._id, profile?.userId, profile?.id),
    name:
      firstText(
        user?.name,
        user?.username,
        user?.displayName,
        user?.fullName,
        user?.nickname,
        profile?.name,
        profile?.username
      ) ?? "Guest",
    avatar:
      toAbsoluteUrl(firstText(
        user?.avatar,
        user?.avatarUrl,
        user?.profileImageUrl,
        user?.profileImage,
        user?.profilePic,
        user?.profilePicUrl,
        user?.photoUrl,
        user?.imageUrl,
        user?.picture,
        profile?.avatar,
        profile?.avatarUrl,
        profile?.profileImageUrl,
        profile?.profileImage,
        profile?.photoUrl
      )) ?? null,
    isOnline: Boolean(user?.isOnline ?? user?.online ?? profile?.isOnline),
  };
};

export const normalizePost = (post) => {
  const author = post?.user ?? post?.author ?? post?.createdBy ?? {};
  const media = post?.media ?? post?.attachment ?? {};

  // Determine media type first so we can route the generic media.url correctly.
  // A post is a video when the backend explicitly marks it as such.
  const isVideo = Boolean(
    post?.hasVideo ||
    post?.type === "video" ||
    post?.mediaType === "video" ||
    media?.type === "video" ||
    media?.mediaType === "video"
  );

  // Use media.url as a video fallback only when we already know it is a video.
  // This prevents a plain image URL stored in media.url from being treated as a
  // video URL, which would set hasVideo=true and hide the image in PostCard.
  const videoUrl = firstText(
    post?.videoUrl,
    media?.videoUrl,
    media?.mediaUrl,
    isVideo ? media?.url : null
  );

  // Use media.url as an image fallback only when the post is NOT a video.
  const imageUrl = firstText(
    post?.imageUrl,
    post?.mediaUrl,
    post?.image,
    post?.photoUrl,
    post?.postImage,
    post?.thumbnailUrl,
    media?.imageUrl,
    media?.mediaUrl,
    !isVideo ? media?.url : null,
    Array.isArray(post?.mediaUrls) ? post.mediaUrls[0] : null,
    Array.isArray(post?.images) ? post.images[0] : null
  );

  const result = {
    ...post,
    id: firstValue(post?.id, post?.postId, post?._id),
    userId: firstValue(
      post?.userId,
      post?.authorId,
      post?.ownerId,
      post?.createdBy,
      post?.createdByUserId,
      post?.postedBy,
      post?.memberId,
      author?.id,
      author?.userId,
      typeof author === "string" || typeof author === "number" ? author : null
    ),
    name: firstText(post?.name, post?.username, post?.authorName, author?.name, author?.username) ?? "User",
    avatar: toAbsoluteUrl(firstText(
      post?.avatar,
      post?.avatarUrl,
      post?.profileImage,
      post?.profilePic,
      post?.authorAvatar,
      author?.avatar,
      author?.avatarUrl,
      author?.profileImage,
      author?.profilePic
    )),
    text: firstText(post?.text, post?.caption, post?.content, post?.description) ?? "",
    imageUrl: toAbsoluteUrl(imageUrl),
    videoUrl: toAbsoluteUrl(videoUrl),
    // Re-derive hasVideo from the canonical videoUrl so it's consistent even
    // when the backend field is missing or the type is not set explicitly.
    hasVideo: Boolean(isVideo || toAbsoluteUrl(videoUrl)),
    likeCount: post?.likeCount ?? post?.likes ?? post?.totalLikes ?? 0,
  };

  return result;
};

// Map UI display labels → API tab param values
const TAB_API_MAP = {
  "for you":  "for_you",
  "selfie":   "selfie",
  "online":   "online",
  "following":"following",
  "new":      "new",
};

const toApiTab = (tab) =>
  TAB_API_MAP[String(tab).toLowerCase().trim()] ?? "for_you";

// Online / Following / New tabs use dedicated /api/posts/* endpoints.
// (page is 0-based for these loaders.)
const TAB_FEED_LOADER = {
  online:    getOnlinePosts,
  following: getFollowingPosts,
  new:       getDiscoverPosts,
};

// Works across array, { posts }, { content } (Spring page) and { data } shapes.
const hasMoreFrom = (data) => {
  if (data?.hasMore != null) return Boolean(data.hasMore);
  if (data?.hasNext != null) return Boolean(data.hasNext);
  if (data?.last != null) return !data.last;
  return false;
};

// Loads all data the Home screen needs in a single call.
// Uses Promise.allSettled so a failing secondary call (gifts, wallet, etc.)
// never prevents the feed and profile from loading.
export const getHomeData = async () => {
  const [initResult, feedResult, notifResult, giftsResult, walletResult, activeCountResult] =
    await Promise.allSettled([
      getHomeInit(),
      getFeedPosts("for_you", 1, 10),
      getNotifications(),
      getDailyGifts(),
      getWallet(),
      getActiveUsersCount(),
    ]);

  // Core data — if init or feed fail the home screen should still handle it gracefully
  const initData       = initResult.status       === "fulfilled" ? initResult.value       : null;
  const feedData       = feedResult.status       === "fulfilled" ? feedResult.value       : null;
  const notifData      = notifResult.status      === "fulfilled" ? notifResult.value      : null;
  const giftsData      = giftsResult.status      === "fulfilled" ? giftsResult.value      : null;
  const walletData     = walletResult.status     === "fulfilled" ? walletResult.value     : null;
  const activeCountData= activeCountResult.status=== "fulfilled" ? activeCountResult.value: null;

  const gifts = Array.isArray(giftsData) ? giftsData : (giftsData?.gifts ?? []);
  const notifList = notifData?.notifications?.content
    ?? (Array.isArray(notifData?.notifications) ? notifData.notifications : []);
  const token = await getToken();
  const userProfile = normalizeUserProfile(initData?.userProfile, token);
  const recommendedUsers = listFrom(initData, "recommendedUsers").map(normalizeRecommendedUser);
  const feedPosts = listFrom(feedData, "posts").map(normalizePost);
  const activeUsers =
    activeCountData?.activeUsers ??
    activeCountData?.count ??
    initData?.stats?.activeUsers ??
    0;

  return {
    userProfile,
    stats: {
      ...(initData?.stats ?? {}),
      activeUsers,
    },
    bannerSlides:      initData?.bannerSlides        ?? [],
    recommendedUsers,
    searchSuggestions: initData?.searchSuggestions   ?? [],
    trendingTags:      initData?.trendingTags        ?? [],
    feedPosts,
    feedHasMore:       feedData?.hasMore             ?? false,
    notifications:     notifList,
    unreadCount:       notifData?.unreadCount        ?? 0,
    gifts,
    wallet:            walletData                    ?? null,
  };
};

// Refresh the feed back to page 1 — call this after creating a post or
// switching tabs. Online/Following/New route to their dedicated endpoints.
export const refreshFeed = async (tab = "for_you") => {
  const key = String(tab).toLowerCase().trim();
  const loader = TAB_FEED_LOADER[key];

  if (loader) {
    const data = await loader(0, 10);
    const posts = listFrom(data, "posts").map(normalizePost);
    return { posts, hasMore: hasMoreFrom(data) };
  }

  const apiTab = toApiTab(tab);
  const data = await getFeedPosts(apiTab, 1, 10);
  const posts = listFrom(data, "posts").map(normalizePost);

  return {
    posts,
    hasMore: data?.hasMore ?? false,
  };
};

// Load next page of feed posts. `page` is 1-based from the Home screen.
export const loadMoreFeed = async (tab, page) => {
  const key = String(tab).toLowerCase().trim();
  const loader = TAB_FEED_LOADER[key];

  if (loader) {
    // Dedicated endpoints are 0-based, so page 2 (UI) → page 1 (API).
    const data = await loader(Math.max(0, page - 1), 10);
    const posts = listFrom(data, "posts").map(normalizePost);
    return { ...data, posts, hasMore: hasMoreFrom(data) };
  }

  const apiTab = toApiTab(tab);
  const data = await getFeedPosts(apiTab, page, 10);
  const posts = listFrom(data, "posts").map(normalizePost);

  return { ...data, posts };
};

export const loadWalletTransactions = (page = 0, size = 20) =>
  getWalletTransactions(page, size);

export const searchUsersByQuery = (q, page = 0, limit = 20) =>
  searchUsers(q, page, limit);

// People search for the Home search box.
// Tries the query-param endpoint first, falls back to the path-param
// endpoint if the backend only exposes that one. Returns normalized users.
export const searchPeople = async (query, page = 0, limit = 20) => {
  const trimmed = String(query ?? "").trim();
  if (!trimmed) return [];

  let data;
  try {
    data = await searchUsers(trimmed, page, limit);
  } catch (err) {
    if (err?.status === 404) {
      data = await searchUsersByPath(trimmed);
    } else {
      throw err;
    }
  }

  return listFrom(data, "users").map(normalizeRecommendedUser);
};

// Full profile for a single user (used when opening a search result).
export const getUserDetailById = async (userId) => {
  const data = await getUserById(userId);
  const user = data?.user ?? data?.data ?? data ?? {};
  return normalizeRecommendedUser(user);
};

export const markAllNotificationsRead = () =>
  markNotificationsRead("all");

// Shared by Home and Chat tabs — same API source as home init.
const extractRecommendedUsers = (initData) => {
  const candidates = [
    initData?.recommendedUsers,
    initData?.data?.recommendedUsers,
    initData?.recommended_users,
    initData?.users,
    listFrom(initData, "recommendedUsers"),
  ];
  const list = candidates.find((item) => Array.isArray(item) && item.length > 0);
  return list ?? (Array.isArray(candidates[0]) ? candidates[0] : []);
};

export const getRecommendedUsers = async () => {
  const initData = await getHomeInit();
  const raw = extractRecommendedUsers(initData);
  return raw.map(normalizeRecommendedUser);
};

export const refreshActiveUsersCount = async () => {
  const data = await getActiveUsersCount();
  const activeUsers = data?.activeUsers ?? data?.count ?? 0;
  
  return activeUsers;
};
