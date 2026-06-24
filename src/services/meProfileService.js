import {
  getMyProfile,
  patchMyProfile,
  uploadMyProfilePic,
} from "../api/profileApi";
import { API_BASE_URL } from "../config/env";
import {
  isBundledAvatarId,
  resolveBundledAvatarId,
} from "../data/avatarOptions";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

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

export const parseMeProfile = (data) => {
  const raw = unwrapProfile(data);
  const avatarId =
    resolveBundledAvatarId(raw.avatar, raw.avatarId) ??
    resolveBundledAvatarId(raw.profilePicUrl) ??
    null;
  const remotePic = firstText(raw.profilePicUrl, raw.avatarUrl, raw.avatar, raw.photoUrl);
  const profilePicUrl = isBundledAvatarId(remotePic)
    ? null
    : resolveRemoteProfilePicUrl(remotePic);

  return {
    id: raw.id ?? raw.userId ?? null,
    name: firstText(raw.name, raw.nickname, raw.displayName) ?? "",
    email: raw.email ?? null,
    phoneNumber: raw.phoneNumber ?? null,
    country: firstText(raw.country, raw.countryName) ?? "",
    countryName: firstText(raw.countryName, raw.country) ?? "",
    countryCode: raw.countryCode ?? "",
    avatarId,
    profilePicUrl,
    role: raw.role ?? null,
  };
};

export const loadMyProfile = async () => {
  const data = await getMyProfile();
  const parsed = parseMeProfile(data);
  
  return parsed;
};

export const saveMyProfile = async ({ name, avatarId, profilePicUrl } = {}) => {
  const payload = {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (trimmedName) payload.name = trimmedName;
  if (avatarId) payload.avatar = avatarId;
  if (profilePicUrl && !isBundledAvatarId(profilePicUrl)) {
    payload.profilePicUrl = profilePicUrl;
  }

  if (!Object.keys(payload).length) {
    
    return null;
  }

  
  const data = await patchMyProfile(payload);
  const parsed = parseMeProfile(data);
  
  return parsed;
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
