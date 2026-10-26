import { getUser, getToken } from "../store/authStore";
import { resolveAppUserId } from "./sessionUser";

let cachedUid = null;

const hashToUid = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 900000) + 10000;
};

/**
 * Deterministic Agora uid for an arbitrary app userId — the same rule
 * getVoiceUid applies to the logged-in user, exposed so callers can derive
 * *other* participants' uids (e.g. to match a seat's userId against Agora's
 * live remote-uid set) without needing that user's own session.
 */
export const resolveVoiceUidForUserId = (userId) => {
  if (userId == null) return null;
  const numeric = Number(userId);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return hashToUid(String(userId));
};

/** Stable Agora uid for the logged-in user (same uid for listen + speak). */
export const getVoiceUid = async () => {
  const user = await getUser();
  const token = await getToken();
  const raw = resolveAppUserId(user, token);
  const numeric = Number(raw);

  if (Number.isFinite(numeric) && numeric > 0) {
    cachedUid = numeric;
  } else if (raw) {
    cachedUid = hashToUid(String(raw));
  } else if (cachedUid) {
    return cachedUid;
  } else {
    throw new Error("User id missing — log in again before using voice.");
  }

  return cachedUid;
};

export const resetVoiceUidCache = () => {
  cachedUid = null;
};
