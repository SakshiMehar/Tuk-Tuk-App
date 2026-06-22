import API, { authRequestConfig } from "./axios";

export const followUser = async (targetId) => {
  const id = String(targetId);
  
  const response = await API.post(
    `/api/relationships/follow/${id}`,
    {},
    await authRequestConfig()
  );
  
  return response.data;
};

export const unfollowUser = async (targetId) => {
  const id = String(targetId);
  
  const response = await API.post(
    `/api/relationships/unfollow/${id}`,
    {},
    await authRequestConfig()
  );
  
  return response.data;
};

export const blockUser = async (targetId) => {
  const id = String(targetId);
  
  const response = await API.post(
    `/api/relationships/block/${id}`,
    {},
    await authRequestConfig()
  );
  
  return response.data;
};

export const unblockUser = async (targetId) => {
  const id = String(targetId);
  
  const response = await API.post(
    `/api/relationships/unblock/${id}`,
    {},
    await authRequestConfig()
  );
  
  return response.data;
};

export const getBlockedUsers = async () => {
  
  const response = await API.get(
    "/api/relationships/block-users",
    await authRequestConfig()
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
  
  const response = await API.get("/api/relationships/following", await authRequestConfig());
  
  return response.data;
};

export const getFollowers = async () => {
  
  const response = await API.get("/api/relationships/followers", await authRequestConfig());
  
  return response.data;
};
