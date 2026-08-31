import API, {
  authRequestConfig,
  getBearerToken,
  refreshTokenCache,
} from "./axios";

// Builds the same authed config used by the other /api/app endpoints,
// guaranteeing the exact stored JWT is sent as `Authorization: Bearer <token>`.
const buildAuthedConfig = async (label) => {
  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) {
    
    throw new Error("Please log in again to continue.");
  }
  const authConfig = await authRequestConfig();
  
  return {
    token,
    headers: {
      ...authConfig.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const joinProfileField = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(", ");
  }
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

// Backend stores wizard tags as comma-separated strings, not JSON arrays.
export const buildFindFriendsProfilePayload = (profile = {}) => {
  const payload = {
    interests: joinProfileField(profile.interests),
    music: joinProfileField(profile.music),
    books: joinProfileField(profile.books),
    food: joinProfileField(profile.food),
    language: joinProfileField(profile.language),
    bio: joinProfileField(profile.bio ?? profile.aboutMe ?? profile.about),
    education: joinProfileField(profile.education),
    occupation: joinProfileField(profile.occupation),
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value.length > 0)
  );
};

// 1. Next user card
// GET /api/app/users/find-friends/next
// This route ignores the Authorization header (same backend quirk as
// match-switch), so the token is also passed as a query param — the only
// channel available to a GET in React Native (GET bodies are dropped).
export const getNextFriend = async () => {
  const { token, headers } = await buildAuthedConfig("find-friends/next");
  const url = `/api/app/users/find-friends/next?token=${encodeURIComponent(token)}`;
  
  const response = await API.get(url, { headers });
  
  return response.data;
};

// 2 & 3. Like / Reject
// POST /api/app/users/find-friends/action  { targetUserId, action }
// action: "LIKE" | "REJECT"
export const sendFriendAction = async (targetUserId, action) => {
  const { token, headers } = await buildAuthedConfig(`find-friends/action ${action}`);
  // token included in body too — this backend expects it for mutation routes.
  const body = { targetUserId, action, token };
  
  const response = await API.post(
    "/api/app/users/find-friends/action",
    body,
    { headers }
  );
  
  return response.data;
};

// 4. Save find-friends profile (wizard: interests, music, books, food, etc.)
// PATCH /api/app/users/find-friends/profile
export const updateFindFriendsProfile = async (profile) => {
  const { token, headers } = await buildAuthedConfig("find-friends/profile");
  const payload = buildFindFriendsProfilePayload(profile);
  const body = { ...payload, token };
  
  const response = await API.patch(
    "/api/app/users/find-friends/profile",
    body,
    { headers }
  );
  
  
  return response.data;
};