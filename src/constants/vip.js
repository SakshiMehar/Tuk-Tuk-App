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

/** Tier-2 VIP cosmetic assets — profileFrame/chatFrame/logo confirmed RGBA. */
export const VIP_TIER2_ASSETS = {
  profileFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/VipProfileFrame2.png",
  entryFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/VipEntryFrame2.png",
  chatFrame: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/VipChatFrame2.png",
  logo: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/viplogo2.png",
};

/** Tiers 3-8 — logo/profileFrame/chatFrame now provided for all six. NOTE
 *  (file inspection): the following have NO alpha channel (flat RGB) and will
 *  show a baked-in background until re-exported as RGBA:
 *   - chatFrame: tier 3, tier 8
 *   - profileFrame: tier 4, 5, 6, 7, 8
 *   - logo: tier 8
 *  Everything else below is confirmed RGBA. */
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

/** ProfileAvatarWithFrame tuning for the VIP profile-frame ring. The component's
 *  default (NEW_USER_FRAME_LAYOUT) is tuned for a different frame asset and left
 *  the avatar photo poking out past the ring's right edge on this one. Contain +
 *  zeroed offsets + a slightly smaller avatar gives the ring room to fully
 *  enclose the photo instead. Re-tune here if it's still not fully covering. */
export const VIP_PROFILE_FRAME_LAYOUT = {
  frameScale: 1.3,
  frameResizeMode: "contain",
  frameOffsetX: 0,
  frameOffsetY: 0,
  frameBleed: 0,
  avatarBoost: 0.92,
  avatarOffsetY: 0,
};
