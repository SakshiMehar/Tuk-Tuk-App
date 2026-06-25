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

const isRecentlyCreatedAccount = (createdAt, maxDays = 14) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return Date.now() - created.getTime() < maxDays * 24 * 60 * 60 * 1000;
};

export const shouldUserHaveNewUserFrame = (authData, profile, user) =>
  extractIsNewUser(authData) ||
  Boolean(profile?.hasNewUserFrame) ||
  Boolean(user?.hasNewUserFrame) ||
  isRecentlyCreatedAccount(profile?.createdAt ?? user?.createdAt);

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
  let framePayload = null;

  try {
    profile = await loadMyProfile();
  } catch {
    // Profile may lag right after registration.
  }

  try {
    framePayload = await getNewUserFrame();
  } catch {
    // Fall back to bundled frame asset when API is unavailable.
  }

  const frameUrl = parseNewUserFrameResponse(framePayload);
  const apiAssigned = parseNewUserFrameAssignment(framePayload);
  const shouldApply =
    shouldUserHaveNewUserFrame(authData, profile, user) || apiAssigned;

  if (!shouldApply) {
    return resolveNewUserFrameSource(user);
  }

  return persistNewUserFrame({
    frameUrl: frameUrl ? resolveRemoteProfilePicUrl(frameUrl) ?? frameUrl : null,
    profile,
  });
};

export const syncNewUserFrameForSession = async () => {
  const user = await getUser();
  if (!user) return null;

  let profile = null;
  try {
    profile = await loadMyProfile();
  } catch {
    return resolveNewUserFrameSource(user);
  }

  const shouldApply =
    Boolean(profile?.hasNewUserFrame) ||
    userHasNewUserFrame(user) ||
    isRecentlyCreatedAccount(profile?.createdAt ?? user?.createdAt);

  if (!shouldApply) {
    return resolveNewUserFrameSource(user);
  }

  if (profile?.hasNewUserFrame && !userHasNewUserFrame(user)) {
    await updateUser({ hasNewUserFrame: true });
  }

  const existingUrl = user?.newUserFrameUrl ?? profile?.newUserFrameUrl ?? null;
  if (existingUrl) {
    const normalized = resolveRemoteProfilePicUrl(existingUrl) ?? existingUrl;
    if (normalized !== user?.newUserFrameUrl) {
      await updateUser({ hasNewUserFrame: true, newUserFrameUrl: normalized });
    }
    return resolveNewUserFrameSource(await getUser());
  }

  const frameUrl = await fetchNewUserFrameAssetUrl();
  return persistNewUserFrame({ frameUrl, profile });
};

export const syncNewUserFrameFromSession = syncNewUserFrameForSession;
