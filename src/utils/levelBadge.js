import { resolveRemoteProfilePicUrl } from "../services/meProfileService";
import { resolveImageSource } from "./videoSource";

const LEVEL_BADGE_BASE_URL =
  "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level";

const LOCAL_LEVEL_BADGES = {
  1:  `${LEVEL_BADGE_BASE_URL}/level1.png`,
  2:  `${LEVEL_BADGE_BASE_URL}/level2.png`,
  3:  `${LEVEL_BADGE_BASE_URL}/level3.png`,
  4:  `${LEVEL_BADGE_BASE_URL}/level4.png`,
  5:  `${LEVEL_BADGE_BASE_URL}/level5.png`,
  6:  `${LEVEL_BADGE_BASE_URL}/level6.png`,
  10: `${LEVEL_BADGE_BASE_URL}/level10.png`,
  11: `${LEVEL_BADGE_BASE_URL}/level11.png`,
  12: `${LEVEL_BADGE_BASE_URL}/level12.png`,
  13: `${LEVEL_BADGE_BASE_URL}/level13.png`,
  14: `${LEVEL_BADGE_BASE_URL}/level14.png`,
  15: `${LEVEL_BADGE_BASE_URL}/level15.png`,
  16: `${LEVEL_BADGE_BASE_URL}/level16.png`,
  20: `${LEVEL_BADGE_BASE_URL}/level20.png`,
  21: `${LEVEL_BADGE_BASE_URL}/level21.png`,
  22: `${LEVEL_BADGE_BASE_URL}/level22.png`,
  30: `${LEVEL_BADGE_BASE_URL}/level30.png`,
};

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

export const DEFAULT_USER_LEVEL = 1;

export const normalizeUserLevel = (value, fallback = null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
};

export const parseLevelBadgeResponse = (data) => {
  const payload = data?.data ?? data ?? {};
  const asset = payload?.asset ?? payload?.badge ?? payload?.media ?? payload?.uiAsset ?? {};

  return firstText(
    payload?.imageUrl,
    payload?.url,
    payload?.badgeUrl,
    payload?.assetUrl,
    payload?.mediaUrl,
    payload?.fileUrl,
    payload?.path,
    payload?.image,
    payload?.src,
    asset?.imageUrl,
    asset?.url,
    asset?.badgeUrl,
    asset?.assetUrl,
    asset?.path,
    asset?.src,
    typeof payload === "string" ? payload : null
  );
};

export const resolveLocalLevelBadge = (level = DEFAULT_USER_LEVEL) =>
  resolveImageSource(
    LOCAL_LEVEL_BADGES[normalizeUserLevel(level, DEFAULT_USER_LEVEL)] ??
      LOCAL_LEVEL_BADGES[DEFAULT_USER_LEVEL]
  );

export const resolveLevelBadgeSource = (user, levelOverride = null) => {
  const level = normalizeUserLevel(levelOverride ?? user?.level, DEFAULT_USER_LEVEL);

  // GET /api/app/ui-assets/level/:level (fetched in userLevelService and
  // persisted onto the user record as levelBadgeUrl) is the source of
  // truth — it covers every level and reflects whatever art the backend
  // currently has for it. The static map below only covers a handful of
  // levels and is just a fallback for when that fetch hasn't happened yet
  // or failed (e.g. offline).
  const remote = resolveRemoteProfilePicUrl(user?.levelBadgeUrl);
  if (remote) return resolveImageSource(remote);

  const badge = resolveLocalLevelBadge(level);
  if (badge) return badge;

  return resolveLocalLevelBadge(DEFAULT_USER_LEVEL);
};
