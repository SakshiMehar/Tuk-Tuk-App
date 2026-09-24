import {
  getMyVipProfileFrame,
  getMyVipEntryFrame,
  getMyVipChatFrame,
  getMyVipLogo,
  getVipProfileFrameForUser,
} from "../api/vipApi";
import { loadGamificationProfile } from "./gamificationService";
import { resolveRemoteProfilePicUrl } from "./meProfileService";
import { resolveVipTierForXp, resolveVipTierFromAssetUrl, VIP_TIER_THRESHOLDS } from "../constants/vip";

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

/** Each /api/app/vip/me/* endpoint returns a VipAssetResponse — `active`
 *  (is VIP currently unlocked) and `vipLevel` (the backend-confirmed tier)
 *  straight from the source of truth, not just the asset URL. `reachable`
 *  tracks whether the request actually got a response at all, so the
 *  caller can tell "confirmed not VIP" apart from "couldn't ask". */
const fetchVipAsset = async (fetcher, fallbackUrl) => {
  try {
    const data = await fetcher();
    const root = data?.data ?? data;
    const url = parseAssetUrl(data);
    return {
      reachable: true,
      url: url ? resolveRemoteProfilePicUrl(url) ?? url : fallbackUrl,
      active: Boolean(root?.active),
      vipLevel: typeof root?.vipLevel === "number" ? root.vipLevel : null,
    };
  } catch {
    return { reachable: false, url: fallbackUrl, active: false, vipLevel: null };
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
 *
 *  The local XP-threshold guess is used only to pick *fallback* asset URLs —
 *  it never gates whether the real `/api/app/vip/me/*` endpoints get called.
 *  `unlocked` is decided from those endpoints' own `active` flag (the
 *  backend's authoritative answer) whenever at least one of them actually
 *  responded; the XP guess is the fallback only if every endpoint failed to
 *  answer at all (e.g. a network blip), so a real VIP's badge doesn't
 *  disappear just because one unrelated fetch hiccuped, but a backend
 *  "not VIP" also can't be overridden by a stale local guess. */
export const loadMyVipAssets = async (totalXp) => {
  const xp = totalXp ?? (await loadMyVipXp());
  const tierEntry = resolveVipTierForXp(xp);
  const fallback = tierEntry?.assets ?? {};

  const [profileFrame, entryFrame, chatFrame, logo] = await Promise.all([
    fetchVipAsset(getMyVipProfileFrame, fallback.profileFrame ?? null),
    fetchVipAsset(getMyVipEntryFrame, fallback.entryFrame ?? null),
    fetchVipAsset(getMyVipChatFrame, fallback.chatFrame ?? null),
    fetchVipAsset(getMyVipLogo, fallback.logo ?? null),
  ]);

  const results = [profileFrame, entryFrame, chatFrame, logo];
  const anyReachable = results.some((r) => r.reachable);
  const backendActive = results.some((r) => r.active);
  const unlocked = anyReachable ? backendActive : Boolean(tierEntry);

  if (!unlocked) {
    console.log(
      "[vipService] Resolved not-VIP — xp:", xp,
      "tierEntry:", tierEntry?.tier ?? null,
      "anyReachable:", anyReachable,
      "backendActive:", backendActive,
    );
    return NO_VIP_ASSETS;
  }

  // Prefer the backend-confirmed vipLevel, then the tier baked into the
  // actual returned asset URLs, then the XP-threshold guess — the real API
  // result can legitimately be a different tier than what our local
  // thresholds compute (e.g. thresholds here are placeholders for several
  // tiers, see VIP_TIER_THRESHOLDS).
  const backendVipLevel = results.find((r) => r.active && typeof r.vipLevel === "number")?.vipLevel ?? null;
  const tier =
    backendVipLevel ??
    resolveVipTierFromAssetUrl(chatFrame.url) ??
    resolveVipTierFromAssetUrl(profileFrame.url) ??
    resolveVipTierFromAssetUrl(logo.url) ??
    tierEntry?.tier ??
    null;

  // Each asset's own `fallbackUrl` above came from `tierEntry` — the local
  // XP-threshold *guess* computed before `tier` (the backend-confirmed
  // answer) was known. When the backend confirms a different tier than that
  // guess (or the guess was null), an asset whose endpoint didn't return a
  // usable URL is left stuck on the wrong guess's fallback — or null, e.g.
  // logo ending up empty even though `unlocked`/`tier` are correct, so a
  // badge silently fails to render. Re-fall back to the *confirmed* tier's
  // assets so every asset matches the tier already shown elsewhere (chat
  // frame, seat ring), not a stale local guess.
  const confirmedAssets = VIP_TIER_THRESHOLDS.find((t) => t.tier === tier)?.assets ?? null;

  return {
    unlocked: true,
    tier,
    profileFrame: profileFrame.url ?? confirmedAssets?.profileFrame ?? null,
    entryFrame: entryFrame.url ?? confirmedAssets?.entryFrame ?? null,
    chatFrame: chatFrame.url ?? confirmedAssets?.chatFrame ?? null,
    logo: logo.url ?? confirmedAssets?.logo ?? null,
  };
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
