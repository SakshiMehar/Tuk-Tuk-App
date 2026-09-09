/** ProfileAvatarWithFrame tuning for backend-assigned per-user decoration
 *  frames (GET /api/v1/users/:userId/decorations), e.g. "special-frame/
 *  tuk-tuk-owner-frame.png".
 *
 *  This asset is NOT a plain ring like the VIP frame — it's a 1024x1536
 *  portrait image with a crown + "Tuk Tuk Owner" banner above the circle
 *  and a decorative flourish below it, so the actual open (transparent)
 *  circle only occupies the middle ~38% of the image's height (measured
 *  directly from the PNG's alpha channel: circle spans y=503..1092 of
 *  1536, x=193..803 of 1024, hole center at 48.6%/51.9% of the image).
 *  Since height is the limiting dimension under resizeMode="contain",
 *  avatarBoost must equal roughly frameScale * 0.383 (the circle-height
 *  ratio) for the avatar photo to land exactly inside that circle instead
 *  of overflowing it and covering the crown/banner/wreath — reusing
 *  VIP_PROFILE_FRAME_LAYOUT's avatarBoost (0.92) here makes the avatar
 *  roughly 1.8x too big for this asset's much smaller opening, which is
 *  why the frame appeared to not "fully" render. Re-measure here if the
 *  backend ever swaps this asset for a different design. */
export const DECORATION_FRAME_LAYOUT = {
  frameScale: 1.6,
  frameResizeMode: "contain",
  frameOffsetX: 0,
  frameOffsetY: 0,
  frameBleed: 0,
  avatarBoost: 0.60,
  avatarOffsetY: 3,
};
