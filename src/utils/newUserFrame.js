import { resolveRemoteProfilePicUrl } from "../services/meProfileService";
import { resolveImageSource } from "./videoSource";

export const LOCAL_NEW_USER_FRAME = require("../../assets/images/new-user-frame.png");

export { NEW_USER_FRAME_LAYOUT, PROFILE_FRAME_LAYOUT } from "../constants/newUserFrameLayout";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const truthyFlag = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  (typeof value === "string" && /^(true|yes|new|1)$/i.test(value.trim()));

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

export const parseNewUserFrameAssignment = (data) => {
  const payload = data?.data ?? data ?? {};
  const user = payload?.user ?? {};

  return (
    truthyFlag(payload?.assigned) ||
    truthyFlag(payload?.active) ||
    truthyFlag(payload?.enabled) ||
    truthyFlag(payload?.eligible) ||
    truthyFlag(payload?.hasFrame) ||
    truthyFlag(payload?.showFrame) ||
    truthyFlag(payload?.assignToUser) ||
    truthyFlag(user?.hasNewUserFrame) ||
    truthyFlag(user?.newUserFrame)
  );
};

export const userHasNewUserFrame = (user) => Boolean(user?.hasNewUserFrame);

export const resolveNewUserFrameSource = (user) => {
  if (!userHasNewUserFrame(user)) return null;
  const remote = resolveRemoteProfilePicUrl(user?.newUserFrameUrl);
  if (remote) return resolveImageSource(remote);
  return LOCAL_NEW_USER_FRAME;
};
