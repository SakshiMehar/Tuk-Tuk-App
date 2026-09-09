/** XP a user needs (in gamification totalXp) to unlock VIP cosmetics. */
export const VIP_XP_THRESHOLD = 1000;

/** Tier-1 VIP cosmetic assets — used whenever the /api/app/vip/me/* endpoints
 *  are unreachable or return nothing, so the feature still works before the
 *  backend catches up. The API result (once confirmed) always takes priority. */
export const VIP_TIER1_FALLBACK_ASSETS = {
  profileFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip1/VipProfileFrame1.png",
  entryFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip1/VipEntryFrame1.png",
  chatFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip1/VipChatFrame1.png",
  logo: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip1/viplogo1.png",
};

/** Entrance-frame cut into 3 independent pieces (ring / stretchable middle
 *  rod / badge) for use as a full-width home-header decoration — stretching
 *  the single flat entryFrame image across a wide, short row distorted it
 *  badly and collided its own baked-in "ENTERED THE ROOM" text with the
 *  real name/wallet/icons. Cropped from VipEntryFrame1.png (verified via
 *  alpha-channel inspection, not just visually — the ring's hole and the gap
 *  between rod and badge are genuinely transparent). The "ENTERED THE ROOM"
 *  text banner baked into the middle of the source image was deliberately
 *  dropped: it doesn't fit a persistent header (it's meant as a one-time
 *  "user just joined" toast) and can't stretch without distorting.
 *  TIER 1 ONLY so far — tiers 2-8 have wildly different aspect ratios
 *  (874x222 up to 2118x742) so this same crop can't be reused; each needs
 *  its own boundary check before it can get the same treatment. */
export const VIP_TIER1_ENTRY_FRAME_SLICES = {
  ring: require("../../assets/entranceFrames/slices/VipEntryFrame1_ring.png"),
  rod: require("../../assets/entranceFrames/slices/VipEntryFrame1_rod.png"),
  badge: require("../../assets/entranceFrames/slices/VipEntryFrame1_badge.png"),
};

/** Whole (non-sliced) chat-frame image per VIP tier, trimmed down to just the
 *  border artwork. The raw S3 chatFrame PNGs draw their gold border across
 *  only a band in the middle of a much taller/wider canvas (lots of fully
 *  transparent margin above/below/around it) — stretching that raw canvas
 *  straight onto a chat bubble squashed the border into the wrong part of
 *  the box instead of framing it. Each of these is the SAME source S3 image
 *  with that dead transparent margin cropped off (measured per tier via
 *  alpha-channel bounding box), so a single plain `resizeMode="stretch"`
 *  Image now lines the border up with the bubble's actual edges — one whole
 *  image per tier, not split into pieces.
 *
 *  The crop keeps the FULL crown/gem flourish on the VIP badge, which in
 *  every tier's source art sticks up (and slightly down) past the border
 *  rectangle itself — cropping tightly to the rectangle alone chopped the
 *  crown off. `topFrac`/`bottomFrac` say how much taller than the bubble
 *  the image needs to render (as a fraction of the border-rail's own
 *  height) so the rail still lines up exactly with the bubble's edges
 *  while the crown/gem bleeds above/below it instead of being clipped —
 *  see VipChatFrameBorder's use of these in voice-party.jsx. */
export const VIP_CHAT_FRAME_FITTED_BY_TIER = {
  1: { source: require("../../assets/chatFrames/fitted/VipChatFrame1.png"), topFrac: 0.163, bottomFrac: 0.0072 },
  2: { source: require("../../assets/chatFrames/fitted/VipChatFrame2.png"), topFrac: 0.2107, bottomFrac: 0.01 },
  3: { source: require("../../assets/chatFrames/fitted/VipChatFrame3.png"), topFrac: 0.1724, bottomFrac: 0.0108 },
  4: { source: require("../../assets/chatFrames/fitted/VipChatFrame4.png"), topFrac: 0.23, bottomFrac: 0.0064 },
  5: { source: require("../../assets/chatFrames/fitted/VipChatFrame5.png"), topFrac: 0.1873, bottomFrac: 0.0095 },
  6: { source: require("../../assets/chatFrames/fitted/VipChatFrame6.png"), topFrac: 0.2201, bottomFrac: 0.0063 },
  7: { source: require("../../assets/chatFrames/fitted/VipChatFrame7.png"), topFrac: 0.232, bottomFrac: 0.0083 },
  8: { source: require("../../assets/chatFrames/fitted/VipChatFrame8.png"), topFrac: 0.2727, bottomFrac: 0.017 },
};

/** Tier-2 VIP cosmetic assets — profileFrame/chatFrame/logo confirmed RGBA. */
export const VIP_TIER2_ASSETS = {
  profileFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/VipProfileFrame2.png",
  entryFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/VipEntryFrame2.png",
  chatFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/VipChatFrame2.png",
  logo: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/viplogo2.png",
};

