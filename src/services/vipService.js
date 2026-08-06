import {
  getMyVipProfileFrame,
  getMyVipEntryFrame,
  getMyVipChatFrame,
  getMyVipLogo,
} from "../api/vipApi";
import { loadGamificationProfile } from "./gamificationService";
import { resolveRemoteProfilePicUrl } from "./meProfileService";
import { VIP_XP_THRESHOLD, VIP_TIER1_FALLBACK_ASSETS } from "../constants/vip";

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
 *  Below VIP_XP_THRESHOLD, every asset is null and `unlocked` is false — that's
 *  the gate callers should check before rendering any VIP frame/logo. */
export const loadMyVipAssets = async (totalXp) => {
  const xp = totalXp ?? (await loadMyVipXp());
  if (xp < VIP_XP_THRESHOLD) return NO_VIP_ASSETS;

  const [profileFrame, entryFrame, chatFrame, logo] = await Promise.all([
    fetchVipAsset(getMyVipProfileFrame, VIP_TIER1_FALLBACK_ASSETS.profileFrame),
    fetchVipAsset(getMyVipEntryFrame, VIP_TIER1_FALLBACK_ASSETS.entryFrame),
    fetchVipAsset(getMyVipChatFrame, VIP_TIER1_FALLBACK_ASSETS.chatFrame),
    fetchVipAsset(getMyVipLogo, VIP_TIER1_FALLBACK_ASSETS.logo),
  ]);

  return { unlocked: true, profileFrame, entryFrame, chatFrame, logo };
};
