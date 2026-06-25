import { resolveBundledAvatarId } from "../data/avatarOptions";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ??
  null;

const applyAvatarFields = (user, ...sources) => {
  const avatarId = resolveBundledAvatarId(...sources);
  if (avatarId) {
    user.avatarId = avatarId;
    user.avatar = avatarId;
  }
  const remoteUrl = firstText(...sources);
  if (remoteUrl && !avatarId) {
    user.profilePicUrl = remoteUrl;
    user.avatarUrl = remoteUrl;
  }
  return user;
};

const buildUserFromPayload = (payload) => {
  const userId = firstValue(payload?.userId, payload?.id, payload?.user_id);
  const name = firstText(
    payload?.username,
    payload?.name,
    payload?.displayName,
    payload?.fullName,
    payload?.nickname
  );

  const user = {};
  if (userId != null) {
    user.id = String(userId);
    user.userId = String(userId);
  }
  if (name) {
    user.name = name;
    user.username = name;
  }
  applyAvatarFields(
    user,
    payload?.avatar,
    payload?.profilePicUrl,
    payload?.avatarUrl,
    payload?.profileImageUrl,
    payload?.profileImage
  );
  if (payload?.role) user.role = payload.role;
  if (payload?.email) user.email = payload.email;
  if (payload?.phone) user.phone = payload.phone;
  const createdAt = firstText(
    payload?.createdAt,
    payload?.created_at,
    payload?.registeredAt,
    payload?.joinedAt
  );
  if (createdAt) user.createdAt = createdAt;
  if (payload?.hasNewUserFrame != null) {
    user.hasNewUserFrame = Boolean(payload.hasNewUserFrame);
  }
  const level = firstValue(payload?.level, payload?.honorLevel, payload?.userLevel, payload?.lv);
  if (level != null) user.level = Number(level);

  return user;
};

/** Normalize backend auth payloads ({ token } vs { access_token }, nested vs flat user). */
export const normalizeAuthResponse = (data) => {
  const payload = data?.data ?? data;
  const token =
    payload?.token ??
    payload?.access_token ??
    payload?.accessToken ??
    data?.token ??
    data?.access_token;

  const nestedUser = payload?.user ?? data?.user;
  if (nestedUser && typeof nestedUser === "object" && Object.keys(nestedUser).length > 0) {
    const userId = firstValue(nestedUser?.userId, nestedUser?.id);
    const user = {
      ...nestedUser,
      ...(userId != null ? { id: String(userId), userId: String(userId) } : {}),
    };
    applyAvatarFields(
      user,
      nestedUser?.avatar,
      nestedUser?.profilePicUrl,
      payload?.avatar,
      payload?.profilePicUrl,
      nestedUser?.avatarUrl
    );
    const createdAt = firstText(
      nestedUser?.createdAt,
      nestedUser?.created_at,
      payload?.createdAt,
      payload?.created_at
    );
    if (createdAt) user.createdAt = createdAt;
    if (nestedUser?.hasNewUserFrame != null || payload?.hasNewUserFrame != null) {
      user.hasNewUserFrame = Boolean(nestedUser?.hasNewUserFrame ?? payload?.hasNewUserFrame);
    }
    const level = firstValue(
      nestedUser?.level,
      nestedUser?.honorLevel,
      payload?.level,
      payload?.honorLevel
    );
    if (level != null) user.level = Number(level);
    return { token, user };
  }

  // Flat login: { userId, username, token, profilePicUrl, role, ... }
  return { token, user: buildUserFromPayload(payload ?? data ?? {}) };
};

export const extractIsNewUser = (data) => {
  const payload = data?.data ?? data ?? {};
  const user = payload?.user ?? data?.user ?? {};

  const truthy = (value) =>
    value === true ||
    value === 1 ||
    value === "1" ||
    (typeof value === "string" && /^(true|yes|new|1)$/i.test(value.trim()));

  return (
    truthy(payload?.isNewUser) ||
    truthy(payload?.newUser) ||
    truthy(payload?.firstLogin) ||
    truthy(payload?.isFirstLogin) ||
    truthy(payload?.isNew) ||
    truthy(payload?.newlyRegistered) ||
    truthy(payload?.userCreated) ||
    truthy(payload?.accountCreated) ||
    truthy(user?.isNewUser) ||
    truthy(user?.newUser) ||
    truthy(user?.firstLogin) ||
    truthy(user?.isFirstLogin) ||
    truthy(user?.isNew) ||
    String(payload?.action ?? "").toLowerCase() === "register" ||
    String(payload?.mode ?? "").toLowerCase() === "register"
  );
};
