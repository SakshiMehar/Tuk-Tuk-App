import { getLevelBadge } from "../api/uiAssetsApi";
import { getUser, updateUser } from "../store/authStore";
import {
  DEFAULT_USER_LEVEL,
  normalizeUserLevel,
  parseLevelBadgeResponse,
  resolveLevelBadgeSource,
} from "../utils/levelBadge";
import { loadMyProfile, resolveRemoteProfilePicUrl } from "./meProfileService";
import { shouldUserHaveNewUserFrame } from "./newUserFrameService";

const resolveLevelFromSources = (user, profile) =>
  normalizeUserLevel(user?.level ?? profile?.level, null);

export const fetchLevelBadgeAssetUrl = async (level = DEFAULT_USER_LEVEL) => {
  try {
    const data = await getLevelBadge(level);
    const badgeUrl = parseLevelBadgeResponse(data);
    return badgeUrl ? resolveRemoteProfilePicUrl(badgeUrl) ?? badgeUrl : null;
  } catch {
    return null;
  }
};

const persistUserLevel = async ({ level, badgeUrl = null } = {}) => {
  const resolvedLevel = normalizeUserLevel(level, DEFAULT_USER_LEVEL);
  await updateUser({
    level: resolvedLevel,
    ...(badgeUrl ? { levelBadgeUrl: badgeUrl } : {}),
  });

  const user = await getUser();
  return {
    level: user?.level ?? resolvedLevel,
    badgeSource: resolveLevelBadgeSource(user, resolvedLevel),
  };
};

export const applyInitialUserLevelForLogin = async (authData) => {
  const user = await getUser();
  let profile = null;

  try {
    profile = await loadMyProfile();
  } catch {
    // Profile may lag right after registration.
  }

  const existingLevel = resolveLevelFromSources(user, profile);
  const isNewUser = shouldUserHaveNewUserFrame(authData, profile, user);
  const shouldAssignLevel =
    isNewUser || existingLevel == null;

  if (!shouldAssignLevel) {
    return {
      level: existingLevel,
      badgeSource: resolveLevelBadgeSource(user, existingLevel),
    };
  }

  const level = existingLevel ?? DEFAULT_USER_LEVEL;
  const badgeUrl = await fetchLevelBadgeAssetUrl(level);
  return persistUserLevel({ level, badgeUrl });
};

export const syncUserLevelForSession = async () => {
  const user = await getUser();
  if (!user) return { level: null, badgeSource: null };

  let profile = null;
  try {
    profile = await loadMyProfile();
  } catch {
    const level = resolveLevelFromSources(user, null);
    return {
      level,
      badgeSource: level ? resolveLevelBadgeSource(user, level) : null,
    };
  }

  let level = resolveLevelFromSources(user, profile);
  if (level == null && shouldUserHaveNewUserFrame(null, profile, user)) {
    level = DEFAULT_USER_LEVEL;
  }

  if (level == null) {
    // Default to level 1 — every user has at least level 1
    level = DEFAULT_USER_LEVEL;
  }

  let badgeUrl = null; // Always use local assets — remote badge URLs are not reliable

  const needsUpdate = user?.level !== level;

  if (needsUpdate) {
    // Clear any stale remote badge URL — we use local assets now
    await updateUser({ level, levelBadgeUrl: null });
  }

  const updated = await getUser();
  return {
    level: updated?.level ?? level,
    badgeSource: resolveLevelBadgeSource(updated, level),
  };
};
