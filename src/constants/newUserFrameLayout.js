/** Shared new-user frame overlay tuning (no imports — safe for any module). */
export const NEW_USER_FRAME_LAYOUT = {
  frameScale: 1.4,
  frameResizeMode: "contain",
  frameOffsetX: 0,
  frameOffsetY: 0,
  frameBleed: 0,
  avatarBoost: 0.78,
  avatarOffsetY: -8,
};

/** @deprecated Use NEW_USER_FRAME_LAYOUT — kept for existing imports. */
export const PROFILE_FRAME_LAYOUT = NEW_USER_FRAME_LAYOUT;
