import { buyPremiumTier } from "../api/premiumApi";
import { getMyUiAssets } from "../api/uiAssetsApi";
import { resolveRemoteProfilePicUrl } from "./meProfileService";

/** Buys a premium tier (1 = Knight, 2 = Baron, ... 7 = Sovereign) with the
 *  signed-in user's diamonds. Throws on failure (insufficient diamonds,
 *  network error, ...) — the caller shows its own alert. */
export const purchasePremiumTier = async (premiumLevel) => {
  const data = await buyPremiumTier(premiumLevel);
  return data?.data ?? data;
};

const NO_PREMIUM_ASSETS = { logo: null };

/** The signed-in user's active premium tier logo, fetched on demand — despite
 *  the field's name, `profileFrameImageUrl` is a small badge/logo image (the
 *  tier crest, same idea as vipAssets.logo), not a ring that wraps the
 *  avatar — render it in the badge row, not as a ProfileAvatarWithFrame
 *  frameSource. Resolves to a ready-to-render URL, or null if there isn't an
 *  active tier (or the request fails); never throws. `badgeUrl` on this same
 *  response mirrors whatever's already equipped via GET
 *  /api/v1/users/:userId/decorations (not premium-specific), so it's
 *  deliberately not surfaced here to avoid rendering the same badge twice. */
export const loadMyPremiumAssets = async () => {
  try {
    const data = await getMyUiAssets();
    const root = data?.data ?? data;
    const logoUrl = root?.profileFrameImageUrl ?? null;
    return {
      logo: logoUrl ? resolveRemoteProfilePicUrl(logoUrl) ?? logoUrl : null,
    };
  } catch {
    return NO_PREMIUM_ASSETS;
  }
};
