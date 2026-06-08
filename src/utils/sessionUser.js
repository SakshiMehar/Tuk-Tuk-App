import { getUser, getToken, updateUser } from "../store/authStore";
import { getHomeInit } from "../api/homeApi";

const decodeBase64 = (input) => {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(input);
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let str = input.replace(/=+$/, "");
  let output = "";
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ) {
    const idx = chars.indexOf(buffer);
    if (idx === -1) continue;
    bs = bc % 4 ? bs * 64 + idx : idx;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
};

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(decodeBase64(padded));
  } catch {
    return null;
  }
};

const isAppNumericId = (value) => {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return /^\d{1,9}$/.test(text);
};

const isLikelyFirebaseId = (value) => String(value).trim().length > 9;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ??
  null;

const pickAppUserId = (...candidates) => {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const text = String(candidate).trim();
    if (!text) continue;
    if (isLikelyFirebaseId(text)) continue;
    return text;
  }
  for (const candidate of candidates) {
    if (candidate && isAppNumericId(candidate)) return String(candidate);
  }
  return null;
};

/** Backend app user id (e.g. "38"), not Firebase sub. */
export const resolveAppUserId = (user, token) => {
  const claims = decodeJwtPayload(token);

  return pickAppUserId(
    user?.id,
    user?.userId,
    user?.user_id,
    user?._id,
    user?.memberId,
    claims?.userId,
    claims?.id,
    claims?.user_id,
    claims?.appUserId,
    claims?.tuktukUserId,
    claims?.user?.id,
    claims?.user?.userId,
    isAppNumericId(claims?.sub) ? claims.sub : null
  );
};

const loadProfileFromHomeInit = async (token) => {
  try {
    const data = await getHomeInit();
    const profile = data?.userProfile ?? data?.data?.userProfile ?? data?.user;
    const userId = resolveAppUserId(profile, token);
    if (!userId) return null;
    await updateUser({
      id: userId,
      userId,
      name: profile?.name ?? profile?.username ?? undefined,
      avatarUrl: profile?.avatarUrl ?? profile?.avatar ?? undefined,
    });
    return { userId, profile };
  } catch {
    return null;
  }
};

export const getAppUserId = async () => {
  const user = await getUser();
  const token = await getToken();
  let userId = resolveAppUserId(user, token);
  if (userId) return userId;

  const loaded = await loadProfileFromHomeInit(token);
  if (loaded?.userId) return loaded.userId;

  throw new Error("User id missing — log in again.");
};

export const buildSeatProfile = async () => {
  let user = await getUser();
  const token = await getToken();
  let userId = resolveAppUserId(user, token);

  if (!userId) {
    const loaded = await loadProfileFromHomeInit(token);
    if (loaded) {
      userId = loaded.userId;
      user = (await getUser()) || loaded.profile || user;
    }
  }

  if (!userId) {
    throw new Error("Seat profile must include userId — please log in again.");
  }

  const name =
    user?.name ?? user?.username ?? user?.nickname ?? user?.displayName ?? "User";
  const avatarUrl =
    user?.avatarUrl ?? user?.avatar ?? user?.profileImageUrl ?? user?.profileImage ?? null;

  return {
    userId: String(userId),
    name: String(name),
    ...(avatarUrl ? { avatarUrl: String(avatarUrl) } : {}),
  };
};

/** Persist id/name from JWT when login payload omits them. */
export const syncUserFromToken = async () => {
  const user = (await getUser()) || {};
  const token = await getToken();
  const claims = decodeJwtPayload(token);
  if (!claims) return user;

  const userId = resolveAppUserId(user, token);
  const name =
    user?.name ??
    claims?.name ??
    claims?.username ??
    claims?.nickname ??
    null;

  if (!userId && !name) return user;

  return updateUser({
    ...(userId ? { id: userId, userId } : {}),
    ...(name ? { name: String(name) } : {}),
  });
};
