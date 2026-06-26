import {
  getAvatarSource,
  resolveBundledAvatarId,
  DEFAULT_AVATAR_ID,
} from "../data/avatarOptions";
import { resolveRemoteProfilePicUrl } from "../services/meProfileService";
import { toRemoteImageSource } from "../config/env";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ??
  null;

/** Image `source` for the current user's profile avatar (bundled asset or remote URL). */
export const resolveProfileAvatarSource = (user) => {
  const bundledId = resolveBundledAvatarId(
    user?.avatarId,
    user?.avatar,
    user?.profilePicUrl
  );
  if (bundledId) {
    return getAvatarSource(bundledId);
  }

  const remoteUrl = resolveRemoteProfilePicUrl(
    firstText(
      user?.avatar,
      user?.profilePicUrl,
      user?.avatarUrl,
      user?.profileImageUrl,
      user?.profileImage
    )
  );
  if (remoteUrl) {
    return toRemoteImageSource(remoteUrl);
  }

  if (user?.avatarId) {
    return getAvatarSource(user.avatarId);
  }

  return getAvatarSource(DEFAULT_AVATAR_ID);
};

/** Remote URL when available; null if the avatar is a bundled local asset. */
export const resolveProfileAvatarUri = (user) => {
  const source = resolveProfileAvatarSource(user);
  return source?.uri ?? null;
};
