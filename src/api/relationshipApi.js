import API from "./axios";

export const followUser = async (targetId) => {
  const response = await API.post(`/api/relationships/follow/${targetId}`, {});
  return response.data;
};

export const unfollowUser = async (targetId) => {
  const response = await API.post(`/api/relationships/unfollow/${targetId}`, {});
  return response.data;
};

export const blockUser = async (targetId) => {
  const response = await API.post(`/api/relationships/block/${targetId}`, {});
  return response.data;
};

export const unblockUser = async (targetId) => {
  const response = await API.post(`/api/relationships/unblock/${targetId}`, {});
  return response.data;
};

export const getRelationshipStatus = async (targetId) => {
  const response = await API.get(`/api/relationships/status/${targetId}`);
  return response.data;
};

export const getFollowing = async () => {
  const response = await API.get("/api/relationships/following");
  return response.data;
};

export const getFollowers = async () => {
  const response = await API.get("/api/relationships/followers");
  return response.data;
};
