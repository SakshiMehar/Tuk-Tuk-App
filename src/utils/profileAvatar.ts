import {
  getAvatarSource,
  resolveBundledAvatarId,
  DEFAULT_AVATAR_ID,
} from '../data/avatarOptions';

const firstText = (...values: any[]) =>
  values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? null;

export const resolveProfileAvatarSource = (user: any) => {
  const bundledId = resolveBundledAvatarId(
    user?.avatarId,
    user?.avatar,
    user?.profilePicUrl
  );
  if (bundledId) {
    return getAvatarSource(bundledId);
  }

  const remoteUrl = firstText(
    user?.avatar,
    user?.profilePicUrl,
    user?.avatarUrl,
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

export const resolveProfileAvatarUri = (user: any): string | null => {
  const source = resolveProfileAvatarSource(user);
  return source?.uri ?? null;
};

export default {
  resolveProfileAvatarSource,
  resolveProfileAvatarUri,
};
