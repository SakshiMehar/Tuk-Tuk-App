import { getNewUserFrame } from "../api/uiAssetsApi";
import { getUser, updateUser } from "../store/authStore";
import { extractIsNewUser } from "../utils/authResponse";
import {
  parseNewUserFrameAssignment,
  parseNewUserFrameResponse,
  resolveNewUserFrameSource,
  userHasNewUserFrame,
} from "../utils/newUserFrame";
import { loadMyProfile, resolveRemoteProfilePicUrl } from "./meProfileService";

export const shouldUserHaveNewUserFrame = (authData, profile, user) =>
  extractIsNewUser(authData) ||
  Boolean(profile?.hasNewUserFrame) ||
  Boolean(user?.hasNewUserFrame);

export const fetchNewUserFrameAssetUrl = async () => {
  try {
    const data = await getNewUserFrame();
    const frameUrl = parseNewUserFrameResponse(data);
    return frameUrl ? resolveRemoteProfilePicUrl(frameUrl) ?? frameUrl : null;
  } catch {
    return null;
  }
};

const persistNewUserFrame = async ({ frameUrl = null, profile = null } = {}) => {
  const resolvedUrl =
    frameUrl ??
    (profile?.newUserFrameUrl
      ? resolveRemoteProfilePicUrl(profile.newUserFrameUrl) ?? profile.newUserFrameUrl
      : null);

  await updateUser({
    hasNewUserFrame: true,
    newUserFrameUrl: resolvedUrl,
  });

  return resolveNewUserFrameSource(await getUser());
};

export const applyNewUserFrameForLogin = async (authData) => {
  const user = await getUser();
  let profile = null;

  try {
    profile = await loadMyProfile();
  } catch {
    // Profile may lag right after registration.
  }

  const shouldApply =
    shouldUserHaveNewUserFrame(authData, profile, user);

  if (!shouldApply) {
    return null;
  }

  // Always use local bundled asset — clear any stale remote URL
  await updateUser({ hasNewUserFrame: true, newUserFrameUrl: null });
  return resolveNewUserFrameSource(await getUser());
};

export const syncNewUserFrameForSession = async () => {
  const user = await getUser();
  if (!user) return null;

  let profile = null;
  try {
    profile = await loadMyProfile();
  } catch {
    // Use cached user data if profile fetch fails
  }

  const shouldApply =
    Boolean(profile?.hasNewUserFrame) ||
    userHasNewUserFrame(user);

  if (!shouldApply) {
    return null;
  }

  // Mark the user as having the new user frame — always use local asset
  if (!userHasNewUserFrame(user)) {
    await updateUser({ hasNewUserFrame: true, newUserFrameUrl: null });
  }

  return resolveNewUserFrameSource(await getUser());
};

export const syncNewUserFrameFromSession = syncNewUserFrameForSession;