/** Tiers 3-8 — logo/profileFrame/chatFrame now provided for all six.
 *  All of profileFrame/chatFrame/logo across tiers 1-8 have been re-verified
 *  (2026-08-13, direct download + alpha-channel inspection) as proper RGBA
 *  with real transparency — the flat-RGB gap noted here previously has since
 *  been fixed on the backend/S3 side. */
export const VIP_TIER3_ASSETS = {
  entryFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip3/VipEntryFrame3.png",
  logo: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip3/viplogo3.png",
  profileFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip3/VipProfileFrame3.png",
  chatFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip3/VipChatFrame3.png",
};
export const VIP_TIER4_ASSETS = {
  entryFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip4/VipEntryFrame4.png",
  logo: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip4/viplogo4.png",
  profileFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip4/VipProfileFrame4.png",
  chatFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip4/VipChatFrame4.png",
};
export const VIP_TIER5_ASSETS = {
  entryFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip5/VipEntryFrame5.png",
  logo: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip5/viplogo5.png",
  profileFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip5/VipProfileFrame5.png",
  chatFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip5/VipChatFrame5.png",
};
export const VIP_TIER6_ASSETS = {
  entryFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip6/VipEntryFrame6.png",
  logo: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip6/viplogo6.png",
  profileFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip6/VipProfileFrame6.png",
  chatFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip6/VipChatFrame6.png",
};
export const VIP_TIER7_ASSETS = {
  entryFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip7/VipEntryFrame7.png",
  logo: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip7/viplogo7.png",
  profileFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip7/VipProfileFrame7.png",
  chatFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip7/VipChatFrame7.png",
};
export const VIP_TIER8_ASSETS = {
  entryFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/VipEntryFrame8.png",
  // NOTE: capitalized on S3 (unlike vip1-7's all-lowercase filename) — confirmed via HTTP check.
  logo: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/Viplogo8.png",
  profileFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/VipProfileFrame8.png",
  chatFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/VipChatFrame8.png",
};

/** Single source of truth for "which tier is this XP" — used both by the tier
 *  carousel (VipCenterPanel) and by loadMyVipAssets (vipService) to pick which
 *  tier's assets to show. Sorted ascending; exp thresholds for tiers 5-8 are
 *  placeholders (continuing the 1000/3000/8000/20000 progression) until the
 *  real values are known — update here, both places will pick it up. */
export const VIP_TIER_THRESHOLDS = [
  { tier: 1, exp: VIP_XP_THRESHOLD, assets: VIP_TIER1_FALLBACK_ASSETS },
  { tier: 2, exp: 3000, assets: VIP_TIER2_ASSETS },
  { tier: 3, exp: 8000, assets: VIP_TIER3_ASSETS },
  { tier: 4, exp: 20000, assets: VIP_TIER4_ASSETS },
  { tier: 5, exp: 50000, assets: VIP_TIER5_ASSETS },
  { tier: 6, exp: 120000, assets: VIP_TIER6_ASSETS },
  { tier: 7, exp: 300000, assets: VIP_TIER7_ASSETS },
  { tier: 8, exp: 700000, assets: VIP_TIER8_ASSETS },
];

/** Reads the tier number straight off a vip-frame asset URL (e.g. ".../vip-frame/vip3/VipChatFrame3.png" -> 3).
 *  Assets returned by the real /api/app/vip/me/* endpoints are the authoritative source of the user's tier —
 *  resolveVipTierForXp() below is only a local XP-threshold guess, used before those endpoints are live/reachable,
 *  and its thresholds can drift out of sync with whatever the backend actually uses. Preferring the tier baked
 *  into the asset URL itself (when present) keeps tier-dependent UI like the chat frame consistent with the tier
 *  already shown elsewhere (e.g. the seat's profile-frame badge), even if the XP-threshold guess disagrees. */
export const resolveVipTierFromAssetUrl = (url) => {
  const match = typeof url === "string" ? url.match(/\/vip-frame\/vip(\d+)\//i) : null;
  return match ? Number(match[1]) : null;
};

/** Highest tier whose exp threshold `xp` clears, or null if below tier 1. */
export const resolveVipTierForXp = (xp) => {
  let current = null;
  for (const entry of VIP_TIER_THRESHOLDS) {
    if (xp >= entry.exp) current = entry;
    else break;
  }
  return current;
};

/** ProfileAvatarWithFrame tuning for the VIP profile-frame ring. The component's
 *  default (NEW_USER_FRAME_LAYOUT) is tuned for a different frame asset and left
 *  the avatar photo poking out past the ring's right edge on this one. Contain +
 *  zeroed offsets + a slightly smaller avatar gives the ring room to fully
 *  enclose the photo instead. Re-tune here if it's still not fully covering. */
export const VIP_PROFILE_FRAME_LAYOUT = {
  frameScale: 1.2,
  frameResizeMode: "contain",
  frameOffsetX: 0,
  frameOffsetY: 0,
  frameBleed: 0,
  avatarBoost: 0.92,
  avatarOffsetY: 0,
};
