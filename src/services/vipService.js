import {
  getMyVipProfileFrame,
  getMyVipEntryFrame,
  getMyVipChatFrame,
  getMyVipLogo,
  getVipProfileFrameForUser,
} from "../api/vipApi";
import { loadGamificationProfile } from "./gamificationService";
import { resolveRemoteProfilePicUrl } from "./meProfileService";
import { resolveVipTierForXp, resolveVipTierFromAssetUrl } from "../constants/vip";

const NO_VIP_ASSETS = {
  unlocked: false,
  profileFrame: null,
  entryFrame: null,
  chatFrame: null,
  logo: null,
};

const parseAssetUrl = (data) => {
  if (!data) return null;
  if (typeof data === "string") return data;
  const root = data?.data ?? data;
  return (
    root?.url ?? root?.imageUrl ?? root?.frameUrl ?? root?.logoUrl ?? null
  );
};

const fetchVipAsset = async (fetcher, fallbackUrl) => {
  try {
    const url = parseAssetUrl(await fetcher());
    return url ? resolveRemoteProfilePicUrl(url) ?? url : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
};

/** Current user's total gamification XP — the same field WalletUserCard's VIP
 *  progress bar already reads. Returns 0 if the endpoint isn't reachable. */
export const loadMyVipXp = async () => {
  try {
    const gamification = await loadGamificationProfile();
    return gamification?.totalXp ?? 0;
  } catch {
    return 0;
  }
};

/** Resolves the VIP cosmetic set for the current user. `totalXp` can be passed
 *  in if the caller already fetched it (e.g. via syncUserLevelForSession) to
 *  avoid a duplicate gamification request; otherwise it's fetched here.
 *  Below tier 1's threshold, every asset is null and `unlocked` is false —
 *  that's the gate callers should check before rendering any VIP frame/logo.
 *  Above it, the tier is picked from VIP_TIER_THRESHOLDS by the user's actual
 *  XP (not hardcoded to tier 1) — the API result (once confirmed) still takes
 *  priority per asset, this tier's assets are only the fallback. */
export const loadMyVipAssets = async (totalXp) => {
  const xp = totalXp ?? (await loadMyVipXp());
  const tierEntry = resolveVipTierForXp(xp);
  if (!tierEntry) return NO_VIP_ASSETS;

  const fallback = tierEntry.assets;
  const [profileFrame, entryFrame, chatFrame, logo] = await Promise.all([
    fetchVipAsset(getMyVipProfileFrame, fallback.profileFrame),
    fetchVipAsset(getMyVipEntryFrame, fallback.entryFrame),
    fetchVipAsset(getMyVipChatFrame, fallback.chatFrame),
    fetchVipAsset(getMyVipLogo, fallback.logo),
  ]);
  // Prefer the tier baked into the actual returned asset URLs over the
  // XP-threshold guess — the real API result can legitimately be a
  // different tier than what our local thresholds compute (e.g. thresholds
  // here are placeholders for several tiers, see VIP_TIER_THRESHOLDS).
  const tier =
    resolveVipTierFromAssetUrl(chatFrame) ??
    resolveVipTierFromAssetUrl(profileFrame) ??
    tierEntry.tier;

  return { unlocked: true, tier, profileFrame, entryFrame, chatFrame, logo };
};

/** Another user's VIP profile-frame URL, fetched on demand — use only where a
 *  surface doesn't already embed profileFrameImageUrl/profileFrameUrl on the
 *  user/seat/message payload it returns (e.g. a single-user detail view).
 *  Not for list screens — fetching per row would be an N+1 call storm. */
export const fetchVipProfileFrameForUser = async (userId) => {
  if (!userId) return null;
  try {
    const url = parseAssetUrl(await getVipProfileFrameForUser(userId));
    return url ? resolveRemoteProfilePicUrl(url) ?? url : null;
  } catch {
    return null;
  }
};
