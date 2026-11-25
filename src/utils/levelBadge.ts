import { resolveImageSource } from './videoSource';

const LEVEL_BADGE_BASE_URL =
  'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level';

const LOCAL_LEVEL_BADGES: Record<number, string> = {
  1: `${LEVEL_BADGE_BASE_URL}/level1.png`,
  2: `${LEVEL_BADGE_BASE_URL}/level2.png`,
  3: `${LEVEL_BADGE_BASE_URL}/level3.png`,
  4: `${LEVEL_BADGE_BASE_URL}/level4.png`,
  5: `${LEVEL_BADGE_BASE_URL}/level5.png`,
  6: `${LEVEL_BADGE_BASE_URL}/level6.png`,
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

export const DEFAULT_USER_LEVEL = 1;

export const normalizeUserLevel = (value: any, fallback: any = null): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback ?? DEFAULT_USER_LEVEL;
  return Math.floor(parsed);
};

export const resolveLocalLevelBadge = (level = DEFAULT_USER_LEVEL) => {
  const norm = normalizeUserLevel(level, DEFAULT_USER_LEVEL);
  const uri = LOCAL_LEVEL_BADGES[norm] ?? LOCAL_LEVEL_BADGES[DEFAULT_USER_LEVEL];
  return resolveImageSource(uri);
};

export const parseLevelBadgeResponse = (data: any): string | null => {
  const payload = data?.data ?? data ?? {};
  const asset = payload?.asset ?? payload?.badge ?? payload?.media ?? payload?.uiAsset ?? {};

  const candidates = [
    payload?.imageUrl,
    payload?.url,
    payload?.badgeUrl,
    payload?.assetUrl,
    payload?.mediaUrl,
    asset?.imageUrl,
    asset?.url,
    asset?.badgeUrl,
    typeof payload === 'string' ? payload : null,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
};

export default {
  DEFAULT_USER_LEVEL,
  normalizeUserLevel,
  resolveLocalLevelBadge,
  parseLevelBadgeResponse,
};
