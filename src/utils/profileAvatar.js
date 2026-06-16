import {
  getAvatarSource,
  DEFAULT_AVATAR_ID,
} from "../data/avatarOptions";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ??
  null;

/** Image `source` for the current user's profile avatar (local asset or remote URL). */
export const resolveProfileAvatarSource = (user) => {
  if (user?.useLocalAvatar && user?.avatarId) {
    return getAvatarSource(user.avatarId);
  }

  const remoteUrl = firstText(
    user?.profilePicUrl,
    user?.avatarUrl,
    user?.avatar,
    user?.profileImageUrl,
    user?.profileImage
  );
  if (remoteUrl) {
    return { uri: remoteUrl };
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
