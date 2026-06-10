import {
  followUser as apiFollow,
  unfollowUser as apiUnfollow,
  blockUser as apiBlock,
  unblockUser as apiUnblock,
  getRelationshipStatus,
  getFollowing,
  getFollowers,
  getBlockedUsers,
} from "../api/relationshipApi";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const listFrom = (value) => {
  if (Array.isArray(value)) return value;
  return value?.content ?? value?.data ?? value?.users ?? value?.items ?? [];
};

export const isSameUser = (a, b) => {
  if (a == null || b == null) return false;
  return String(a) === String(b);
};

export const normalizeRelationshipUser = (user) => {
  const userId = firstValue(user?.userId, user?.id, user?._id);
  const username = firstText(user?.username, user?.handle);

  return {
    ...user,
    id: userId,
    userId,
    name: firstText(user?.name, user?.username, user?.displayName, user?.fullName) ?? "User",
    avatar: firstText(
      user?.avatar,
      user?.avatarUrl,
      user?.profilePicUrl,
      user?.profileImageUrl,
      user?.profileImage,
      user?.photoUrl
    ),
    handle: username ? (username.startsWith("@") ? username : `@${username}`) : "",
    verified: Boolean(user?.verified ?? user?.vip),
    online: Boolean(user?.isOnline ?? user?.online),
  };
};

export const parseRelationshipList = (data) =>
  listFrom(data).map(normalizeRelationshipUser).filter((u) => u.userId != null);

export const parseRelationshipStatus = (data) => ({
  following: Boolean(
    data?.following ?? data?.isFollowing ?? data?.followed ?? data?.status === "FOLLOWING"
  ),
  followedBy: Boolean(data?.followedBy ?? data?.follower ?? data?.isFollower),
  blocked: Boolean(data?.blocked ?? data?.isBlocked ?? data?.status === "BLOCKED"),
});

export const loadFollowing = async () => parseRelationshipList(await getFollowing());

export const loadFollowers = async () => parseRelationshipList(await getFollowers());

export const loadBlocked = async () => parseRelationshipList(await getBlockedUsers());

export const loadRelationshipStatus = async (targetId) => {
  const data = await getRelationshipStatus(targetId);
  return parseRelationshipStatus(data);
};

export const followUser = (targetId) => apiFollow(targetId);
export const unfollowUser = (targetId) => apiUnfollow(targetId);
export const blockUser = (targetId) => apiBlock(targetId);
export const unblockUser = (targetId) => apiUnblock(targetId);
