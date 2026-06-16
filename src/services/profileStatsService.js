import { getProfileVisits } from "../api/userApi";
import { getFollowing, getFollowers } from "../api/relationshipApi";
import {
  parseRelationshipList,
  normalizeRelationshipUser,
} from "./relationshipService";

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const countFromResponse = (data, list) => {
  if (typeof data?.totalElements === "number") return data.totalElements;
  if (typeof data?.total === "number") return data.total;
  if (typeof data?.count === "number") return data.count;
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
  console.log("[profileStatsService] loading profile visits list...");
  const data = await getProfileVisits(50);
  const list = parseProfileVisitsList(data);
  console.log("[profileStatsService] profile visits list:", list.length);
  return list;
};

export const loadProfileStats = async () => {
  console.log("[profileStatsService] loading profile stats...");
  const [visitsData, followingData, followersData] = await Promise.all([
    getProfileVisits(50),
    getFollowing(),
    getFollowers(),
  ]);

  const followingList = parseRelationshipList(followingData);
  const followersList = parseRelationshipList(followersData);
  const visitsList = listFromVisits(visitsData);

  const stats = {
    followingCount: countFromResponse(followingData, followingList),
    followersCount: countFromResponse(followersData, followersList),
    visitorCount: countFromResponse(visitsData, visitsList),
  };

  console.log("[profileStatsService] profile stats:", JSON.stringify(stats, null, 2));
  return stats;
};
