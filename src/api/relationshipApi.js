import API, { authRequestConfig } from "./axios";

export const followUser = async (targetId) => {
  const id = String(targetId);
  console.log(`[relationshipApi] POST /api/relationships/follow/${id}`);
  const response = await API.post(
    `/api/relationships/follow/${id}`,
    {},
    await authRequestConfig()
  );
  console.log(
    `[relationshipApi] follow/${id} response:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const unfollowUser = async (targetId) => {
  const id = String(targetId);
  console.log(`[relationshipApi] POST /api/relationships/unfollow/${id}`);
  const response = await API.post(
    `/api/relationships/unfollow/${id}`,
    {},
    await authRequestConfig()
  );
  console.log(
    `[relationshipApi] unfollow/${id} response:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const blockUser = async (targetId) => {
  const id = String(targetId);
  console.log(`[relationshipApi] POST /api/relationships/block/${id}`);
  const response = await API.post(
    `/api/relationships/block/${id}`,
    {},
    await authRequestConfig()
  );
  console.log(
    `[relationshipApi] block/${id} response:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const unblockUser = async (targetId) => {
  const id = String(targetId);
  console.log(`[relationshipApi] POST /api/relationships/unblock/${id}`);
  const response = await API.post(
    `/api/relationships/unblock/${id}`,
    {},
    await authRequestConfig()
  );
  console.log(
    `[relationshipApi] unblock/${id} response:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getBlockedUsers = async () => {
  console.log("[relationshipApi] GET /api/relationships/block-users");
  const response = await API.get(
    "/api/relationships/block-users",
    await authRequestConfig()
  );
  console.log(
    "[relationshipApi] block-users response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getRelationshipStatus = async (targetId) => {
  const response = await API.get(
    `/api/relationships/status/${targetId}`,
    await authRequestConfig()
  );
  return response.data;
};

export const getFollowing = async () => {
  console.log("[relationshipApi] GET /api/relationships/following");
  const response = await API.get("/api/relationships/following", await authRequestConfig());
  console.log(
    "[relationshipApi] GET /api/relationships/following response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getFollowers = async () => {
  console.log("[relationshipApi] GET /api/relationships/followers");
  const response = await API.get("/api/relationships/followers", await authRequestConfig());
  console.log(
    "[relationshipApi] GET /api/relationships/followers response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};
