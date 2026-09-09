import { getUserDecorations } from "../api/decorationsApi";
import { resolveRemoteProfilePicUrl } from "./meProfileService";

const NO_DECORATIONS = { badgeUrl: null, frameUrl: null };

/** A user's currently-equipped decorations (badge + frame), fetched on demand.
 *  Backend-assigned per specific user — separate from the VIP-tier frame
 *  system, so this is fetched independently and not gated on VIP status.
 *  Missing/null fields stay null rather than falling back to a placeholder. */
export const fetchUserDecorations = async (userId) => {
  if (!userId) return NO_DECORATIONS;
  try {
    const data = await getUserDecorations(userId);
    const root = data?.data ?? data ?? {};
    const badgeUrl = root?.badgeUrl ?? null;
    const frameUrl = root?.frameUrl ?? null;
    return {
      badgeUrl: badgeUrl ? resolveRemoteProfilePicUrl(badgeUrl) ?? badgeUrl : null,
      frameUrl: frameUrl ? resolveRemoteProfilePicUrl(frameUrl) ?? frameUrl : null,
    };
  } catch {
    return NO_DECORATIONS;
  }
};
