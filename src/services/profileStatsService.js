import { getProfileVisits } from "../api/userApi";
import { getFollowing, getFollowers } from "../api/relationshipApi";
import {
  parseRelationshipList,
  normalizeRelationshipUser,
} from "./relationshipService";

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const countFromResponse = (data, list, countKeys = []) => {
  if (typeof data === "number") return data;
  if (!data || typeof data !== "object") {
    return Array.isArray(list) ? list.length : 0;
  }

  if (typeof data.totalElements === "number") return data.totalElements;
  if (typeof data.total === "number") return data.total;
  if (typeof data.count === "number") return data.count;
  if (typeof data.totalCount === "number") return data.totalCount;

  for (const key of countKeys) {
    if (typeof data[key] === "number") return data[key];
  }

  const nested = data.profile ?? data.data ?? data.result ?? null;
  if (nested && nested !== data && typeof nested === "object") {
    const nestedCount = countFromResponse(nested, list, countKeys);
    if (nestedCount > 0) return nestedCount;
  }

  return Array.isArray(list) ? list.length : 0;
};

const listFromVisits = (data) => {
  if (Array.isArray(data)) return data;
  return (
    data?.content ??
    data?.visits ??
    data?.profileVisits ??
    data?.data ??
    data?.items ??
    []
  );
};

const unwrapVisitEntry = (entry) => {
  if (!entry || typeof entry !== "object") return entry;
  return (
    entry.visitor ??
    entry.user ??
    entry.visitedBy ??
    entry.viewer ??
    entry.profile ??
    entry
  );
};

export const parseProfileVisitsList = (data) =>
  listFromVisits(data)
    .map((entry) => {
      const raw = unwrapVisitEntry(entry);
      const userId = firstValue(
        entry?.visitorId,
        entry?.userId,
        entry?.id,
        raw?.userId,
        raw?.id,
        raw?._id
      );
      return normalizeRelationshipUser({
        ...(typeof entry === "object" ? entry : {}),
        ...(typeof raw === "object" ? raw : {}),
        userId,
        id: userId,
      });
    })
    .filter((u) => u.userId != null);

export const loadProfileVisitsList = async () => {
  const data = await getProfileVisits(50);
  const list = parseProfileVisitsList(data);
  return list;
};

const loadFollowingStats = async () => {
  const data = await getFollowing();
  const list = parseRelationshipList(data);
  return countFromResponse(data, list, [
    "followingCount",
    "totalFollowing",
    "followingTotal",
  ]);
};

const loadFollowersStats = async () => {
  const data = await getFollowers();
  const list = parseRelationshipList(data);
  return countFromResponse(data, list, [
    "followersCount",
    "totalFollowers",
    "followerCount",
    "followerTotal",
  ]);
};

const loadVisitorStats = async () => {
  const data = await getProfileVisits(50);
  const list = listFromVisits(data);
  return countFromResponse(data, list, [
    "visitorCount",
    "visitorsCount",
    "visitCount",
    "totalVisits",
    "profileVisitCount",
  ]);
};

export const loadProfileStats = async () => {
  const [followingResult, followersResult, visitsResult] = await Promise.allSettled([
    loadFollowingStats(),
    loadFollowersStats(),
    loadVisitorStats(),
  ]);

  return {
    followingCount:
      followingResult.status === "fulfilled" ? followingResult.value : 0,
    followersCount:
      followersResult.status === "fulfilled" ? followersResult.value : 0,
    visitorCount: visitsResult.status === "fulfilled" ? visitsResult.value : 0,
  };
};
