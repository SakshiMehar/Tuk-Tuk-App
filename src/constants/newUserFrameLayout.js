/** Shared new-user frame overlay tuning (no imports — safe for any module). */
export const NEW_USER_FRAME_LAYOUT = {
  frameScale: 1.23,
  frameResizeMode: "cover",
  frameOffsetX: -4,
  frameOffsetY: -2,
  frameBleed: 4,
  avatarBoost: 1.06,
  avatarOffsetY: -1,
};

/** @deprecated Use NEW_USER_FRAME_LAYOUT — kept for existing imports. */
export const PROFILE_FRAME_LAYOUT = NEW_USER_FRAME_LAYOUT;
