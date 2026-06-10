import {
  getHomeInit,
  getFeedPosts,
  getNotifications,
  getDailyGifts,
  getWallet,
  getWalletTransactions,
  searchUsers,
  markNotificationsRead,
} from "../api/homeApi";
import { getToken } from "../store/authStore";
import { resolveAppUserId } from "../utils/sessionUser";

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
    avatarUrl: firstText(
      profile.avatarUrl,
      profile.avatar,
      profile.profileImage,
      profile.profilePic,
      profile.photoUrl,
      profile.imageUrl
    ),
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
      firstText(
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
      ) ?? null,
    isOnline: Boolean(user?.isOnline ?? user?.online ?? profile?.isOnline),
  };
};

const normalizePost = (post) => {
  const author = post?.user ?? post?.author ?? post?.createdBy ?? {};
  const media = post?.media ?? post?.attachment ?? {};
  const imageUrl = firstText(
    post?.imageUrl,
    post?.mediaUrl,
    post?.image,
    post?.photoUrl,
    post?.postImage,
    post?.thumbnailUrl,
    media?.imageUrl,
    media?.url,
    Array.isArray(post?.mediaUrls) ? post.mediaUrls[0] : null
  );
  const videoUrl = firstText(post?.videoUrl, media?.videoUrl, media?.url);

  return {
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
    avatar: firstText(
      post?.avatar,
      post?.avatarUrl,
      post?.profileImage,
      post?.profilePic,
      post?.authorAvatar,
      author?.avatar,
      author?.avatarUrl,
      author?.profileImage,
      author?.profilePic
    ),
    text: firstText(post?.text, post?.caption, post?.content, post?.description) ?? "",
    imageUrl,
    videoUrl,
    hasVideo: Boolean(post?.hasVideo || post?.type === "video" || media?.type === "video" || videoUrl),
    likeCount: post?.likeCount ?? post?.likes ?? post?.totalLikes ?? 0,
  };
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

// Loads all data the Home screen needs in a single call.
export const getHomeData = async () => {
  const [initData, feedData, notifData, giftsData, walletData] = await Promise.all([
    getHomeInit(),
    getFeedPosts("for_you", 1, 10),
    getNotifications(),
    getDailyGifts(),
    getWallet(),
  ]);

  const gifts = Array.isArray(giftsData) ? giftsData : (giftsData?.gifts ?? []);
  const notifList = notifData?.notifications?.content
    ?? (Array.isArray(notifData?.notifications) ? notifData.notifications : []);
  const token = await getToken();
  const userProfile = normalizeUserProfile(initData?.userProfile, token);
  const recommendedUsers = listFrom(initData, "recommendedUsers").map(normalizeRecommendedUser);
  const feedPosts = listFrom(feedData, "posts").map(normalizePost);

  return {
    userProfile,
    stats:             initData?.stats              ?? null,
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

// Refresh the feed back to page 1 — call this after creating a post.
export const refreshFeed = async (tab = "for_you") => {
  const apiTab = toApiTab(tab);
  const data = await getFeedPosts(apiTab, 1, 10);
  const posts = listFrom(data, "posts").map(normalizePost);

  return {
    posts,
    hasMore: data?.hasMore ?? false,
  };
};

// Load next page of feed posts.
export const loadMoreFeed = async (tab, page) => {
  const apiTab = toApiTab(tab);
  const data = await getFeedPosts(apiTab, page, 10);
  const posts = listFrom(data, "posts").map(normalizePost);

  return { ...data, posts };
};

export const loadWalletTransactions = (page = 0, size = 20) =>
  getWalletTransactions(page, size);

export const searchUsersByQuery = (q, page = 0, limit = 20) =>
  searchUsers(q, page, limit);

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
