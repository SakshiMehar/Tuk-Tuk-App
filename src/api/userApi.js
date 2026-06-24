import API, {
  authRequestConfig,
  getBearerToken,
  refreshTokenCache,
} from "./axios";

/** Same auth construction as userSettingsApi.buildAuthedConfig (match-switch). */
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

export const updateMyLocation = async ({ latitude, longitude }) => {
  const body = { latitude, longitude };
  
  const response = await API.patch(
    "/api/app/users/me/location",
    body,
    await authRequestConfig()
  );
  
  return response.data;
};

// Nearby endpoints by variant:
//   all    → GET /api/app/users/nearby
//   online → GET /api/app/users/nearby/online
//   saved  → GET /api/app/users/nearby/saved
//   new    → GET /api/app/users/nearby/new  (supports gender & city filters)
const NEARBY_PATHS = {
  all: "/api/app/users/nearby",
  online: "/api/app/users/nearby/online",
  saved: "/api/app/users/nearby/saved",
  new: "/api/app/users/nearby/new",
};

export const getNearbyUsers = async ({
  lat,
  lng,
  radiusKm = 25,
  page = 0,
  limit = 20,
  variant = "all",
  gender,
  city,
} = {}) => {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radiusKm: String(radiusKm),
    page: String(page),
    limit: String(limit),
  });
  // gender / city are only meaningful for the "new" endpoint.
  if (gender && gender !== "All") params.set("gender", gender);
  if (city) params.set("city", city);
  const base = NEARBY_PATHS[variant] ?? NEARBY_PATHS.all;
  const url = `${base}?${params.toString()}`;
  
  const response = await API.get(url, await authRequestConfig());
  
  return response.data;
};

// GET /api/app/users/count — total registered users (login screen, no auth required)
export const getUsersCount = async () => {
  const response = await API.get("/api/app/users/count");
  return response.data;
};

// GET /api/app/users/active/count — platform-wide online user count (home header pill)
export const getActiveUsersCount = async () => {
  const { headers } = await buildAuthedConfig("active/count");
  
  const response = await API.get("/api/app/users/active/count", { headers });
  
  
  return response.data;
};

export const getUserById = async (userId) => {
  const id = String(userId);
  
  const response = await API.get(
    `/api/app/users/${id}`,
    await authRequestConfig()
  );
  
  return response.data;
};

export const getProfileVisits = async (limit = 50) => {
  const url = `/api/app/users/me/profile-visits?limit=${limit}`;
  
  const response = await API.get(url, await authRequestConfig());
  
  return response.data;
};

/** GET /api/app/users/saved — saved users list (no pagination). */
export const getSavedUsers = async () => {
  const { headers } = await buildAuthedConfig("get-saved-users");
  
  const response = await API.get("/api/app/users/saved", { headers });
  
  return response.data;
};

/** POST /api/app/users/saved/{targetUserId} — save a user. */
export const saveUserOnServer = async (targetUserId) => {
  const { token, headers } = await buildAuthedConfig("save-user");
  const id = encodeURIComponent(String(targetUserId));
  const url = `/api/app/users/saved/${id}`;
  
  const response = await API.post(
    url,
    { targetUserId: String(targetUserId), token },
    { headers }
  );
  
  return response.data;
};

/** DELETE /api/app/users/saved/{targetUserId} — remove a user from saved list. */
export const removeUserFromServer = async (targetUserId) => {
  const { headers } = await buildAuthedConfig("remove-saved-user");
  const id = encodeURIComponent(String(targetUserId));
  const url = `/api/app/users/saved/${id}`;
  
  const response = await API.delete(url, { headers });
  
  return response.data;
};

export const getMyDiamondCreditRequests = async () => {
  const url = "/api/app/diamond-credit-requests/me";
  
  const response = await API.get(url, await authRequestConfig());
  
  return response.data;
};

/** GET /api/app/daily-tasks — today's reward tasks with progress and claim state. */
export const getDailyTasks = async () => {
  const { headers } = await buildAuthedConfig("get-daily-tasks");
  
  const response = await API.get("/api/app/daily-tasks", { headers });
  
  return response.data;
};

/** POST /api/app/daily-tasks/{taskType}/claim — claim a daily task reward. */
export const claimDailyTask = async (taskType) => {
  const { token, headers } = await buildAuthedConfig("claim-daily-task");
  const type = encodeURIComponent(taskType);
  const url = `/api/app/daily-tasks/${type}/claim`;
  
  const response = await API.post(url, { taskType, token }, { headers });
  
  return response.data;
};
