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

const mapObjectToUserList = (map) =>
  Object.entries(map).map(([key, val]) => {
    if (val && typeof val === "object") {
      return {
        ...val,
        userId: firstValue(val.userId, val.id, val._id, key),
        id: firstValue(val.userId, val.id, val._id, key),
      };
    }
    return { userId: key, id: key, name: String(val) };
  });

const listFrom = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  for (const key of ["blockUsers", "blockedUsers", "blocked", "users", "items"]) {
    const bucket = value[key];
    if (bucket && typeof bucket === "object" && !Array.isArray(bucket)) {
      return mapObjectToUserList(bucket);
    }
  }

  const nested =
    value.content ??
    value.data ??
    value.users ??
    value.items ??
    value.blockedUsers ??
    value.blockUsers ??
    value.blocked ??
    value.results ??
    null;

  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === "object") return listFrom(nested);

  return [];
};

const unwrapBlockedEntry = (entry) => {
  if (!entry || typeof entry !== "object") return entry;
  return entry.user ?? entry.targetUser ?? entry.blockedUser ?? entry.profile ?? entry;
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

export const parseBlockedUsers = (data) => {
  const rawList = listFrom(data);
  if (rawList.length === 0 && data && typeof data === "object") {
    
  }

  const parsed = rawList
    .map((entry) => {
      const raw = unwrapBlockedEntry(entry);
      const userId = firstValue(
        entry?.targetUserId,
        entry?.targetId,
        entry?.blockedUserId,
        entry?.blockedId,
        entry?.userId,
        entry?.id,
        raw?.userId,
        raw?.id,
        raw?._id,
        typeof entry === "string" || typeof entry === "number" ? entry : null
      );
      return normalizeRelationshipUser({
        ...(typeof entry === "object" ? entry : {}),
        ...(typeof raw === "object" ? raw : {}),
        userId,
        id: userId,
      });
    })
    .filter((u) => u.userId != null);

  if (rawList.length > 0 && parsed.length === 0) {
    
  }

  return parsed;
};

export const parseRelationshipStatus = (data) => ({
  following: Boolean(
    data?.following ?? data?.isFollowing ?? data?.followed ?? data?.status === "FOLLOWING"
  ),
  followedBy: Boolean(data?.followedBy ?? data?.follower ?? data?.isFollower),
  blocked: Boolean(data?.blocked ?? data?.isBlocked ?? data?.status === "BLOCKED"),
});

export const loadFollowing = async () => parseRelationshipList(await getFollowing());

export const loadFollowers = async () => parseRelationshipList(await getFollowers());

export const loadBlocked = async () => {
  const data = await getBlockedUsers();
  const list = parseBlockedUsers(data);
  
  return list;
};

export const loadRelationshipStatus = async (targetId) => {
  const data = await getRelationshipStatus(targetId);
  return parseRelationshipStatus(data);
};

export const followUser = (targetId) => apiFollow(targetId);
export const unfollowUser = (targetId) => apiUnfollow(targetId);
export const blockUser = (targetId) => apiBlock(targetId);
export const unblockUser = (targetId) => apiUnblock(targetId);
