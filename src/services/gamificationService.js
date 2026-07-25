import { getGamificationMe, getGamificationMeLevel } from "../api/gamificationApi";

const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const firstDefined = (...values) => values.find((v) => v !== undefined && v !== null);

// Unwrap common API wrapper shapes (`{ data: {...} }`, `{ result: {...} }`) rather than
// assuming the profile is always at the top level.
const unwrapRoot = (data) => data?.data ?? data?.result ?? data ?? {};

const normalizeGamificationProfile = (data) => {
  const root = unwrapRoot(data);

  return {
    totalXp: num(firstDefined(root.totalXp, root.xp, root.totalExp)),
    level: num(firstDefined(root.level, root.currentLevel), 1),
    // Confirmed live field names (2026-07-23 API log): xpForCurrentLevel / xpForNextLevel.
    // Old guessed aliases kept as fallbacks in case another environment differs.
    currentLevelXpStart: num(
      firstDefined(root.xpForCurrentLevel, root.currentLevelXpStart, root.levelXpStart, root.currentLevelStartXp)
    ),
    nextLevelXpTarget: num(
      firstDefined(root.xpForNextLevel, root.nextLevelXpTarget, root.nextLevelXp, root.levelXpTarget)
    ),
    xpPerLevel: num(firstDefined(root.xpPerLevel, root.xpForNextLevel)),
    xpToNextLevel: num(
      firstDefined(root.xpToNextLevel, root.remainingXp, root.xpRemaining)
    ),
    dailyXpEarned: num(firstDefined(root.dailyXpEarned, root.dailyXp, root.todayXpEarned)),
    dailyXpCap: num(firstDefined(root.dailyXpCap, root.dailyCap, root.dailyXpLimit)),
    dailyXpRemaining: num(firstDefined(root.dailyXpRemaining, root.dailyRemaining)),
    roomTimeSeconds: num(firstDefined(root.roomSeconds, root.roomTimeSeconds, root.roomTime)),
    giftsSentCount: num(firstDefined(root.giftsSent, root.giftsSentCount)),
    giftCoinsSpent: num(firstDefined(root.giftCoinsSpent, root.coinsSpent)),
    equippedBadge: firstDefined(root.equippedBadgeCode, root.equippedBadge, root.badge) ?? null,
    equippedFrame: firstDefined(root.equippedFrameCode, root.equippedFrame, root.frame) ?? null,
    inventory: Array.isArray(root.inventory)
      ? root.inventory
      : Array.isArray(root.inventoryItems)
      ? root.inventoryItems
      : Array.isArray(root.items)
      ? root.items
      : [],
  };
};

/** GET gamification profile — level/XP/daily-cap/stats/equipped-items/inventory. */
export const loadGamificationProfile = async () => {
  const data = await getGamificationMe();
  const parsed = normalizeGamificationProfile(data);
  console.log("[gamificationService] parsed ->", JSON.stringify(parsed, null, 2));
  return parsed;
};

/** GET dedicated level endpoint (/api/app/gamification/me/level). Logged as-is
 *  wherever the app syncs the user's level (see userLevelService.syncUserLevelForSession) —
 *  not yet normalized/consumed since its response shape hasn't been confirmed. */
export const loadGamificationLevel = async () => {
  const data = await getGamificationMeLevel();
  console.log("[gamificationService] /me/level ->", JSON.stringify(data, null, 2));
  return data;
};
