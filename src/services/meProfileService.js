import {
  getMyProfile,
  patchMyProfile,
  uploadMyProfilePic,
} from "../api/profileApi";
import { API_BASE_URL } from "../config/env";
import {
  getAvatarSource,
  isBundledAvatarId,
  resolveBundledAvatarId,
} from "../data/avatarOptions";

import { normalizeUserLevel } from "../utils/levelBadge";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ??
  null;

export const resolveRemoteProfilePicUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Backend returns paths like /uploads/profile/uuid.jpg
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/")) {
    return `${API_BASE_URL}${trimmed}`;
  }
  return `${API_BASE_URL}/${trimmed}`;
};

const unwrapProfile = (data) => data?.profile ?? data?.data ?? data ?? {};

/** Bundled avatars are remote S3 URLs — fetch real bytes and convert to a
 *  data: URI so the multipart upload actually carries image data. A plain
 *  { uri: "https://..." } FormData part only reads local device files, and
 *  a raw Blob fetched from a remote URL fails with ERR_NETWORK when handed
 *  to a separate upload request (RN ties Blobs to the network module that
 *  created them) — a data: URI sidesteps both issues. */
const fetchAvatarAsDataUri = (uri) =>
  fetch(uri)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load avatar image (${response.status})`);
      }
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Could not read avatar image"));
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        })
    );

/** Trust the known file extension, not the fetched blob's own Content-Type —
 *  S3 sometimes serves .webp/.png assets as generic application/octet-stream,
 *  which would otherwise mislabel a real image as a non-image upload. */
const mimeTypeFromFileExtension = (uri) => {
  const ext = uri?.split("?")?.[0]?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "image/jpeg";
};

export const parseMeProfile = (data) => {
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
        String(raw.profileFrameType).toLowerCase().includes("new"))
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
    name: firstText(raw.name, raw.nickname, raw.displayName) ?? "",
    email: raw.email ?? null,
    phoneNumber: raw.phoneNumber ?? null,
    gender: firstText(raw.gender, raw.sex) ?? null,
    country: firstText(raw.country, raw.countryName) ?? "",
    countryName: firstText(raw.countryName, raw.country) ?? "",
    countryCode: raw.countryCode ?? "",
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
  const parsed = parseMeProfile(data);
  
  return parsed;
};

export const saveMyProfile = async ({ name, avatarId, profilePicUrl } = {}) => {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const hasNameChange = Boolean(trimmedName);
  const hasAvatarChange = Boolean(avatarId);
  const hasCustomPicChange =
    !hasAvatarChange && Boolean(profilePicUrl) && !isBundledAvatarId(profilePicUrl);

  if (!hasNameChange && !hasAvatarChange && !hasCustomPicChange) {
    return null;
  }

  // Picking a bundled avatar now goes through the same multipart upload
  // endpoint as a custom photo (PATCH /profile-pic) — the backend requires
  // every profile picture to be uploaded that way, not referenced by URL.
  if (hasAvatarChange) {
    const resolvedAvatar = getAvatarSource(avatarId);
    if (resolvedAvatar?.uri) {
      const dataUri = await fetchAvatarAsDataUri(resolvedAvatar.uri);
      const mimeType = mimeTypeFromFileExtension(resolvedAvatar.uri);
      const fileName = resolvedAvatar.uri.split("/").pop()?.split("?")[0] || "avatar.jpg";
      await uploadMyProfilePic({ uri: dataUri, mimeType, fileName });
    }
  }

  const payload = {};
  if (hasNameChange) payload.name = trimmedName;
  if (hasCustomPicChange) payload.profilePicUrl = profilePicUrl;

  if (Object.keys(payload).length) {
    await patchMyProfile(payload);
  }

  return loadMyProfile();
};

export const uploadProfilePicture = async (asset = {}) => {
  if (!asset?.uri) {
    throw new Error("Please choose a profile photo first.");
  }

  // Step 1: multipart upload — FormData field must be "image"
  await uploadMyProfilePic({
    uri: asset.uri,
    mimeType: asset.mimeType ?? asset.type,
    fileName: asset.fileName ?? asset.name,
  });

  // Step 2: confirm persisted URL via GET /api/app/users/me/profile
  const confirmed = await loadMyProfile();
  

  if (!confirmed.profilePicUrl) {
    throw new Error("Upload succeeded but profile picture URL was not returned.");
  }

  return confirmed;
};
