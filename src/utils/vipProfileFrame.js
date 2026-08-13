import { resolveRemoteProfilePicUrl } from "../services/meProfileService";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

/**
 * Extracts a VIP profile-frame image URL already embedded on a user, seat,
 * chat-summary, or message-like payload. The backend gates this field
 * server-side by the user's own XP (>= VIP_XP_THRESHOLD) — if present, show
 * it; if absent/null, that user isn't VIP-eligible. No client-side XP check
 * needed for entities other than the logged-in user.
 */
export const extractVipProfileFrameUrl = (entity) => {
  if (!entity) return null;
  const vip = entity.vip ?? entity.vipInfo ?? entity.vipProfile ?? {};

  const url = firstText(
    entity.profileFrameImageUrl,
    entity.profileFrameUrl,
    entity.vipProfileFrameUrl,
    entity.vipProfileFrameImageUrl,
    vip.profileFrameImageUrl,
    vip.profileFrameUrl
  );

  return url ? resolveRemoteProfilePicUrl(url) ?? url : null;
};

export const resolveEntityVipProfileFrameSource = (entity) => {
  const url = extractVipProfileFrameUrl(entity);
  return url ? { uri: url } : null;
};
