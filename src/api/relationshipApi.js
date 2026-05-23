import API from "./axios";

// ── Follow a User ───────────────────────────────────────────
// POST /api/relationships/follow/{targetId}
// Returns: { message }
export const followUser = async (targetId) => {
  const response = await API.post(`/api/relationships/follow/${targetId}`);
  return response.data;
};

// ── Unfollow a User ─────────────────────────────────────────
// POST /api/relationships/unfollow/{targetId}
// Returns: { message }
export const unfollowUser = async (targetId) => {
  const response = await API.post(`/api/relationships/unfollow/${targetId}`);
  return response.data;
};

// ── Block a User ────────────────────────────────────────────
// POST /api/relationships/block/{targetId}
// Returns: { message }
export const blockUser = async (targetId) => {
  const response = await API.post(`/api/relationships/block/${targetId}`);
  return response.data;
};

// ── Get Following List ──────────────────────────────────────
// GET /api/relationships/following
// Returns: [{ id, name, avatar, ... }]
export const getFollowing = async () => {
  const response = await API.get("/api/relationships/following");
  return response.data;
};

// ── Get Followers List ──────────────────────────────────────
// GET /api/relationships/followers
// Returns: [{ id, name, avatar, ... }]
export const getFollowers = async () => {
  const response = await API.get("/api/relationships/followers");
  return response.data;
};
