export const LOCAL_NEW_USER_FRAME = require("../../assets/images/new-user-frame.png");

export { NEW_USER_FRAME_LAYOUT, PROFILE_FRAME_LAYOUT } from "../constants/newUserFrameLayout";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

export const parseNewUserFrameResponse = (data) => {
  const payload = data?.data ?? data ?? {};
  const asset = payload?.asset ?? payload?.frame ?? payload?.media ?? payload?.uiAsset ?? {};

  return firstText(
    payload?.imageUrl,
    payload?.url,
    payload?.frameUrl,
    payload?.assetUrl,
    payload?.profileFrameUrl,
    payload?.mediaUrl,
    payload?.fileUrl,
    payload?.path,
    payload?.image,
    payload?.src,
    asset?.imageUrl,
    asset?.url,
    asset?.frameUrl,
    asset?.assetUrl,
    asset?.path,
    asset?.src,
    typeof payload === "string" ? payload : null
  );
};

export const userHasNewUserFrame = (user) => Boolean(user?.hasNewUserFrame);

export const resolveNewUserFrameSource = (user) => {
  if (!userHasNewUserFrame(user)) return null;
  // Always use the local bundled frame asset — it is always available offline
  // and doesn't depend on a remote URL being valid.
  return LOCAL_NEW_USER_FRAME;
};

/**
 * Generic "is this a new user" check for entities other than the logged-in
 * user (e.g. a post author) — same signal fields as shouldUserHaveNewUserFrame,
 * but for a plain data object rather than the session user.
 */
export const entityHasNewUserFrame = (entity) =>
  Boolean(
    entity?.hasNewUserFrame ??
      entity?.newUserFrame ??
      entity?.showNewUserFrame ??
      entity?.isNewUser ??
      entity?.newUser ??
      entity?.firstLogin ??
      entity?.isFirstLogin ??
      entity?.isNew
  );

export const resolveEntityNewUserFrameSource = (entity) =>
  entityHasNewUserFrame(entity) ? LOCAL_NEW_USER_FRAME : null;
