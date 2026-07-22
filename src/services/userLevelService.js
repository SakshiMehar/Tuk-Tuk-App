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
import { loadGamificationProfile } from "./gamificationService";

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

/** Persists `level` on the local user record (if changed) and returns the shared
 *  { level, badgeSource } shape every caller (profile.jsx, WalletUserCard, UserLevelPanel)
 *  already expects. `xp` is the full gamification profile, only populated when that
 *  endpoint succeeded — extra data for callers that want it (e.g. UserLevelPanel's XP
 *  gauge), ignored by callers that don't. */
const persistAndBuildResult = async (user, level, xp = null) => {
  const needsUpdate = user?.level !== level;
  if (needsUpdate) {
    // Clear any stale remote badge URL — we use local assets now
    await updateUser({ level, levelBadgeUrl: null });
  }
  const updated = await getUser();
  return {
    level: updated?.level ?? level,
    badgeSource: resolveLevelBadgeSource(updated, level),
    xp,
  };
};

export const syncUserLevelForSession = async () => {
  const user = await getUser();
  if (!user) return { level: null, badgeSource: null, xp: null };

  // The gamification profile is the authoritative level/XP source now — prefer it,
  // and fall back to the old profile-derived level below if it's not available yet.
  try {
    const gamification = await loadGamificationProfile();
    const level = normalizeUserLevel(gamification?.level, DEFAULT_USER_LEVEL);
    return await persistAndBuildResult(user, level, gamification);
  } catch {
    // Gamification endpoint not live/reachable — fall through to profile-derived level.
  }

  let profile = null;
  try {
    profile = await loadMyProfile();
  } catch {
    const level = resolveLevelFromSources(user, null);
    return {
      level,
      badgeSource: level ? resolveLevelBadgeSource(user, level) : null,
      xp: null,
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

  return persistAndBuildResult(user, level, null);
};
