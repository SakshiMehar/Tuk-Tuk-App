import { resolveRemoteProfilePicUrl } from "../services/meProfileService";
import { resolveImageSource } from "./videoSource";

const LOCAL_LEVEL_BADGES = {
  1: require("../../assets/level/level1.png"),
  2: require("../../assets/level/level2.png"),
  3: require("../../assets/level/level3.png"),
  4: require("../../assets/level/level4.png"),
  5: require("../../assets/level/level5.png"),
  6: require("../../assets/level/level6.png"),
  10: require("../../assets/level/level10.png"),
  11: require("../../assets/level/level11.png"),
  12: require("../../assets/level/level12.png"),
  13: require("../../assets/level/level13.png"),
  15: require("../../assets/level/level15.png"),
  16: require("../../assets/level/level16.png"),
  20: require("../../assets/level/level20.png"),
  21: require("../../assets/level/level21.png"),
  22: require("../../assets/level/level22.png"),
  30: require("../../assets/level/level30.png"),
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
  LOCAL_LEVEL_BADGES[normalizeUserLevel(level, DEFAULT_USER_LEVEL)] ??
  LOCAL_LEVEL_BADGES[DEFAULT_USER_LEVEL];

export const resolveLevelBadgeSource = (user, levelOverride = null) => {
  const level = normalizeUserLevel(levelOverride ?? user?.level, null);
  if (!level) return null;

  const remote = resolveRemoteProfilePicUrl(user?.levelBadgeUrl);
  if (remote) return resolveImageSource(remote);
  return resolveLocalLevelBadge(level);
};
