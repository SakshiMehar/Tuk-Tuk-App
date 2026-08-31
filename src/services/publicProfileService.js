import { getUserById } from "../api/userApi";
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

// GET /api/app/users/{id} does not currently return post/follower/following
// counts for another user (the backend only exposes those for "me" via
// /api/relationships/following|followers, which are self-scoped). These are
// read defensively in case the backend adds them to this response later —
// a missing value stays `null` ("unavailable"), it must never be shown as 0.
export const normalizePublicProfile = (data) => {
  const user = data?.user ?? data?.data ?? data ?? {};
  const profile = user?.profile ?? user?.userProfile ?? user;

  const userId = firstValue(user?.id, user?.userId, user?._id, profile?.id, profile?.userId);

  return {
    userId: userId != null ? String(userId) : null,
    name:
      firstText(user?.name, user?.username, user?.displayName, profile?.name, profile?.username) ??
      "User",
    avatarUrl: firstText(
      user?.profilePicUrl,
      user?.avatarUrl,
      user?.avatar,
      user?.profileImageUrl,
      profile?.profilePicUrl,
      profile?.avatarUrl,
      profile?.avatar
    ),
    bio: firstText(user?.bio, user?.about, user?.status, profile?.bio, profile?.about),
    // A VIP user counts as verified too — same convention as
    // normalizeRelationshipUser (following/followers lists), where a VIP
    // badge already implies the verified checkmark.
    verified: Boolean(
      user?.verified ??
      user?.isVerified ??
      profile?.verified ??
      user?.vip ??
      profile?.vip
    ),
    vipProfileFrameUrl: extractVipProfileFrameUrl(user) ?? extractVipProfileFrameUrl(profile),
    age: firstNumber(user?.age, profile?.age),
    gender: firstText(user?.gender, profile?.gender),
    // Not returned by the current endpoint — see note above.
    followingCount: firstNumber(user?.followingCount, profile?.followingCount),
    followersCount: firstNumber(user?.followersCount, profile?.followersCount),
    visitorCount: firstNumber(user?.visitorCount, profile?.visitorCount),
    postsCount: firstNumber(user?.postsCount, profile?.postsCount),
    // Also not returned anywhere today — no gamification-by-userId endpoint
    // exists yet (/api/app/gamification/me is self-scoped only).
    level: firstNumber(user?.level, profile?.level),
  };
};

export const loadPublicProfile = async (userId) => {
  const [profileResult, statusResult] = await Promise.allSettled([
    getUserById(userId),
    loadRelationshipStatus(userId),
  ]);

  const profile =
    profileResult.status === "fulfilled" ? normalizePublicProfile(profileResult.value) : null;

  const status =
    statusResult.status === "fulfilled"
      ? statusResult.value
      : { following: false, followedBy: false, blocked: false };

  return { profile, status };
};

export const toggleFollowUser = (userId, currentlyFollowing) =>
  currentlyFollowing ? apiUnfollowUser(userId) : apiFollowUser(userId);
