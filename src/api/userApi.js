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
    console.warn(`[userApi] ${label} skipped — no auth token in storage`);
    throw new Error("Please log in again to continue.");
  }
  const authConfig = await authRequestConfig();
  console.log(`[userApi] ${label} auth ok — token length: ${token.length}`);
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
  console.log("[userApi] PATCH /api/app/users/me/location body:", JSON.stringify(body, null, 2));
  const response = await API.patch(
    "/api/app/users/me/location",
    body,
    await authRequestConfig()
  );
  console.log(
    "[userApi] PATCH /api/app/users/me/location response:",
    JSON.stringify(response.data, null, 2)
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
  console.log("[userApi] GET", url);
  const response = await API.get(url, await authRequestConfig());
  console.log(
    `[userApi] GET ${base} response:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getUserById = async (userId) => {
  const id = String(userId);
  console.log(`[userApi] GET /api/app/users/${id}`);
  const response = await API.get(
    `/api/app/users/${id}`,
    await authRequestConfig()
  );
  console.log(
    `[userApi] GET /api/app/users/${id} response:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getProfileVisits = async (limit = 50) => {
  const url = `/api/app/users/me/profile-visits?limit=${limit}`;
  console.log("[userApi] GET", url);
  const response = await API.get(url, await authRequestConfig());
  console.log(
    "[userApi] GET /api/app/users/me/profile-visits response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const getMyDiamondCreditRequests = async () => {
  const url = "/api/app/diamond-credit-requests/me";
  console.log("[userApi] GET", url);
  const response = await API.get(url, await authRequestConfig());
  console.log(
    "[userApi] GET /api/app/diamond-credit-requests/me response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

/** POST /api/app/daily-tasks/{taskType}/claim — claim a daily task reward. */
export const claimDailyTask = async (taskType) => {
  const { token, headers } = await buildAuthedConfig("claim-daily-task");
  const type = encodeURIComponent(taskType);
  // Send token in header (Bearer), body, and query param so the backend can
  // read it from whichever location it expects.
  const url = `/api/app/daily-tasks/${type}/claim?token=${encodeURIComponent(token)}`;
  const body = { taskType, token, accessToken: token, authToken: token };
  console.log(
    `[userApi] POST /api/app/daily-tasks/${type}/claim body:`,
    JSON.stringify({ ...body, token: `(${token.length} chars)` }, null, 2)
  );
  const response = await API.post(url, body, { headers });
  console.log(
    `[userApi] POST /api/app/daily-tasks/${type}/claim response:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};
