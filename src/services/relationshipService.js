import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://neatly-twisted-agile.ngrok-free.dev";

// ── Build a one-off axios instance with the stored JWT ──────
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("@auth_token");
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Follow a user ───────────────────────────────────────────
export const followUser = async (targetId) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(
    `${BASE_URL}/api/relationships/follow/${targetId}`,
    {},
    { headers }
  );
  return response.data;
};

// ── Unfollow a user ─────────────────────────────────────────
export const unfollowUser = async (targetId) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(
    `${BASE_URL}/api/relationships/unfollow/${targetId}`,
    {},
    { headers }
  );
  return response.data;
};

// ── Block a user ────────────────────────────────────────────
export const blockUser = async (targetId) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(
    `${BASE_URL}/api/relationships/block/${targetId}`,
    {},
    { headers }
  );
  return response.data;
};

// ── Unblock a user ──────────────────────────────────────────
export const unblockUser = async (targetId) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(
    `${BASE_URL}/api/relationships/unblock/${targetId}`,
    {},
    { headers }
  );
  return response.data;
};

// ── Get relationship status with a user ─────────────────────
export const getRelationshipStatus = async (targetId) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(
    `${BASE_URL}/api/relationships/status/${targetId}`,
    { headers }
  );
  return response.data;
};

// ── Get list of users the current user follows ──────────────
export const getFollowing = async () => {
  const headers = await getAuthHeaders();
  const response = await axios.get(
    `${BASE_URL}/api/relationships/following`,
    { headers }
  );
  return response.data;
};

// ── Get list of followers ───────────────────────────────────
export const getFollowers = async () => {
  const headers = await getAuthHeaders();
  const response = await axios.get(
    `${BASE_URL}/api/relationships/followers`,
    { headers }
  );
  return response.data;
};
