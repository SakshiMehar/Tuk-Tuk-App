import { getUserById, getUserProfile, getUserProfileDetails } from "../api/userApi";
import {
  loadRelationshipStatus,
  followUser as apiFollowUser,
  unfollowUser as apiUnfollowUser,
} from "./relationshipService";
import { extractVipProfileFrameUrl } from "../utils/vipProfileFrame";
import { isUserOnline, isUserLive } from "../utils/liveStatus";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const firstNumber = (...values) => {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
};

// GET /api/app/users/{id} does not return post/follower/following/visitor
// counts for another user, so those are filled in from
// GET /api/app/users/{id}/profile-details (see getUserProfileDetails)
// when available. A missing value stays `null` ("unavailable"), it must
// never be shown as 0.
export const normalizePublicProfile = (data, details, dynamicProfile) => {
  const user = data?.user ?? data?.data ?? data ?? {};
  const profile = user?.profile ?? user?.userProfile ?? user;

  const detailsUser = details?.user ?? details?.data ?? details ?? {};
  // GET /api/app/users/user/profile/{userId} — the confirmed source of
  // truth for `verified`, fetched alongside the other two above.
  const dynamicUser = dynamicProfile?.data ?? dynamicProfile?.user ?? dynamicProfile ?? {};

  const userId = firstValue(
    user?.id, user?.userId, user?._id, profile?.id, profile?.userId,
    detailsUser?.id, detailsUser?.userId
  );

  const explicitOnline =
    dynamicUser?.online ?? dynamicUser?.isOnline ??
    user?.online ?? user?.isOnline ??
    detailsUser?.online ?? detailsUser?.isOnline ??
    profile?.online ?? profile?.isOnline ?? null;

  const rawStatus = String(
    dynamicUser?.status || dynamicUser?.userStatus || dynamicUser?.liveStatus ||
    user?.status || user?.userStatus || user?.liveStatus ||
    detailsUser?.status || detailsUser?.userStatus ||
    profile?.status || profile?.userStatus || ""
  ).toUpperCase();

  const isStatusOnline = rawStatus === "ONLINE" || rawStatus === "ONLINE_IN_ROOM";
  const isStatusLive = rawStatus === "LIVE" || rawStatus === "IN_PARTY";

  const computedOnline = Boolean(
    explicitOnline !== null
      ? explicitOnline
      : (isStatusOnline || isUserOnline({ id: userId, userId }))
  );

  const explicitLive =
    dynamicUser?.isLive ?? dynamicUser?.live ??
    user?.isLive ?? user?.live ??
    detailsUser?.isLive ?? detailsUser?.live ??
    profile?.isLive ?? profile?.live ?? null;

  const computedLive = Boolean(
    explicitLive !== null
      ? explicitLive
      : (isStatusLive || isUserLive({ id: userId, userId }))
  );

  return {
    userId: userId != null ? String(userId) : null,
    name:
      firstText(
        user?.name, user?.username, user?.displayName, profile?.name, profile?.username,
        detailsUser?.name, detailsUser?.username
      ) ?? "User",
    avatarUrl: firstText(
      user?.profilePicUrl,
      user?.avatarUrl,
      user?.avatar,
      user?.profileImageUrl,
      profile?.profilePicUrl,
      profile?.avatarUrl,
      profile?.avatar,
      detailsUser?.profilePicUrl,
      detailsUser?.avatarUrl
    ),
    bio: firstText(
      detailsUser?.introduction, detailsUser?.bio, detailsUser?.about,
      user?.bio, user?.about, user?.status, profile?.bio, profile?.about
    ),
    // Backend sends the checkmark as an asset URL, not a boolean flag.
    verifiedBadgeUrl: firstText(
      dynamicUser?.verifiedBadgeUrl,
      user?.verifiedBadgeUrl,
      profile?.verifiedBadgeUrl,
      detailsUser?.verifiedBadgeUrl
    ),
    vipProfileFrameUrl: extractVipProfileFrameUrl(user) ?? extractVipProfileFrameUrl(profile),
    age: firstNumber(user?.age, profile?.age, detailsUser?.age),
    gender: firstText(user?.gender, profile?.gender, detailsUser?.gender),
    followingCount: firstNumber(
      detailsUser?.followingCount, detailsUser?.followingsCount,
      user?.followingCount, profile?.followingCount
    ),
    followersCount: firstNumber(
      detailsUser?.followersCount, detailsUser?.followerCount,
      user?.followersCount, profile?.followersCount
    ),
    visitorCount: firstNumber(
      detailsUser?.visitorCount, detailsUser?.visitorsCount, detailsUser?.visitCount,
      user?.visitorCount, profile?.visitorCount
    ),
    postsCount: firstNumber(detailsUser?.postsCount, user?.postsCount, profile?.postsCount),
    level: firstNumber(detailsUser?.level, user?.level, profile?.level),
    countryCode: firstText(user?.countryCode, profile?.countryCode, detailsUser?.countryCode),
    countryName: firstText(user?.countryName, profile?.countryName, detailsUser?.countryName),
    flagUrl: firstText(user?.flagUrl, profile?.flagUrl, detailsUser?.flagUrl),
    badgeUrl: firstText(user?.badgeUrl, profile?.badgeUrl, detailsUser?.badgeUrl),
    status: firstText(
      dynamicUser?.status, dynamicUser?.userStatus, dynamicUser?.liveStatus,
      user?.status, user?.userStatus, user?.liveStatus,
      detailsUser?.status, detailsUser?.userStatus,
      profile?.status, profile?.userStatus
    ),
    online: computedOnline,
    isOnline: computedOnline,
    isLive: computedLive,
    live: computedLive,
    roomId: firstValue(
      dynamicUser?.roomId, dynamicUser?.currentRoomId, dynamicUser?.liveRoomId,
      user?.roomId, user?.currentRoomId, user?.liveRoomId,
      detailsUser?.roomId, detailsUser?.currentRoomId,
      profile?.roomId, profile?.currentRoomId
    ),
  };
};

export const loadPublicProfile = async (userId) => {
  console.log(`[publicProfileService] loadPublicProfile started for userId: ${userId}`);
  const [profileResult, detailsResult, statusResult, dynamicResult] = await Promise.allSettled([
    getUserById(userId),
    getUserProfileDetails(userId),
    loadRelationshipStatus(userId),
    getUserProfile(userId),
  ]);

  const detailsData =
    detailsResult.status === "fulfilled" ? detailsResult.value : null;

  const dynamicData =
    dynamicResult.status === "fulfilled" ? dynamicResult.value : null;

  const profile =
    profileResult.status === "fulfilled"
      ? normalizePublicProfile(profileResult.value, detailsData, dynamicData)
      : null;

  console.log(`[publicProfileService] loadPublicProfile result for userId: ${userId}:`, {
    profile,
    rawUserById: profileResult.status === "fulfilled" ? profileResult.value : null,
    rawProfileDetails: detailsData,
    rawDynamicProfile: dynamicData,
  });

  const status =
    statusResult.status === "fulfilled"
      ? statusResult.value
      : { following: false, followedBy: false, blocked: false };

  // The /profile-details endpoint returns a `posts` array directly —
  // use it so the Moment tab shows real content without a separate request.
  const posts = Array.isArray(detailsData?.posts) ? detailsData.posts : [];

  return { profile, status, posts };
};

export const toggleFollowUser = (userId, currentlyFollowing) =>
  currentlyFollowing ? apiUnfollowUser(userId) : apiFollowUser(userId);
