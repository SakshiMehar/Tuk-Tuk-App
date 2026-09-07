import { getUserById, getUserProfileDetails } from "../api/userApi";
import {
  loadRelationshipStatus,
  followUser as apiFollowUser,
  unfollowUser as apiUnfollowUser,
} from "./relationshipService";
import { extractVipProfileFrameUrl } from "../utils/vipProfileFrame";

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
export const normalizePublicProfile = (data, details) => {
  const user = data?.user ?? data?.data ?? data ?? {};
  const profile = user?.profile ?? user?.userProfile ?? user;

  const detailsUser = details?.user ?? details?.data ?? details ?? {};

  const userId = firstValue(
    user?.id, user?.userId, user?._id, profile?.id, profile?.userId,
    detailsUser?.id, detailsUser?.userId
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
    // A VIP user counts as verified too — same convention as
    // normalizeRelationshipUser (following/followers lists), where a VIP
    // badge already implies the verified checkmark.
    verified: Boolean(
      user?.verified ??
      user?.isVerified ??
      profile?.verified ??
      user?.vip ??
      profile?.vip ??
      detailsUser?.verified ??
      detailsUser?.vip
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
  };
};

export const loadPublicProfile = async (userId) => {
  const [profileResult, detailsResult, statusResult] = await Promise.allSettled([
    getUserById(userId),
    getUserProfileDetails(userId),
    loadRelationshipStatus(userId),
  ]);

  const detailsData =
    detailsResult.status === "fulfilled" ? detailsResult.value : null;

  const profile =
    profileResult.status === "fulfilled"
      ? normalizePublicProfile(profileResult.value, detailsData)
      : null;

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
