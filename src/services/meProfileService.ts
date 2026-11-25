import {
  getMyProfile,
  patchMyProfile,
  uploadMyProfilePic,
} from '../api/profileApi';
import { API_BASE_URL } from '../config/env';
import {
  getAvatarSource,
  isBundledAvatarId,
  resolveBundledAvatarId,
} from '../data/avatarOptions';
import { normalizeUserLevel } from '../utils/levelBadge';

const firstText = (...values: any[]) =>
  values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? null;

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ??
  null;

export const resolveRemoteProfilePicUrl = (url: any): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/')) {
    return `${API_BASE_URL}${trimmed}`;
  }
  return `${API_BASE_URL}/${trimmed}`;
};

const unwrapProfile = (data: any) => data?.profile ?? data?.data ?? data ?? {};

const fetchAvatarAsDataUri = (uri: string): Promise<string> =>
  fetch(uri)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load avatar image (${response.status})`);
      }
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('Could not read avatar image'));
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        })
    );

const mimeTypeFromFileExtension = (uri: string): string => {
  const ext = uri?.split('?')?.[0]?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return 'image/jpeg';
};

export const parseMeProfile = (data: any) => {
  const raw = unwrapProfile(data);
  const avatarId =
    resolveBundledAvatarId(raw.avatar, raw.avatarId) ??
    resolveBundledAvatarId(raw.profilePicUrl) ??
    null;
  const remotePic = firstText(
    raw.profilePicUrl,
    raw.profilePic,
    raw.avatarUrl,
    raw.avatar,
    raw.photoUrl
  );
  const profilePicUrl = resolveBundledAvatarId(remotePic)
    ? null
    : resolveRemoteProfilePicUrl(remotePic);

  const hasNewUserFrame = Boolean(
    raw.hasNewUserFrame ??
      raw.newUserFrame ??
      raw.showNewUserFrame ??
      (raw.profileFrameType &&
        String(raw.profileFrameType).toLowerCase().includes('new'))
  );
  const newUserFrameUrl = firstText(
    raw.newUserFrameUrl,
    raw.profileFrameUrl,
    raw.frameUrl
  );
  const level = normalizeUserLevel(
    firstValue(raw.level, raw.honorLevel, raw.userLevel, raw.lv),
    null
  );
  const levelBadgeUrl = firstText(
    raw.levelBadgeUrl,
    raw.levelImageUrl,
    raw.badgeUrl,
    raw.honorBadgeUrl
  );

  return {
    id: firstValue(raw.id, raw.userId, raw.user_id, raw.memberId),
    name: firstText(raw.name, raw.nickname, raw.displayName) ?? '',
    verifiedBadgeUrl: firstText(raw.verifiedBadgeUrl),
    email: raw.email ?? null,
    phoneNumber: raw.phoneNumber ?? null,
    gender: firstText(raw.gender, raw.sex) ?? null,
    country: firstText(raw.country, raw.countryName) ?? '',
    countryName: firstText(raw.countryName, raw.country) ?? '',
    countryCode: raw.countryCode ?? '',
    avatarId,
    profilePicUrl,
    role: raw.role ?? null,
    createdAt: firstText(raw.createdAt, raw.created_at, raw.registeredAt, raw.joinedAt),
    hasNewUserFrame,
    newUserFrameUrl: newUserFrameUrl
      ? resolveRemoteProfilePicUrl(newUserFrameUrl) ?? newUserFrameUrl
      : null,
    level,
    levelBadgeUrl: levelBadgeUrl
      ? resolveRemoteProfilePicUrl(levelBadgeUrl) ?? levelBadgeUrl
      : null,
  };
};

export const loadMyProfile = async () => {
  const data = await getMyProfile();
  return parseMeProfile(data);
};

export const saveMyProfile = async ({ name, avatarId, profilePicUrl }: any = {}) => {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const hasNameChange = Boolean(trimmedName);
  const hasAvatarChange = Boolean(avatarId);
  const hasCustomPicChange =
    !hasAvatarChange && Boolean(profilePicUrl) && !isBundledAvatarId(profilePicUrl);

  if (!hasNameChange && !hasAvatarChange && !hasCustomPicChange) {
    return null;
  }

  if (hasAvatarChange) {
    const resolvedAvatar = getAvatarSource(avatarId);
    if (resolvedAvatar?.uri) {
      try {
        const dataUri = await fetchAvatarAsDataUri(resolvedAvatar.uri);
        const mimeType = mimeTypeFromFileExtension(resolvedAvatar.uri);
        const fileName = resolvedAvatar.uri.split('/').pop()?.split('?')[0] || 'avatar.jpg';
        await uploadMyProfilePic({ uri: dataUri, mimeType, fileName });
      } catch (err) {
        console.warn('[meProfileService] Avatar upload error:', err);
      }
    }
  }

  const payload: any = {};
  if (hasNameChange) payload.name = trimmedName;
  if (hasCustomPicChange) payload.profilePicUrl = profilePicUrl;

  if (Object.keys(payload).length) {
    await patchMyProfile(payload);
  }

  return loadMyProfile();
};

export default {
  resolveRemoteProfilePicUrl,
  parseMeProfile,
  loadMyProfile,
  saveMyProfile,
};
