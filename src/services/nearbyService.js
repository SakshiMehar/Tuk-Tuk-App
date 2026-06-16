import { getNearbyUsers, getUserById, updateMyLocation } from "../api/userApi";
import { getDeviceCoordinates } from "../utils/deviceLocation";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const listFrom = (value) => {
  if (Array.isArray(value)) return value;
  return value?.content ?? value?.users ?? value?.data ?? value?.items ?? [];
};

const formatDistance = (user) => {
  const km = firstValue(user?.distanceKm, user?.distance_km, user?.distance);
  if (typeof km === "number" && !Number.isNaN(km)) {
    if (km === 0) return "0 km";
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }
  if (typeof km === "string" && km.trim()) return km;
  return "Nearby";
};

const formatDisplayName = (name, age) => {
  const label = name ?? "User";
  if (age === undefined || age === null || age === "" || age === "—") return label;
  return `${label}, ${age}`;
};

const CARD_GRADIENTS = [
  ["#3b1f6e", "#7c4dff"],
  ["#1a3a5c", "#0077b6"],
  ["#4a1942", "#c2185b"],
  ["#1b3a2d", "#2e7d32"],
  ["#1a2a4a", "#1565c0"],
  ["#3e1f00", "#e65100"],
];

const EMOJI_POOL = ["🧝‍♀️", "🧜‍♀️", "🧚‍♀️", "🧞‍♀️", "🧙‍♀️", "👩‍🎤"];

export const normalizeNearbyUser = (user, index = 0) => {
  const profile = user?.profile ?? user?.userProfile ?? user;
  const id = String(
    firstValue(user?.id, user?.userId, user?._id, profile?.id, profile?.userId) ?? index
  );
  const tags =
    profile?.interests ??
    profile?.tags ??
    user?.interests ??
    user?.tags ??
    [];

  return {
    id,
    userId: id,
    name:
      firstText(
        user?.name,
        user?.username,
        user?.displayName,
        profile?.name,
        profile?.username
      ) ?? "User",
    displayName: formatDisplayName(
      firstText(
        user?.name,
        user?.username,
        user?.displayName,
        profile?.name,
        profile?.username
      ) ?? "User",
      firstValue(user?.age, profile?.age)
    ),
    age: firstValue(user?.age, profile?.age) ?? null,
    distance: formatDistance(user),
    distanceKm: firstValue(user?.distanceKm, user?.distance_km),
    emoji: EMOJI_POOL[index % EMOJI_POOL.length],
    bgColors: CARD_GRADIENTS[index % CARD_GRADIENTS.length],
    avatarUrl: firstText(
      user?.profilePicUrl,
      user?.profilePic,
      user?.avatarUrl,
      user?.avatar,
      user?.profileImageUrl,
      profile?.profilePicUrl,
      profile?.avatarUrl,
      profile?.avatar
    ),
    bio:
      firstText(
        user?.bio,
        user?.about,
        user?.status,
        profile?.bio,
        profile?.about,
        profile?.status
      ) ?? "No bio yet",
    tags: Array.isArray(tags) ? tags.slice(0, 6) : [],
    online: Boolean(user?.online ?? user?.isOnline ?? profile?.online ?? profile?.isOnline),
    verified: Boolean(user?.verified ?? user?.isVerified ?? profile?.verified),
    raw: user,
  };
};

export const normalizeUserDetail = (data, fallback = null) => {
  const user = data?.user ?? data?.data ?? data ?? fallback ?? {};
  return normalizeNearbyUser(user, 0);
};

export const loadNearbyWithLocation = async ({
  radiusKm = 25,
  page = 0,
  limit = 20,
} = {}) => {
  console.log("[nearbyService] loadNearbyWithLocation start", { radiusKm, page, limit });
  const coords = await getDeviceCoordinates();
  if (!coords.ok) {
    console.log("[nearbyService] location unavailable:", coords.reason);
    return { ok: false, reason: coords.reason, users: [] };
  }

  const { latitude, longitude } = coords;
  console.log("[nearbyService] updating my location", { latitude, longitude });
  await updateMyLocation({ latitude, longitude });

  console.log("[nearbyService] fetching nearby users", { latitude, longitude, radiusKm, page, limit });
  const data = await getNearbyUsers({
    lat: latitude,
    lng: longitude,
    radiusKm,
    page,
    limit,
  });

  const rawList = listFrom(data);
  const users = rawList.map((entry, index) => normalizeNearbyUser(entry, index));
  console.log("[nearbyService] nearby users loaded:", users.length, users.map((u) => ({
    id: u.id,
    name: u.name,
    distanceKm: u.distanceKm,
    avatarUrl: u.avatarUrl,
  })));

  return {
    ok: true,
    users,
    latitude,
    longitude,
    hasMore: Boolean(data?.hasMore ?? data?.hasNext ?? false),
  };
};

export const loadUserDetail = async (userId) => {
  console.log("[nearbyService] loadUserDetail", userId);
  const data = await getUserById(userId);
  const profile = normalizeUserDetail(data);
  console.log("[nearbyService] user detail loaded:", profile.id, profile.name);
  return profile;
};
