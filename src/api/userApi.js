import API, { authRequestConfig } from "./axios";

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

export const getNearbyUsers = async ({
  lat,
  lng,
  radiusKm = 25,
  page = 0,
  limit = 20,
} = {}) => {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radiusKm: String(radiusKm),
    page: String(page),
    limit: String(limit),
  });
  const url = `/api/app/users/nearby?${params.toString()}`;
  console.log("[userApi] GET", url);
  const response = await API.get(url, await authRequestConfig());
  console.log(
    "[userApi] GET /api/app/users/nearby response:",
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
