// ============================================================
// FAMILY API — Family group endpoints
// ============================================================
//
// POST   /api/v1/families                              create family group
// GET    /api/v1/families                               family section list (existingFamilies, newFamilies)
// GET    /api/v1/families/{familyGroupId}                single family detail
// PATCH  /api/v1/families/{familyGroupId}/cover          upload/replace cover, multipart field: icon
// POST   /api/v1/families/{familyGroupId}/join           current user joins family
// POST   /api/v1/families/{familyGroupId}/members        owner adds members { userIds: [1,2] }
// GET    /api/v1/families/{familyGroupId}/messages       family chat history
// POST   /api/v1/families/{familyGroupId}/read           mark family chat read
//
// Auth: Authorization: Bearer <JWT>  |  Content-Type: application/json
// ============================================================

import API, { authRequestConfig, getBearerToken, refreshTokenCache } from "./axios";
import { API_BASE_URL, isNgrokBaseUrl } from "../config/env";

const LOG_TAG = "[FamilyAPI]";

const logRequest = (method, path, payload) => {
  console.log(`${LOG_TAG} → ${method} ${path}`, payload ?? "");
};

const logResponse = (method, path, data) => {
  console.log(`${LOG_TAG} ← ${method} ${path}`, data);
};

const logError = (method, path, error) => {
  console.error(
    `${LOG_TAG} ✗ ${method} ${path}`,
    error?.response?.data ?? error?.message ?? error
  );
};

const fallbackMimeType = (uri) => {
  const ext = uri?.split("?")?.[0]?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "image/jpeg";
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * POST /api/v1/families — create family group. Body: { name, description }.
 * No image here — the cover photo is uploaded separately via
 * PATCH /api/v1/families/{familyGroupId}/cover once the group exists (see
 * updateFamilyCover below and familyService.createFamilyGroup for the flow).
 */
export const createFamily = async ({ name, description } = {}) => {
  const path = "/api/v1/families";
  const body = { name, description };
  logRequest("POST", path, body);
  try {
    const response = await API.post(path, body, await authRequestConfig());
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/**
 * PATCH /api/v1/families/{familyGroupId}/cover — multipart field: icon.
 * Uploads/replaces the family's cover photo. Returns the updated family
 * object (includes the freshly-hosted iconUrl). Uses raw fetch, not the
 * shared axios instance — same convention as uploadMyProfilePic/createPost
 * for multipart bodies in this codebase.
 */
export const updateFamilyCover = async (familyGroupId, { uri, mimeType, fileName } = {}) => {
  const path = `/api/v1/families/${familyGroupId}/cover`;

  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) throw new Error("Please log in again to continue.");

  const form = new FormData();
  form.append("icon", {
    uri,
    type: mimeType ?? fallbackMimeType(uri),
    name: fileName ?? "cover.jpg",
  });

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(isNgrokBaseUrl() ? { "ngrok-skip-browser-warning": "true" } : {}),
  };

  logRequest("PATCH", path, { icon: fileName ?? uri });
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PATCH",
      headers,
      body: form,
    });
    const data = await parseResponseBody(response);
    if (!response.ok) {
      const message = data?.message ?? data?.error ?? `Cover upload failed (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      err.responseData = data;
      throw err;
    }
    logResponse("PATCH", path, data);
    return data;
  } catch (error) {
    logError("PATCH", path, error);
    throw error;
  }
};

/** GET /api/v1/families — family section list: { existingFamilies, newFamilies } */
export const getFamilies = async () => {
  const path = "/api/v1/families";
  logRequest("GET", path);
  try {
    const response = await API.get(path, await authRequestConfig());
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** GET /api/v1/families/{familyGroupId} — single family detail */
export const getFamilyDetail = async (familyGroupId) => {
  const path = `/api/v1/families/${familyGroupId}`;
  logRequest("GET", path);
  try {
    const response = await API.get(path, await authRequestConfig());
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** POST /api/v1/families/{familyGroupId}/join — current user joins family */
export const joinFamily = async (familyGroupId) => {
  const path = `/api/v1/families/${familyGroupId}/join`;
  logRequest("POST", path);
  try {
    const response = await API.post(path, {}, await authRequestConfig());
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** POST /api/v1/families/{familyGroupId}/members — owner adds members. Body: { userIds: [1,2] } */
export const addFamilyMembers = async (familyGroupId, userIds = []) => {
  const path = `/api/v1/families/${familyGroupId}/members`;
  const body = { userIds };
  logRequest("POST", path, body);
  try {
    const response = await API.post(path, body, await authRequestConfig());
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** GET /api/v1/families/{familyGroupId}/messages — family chat history */
export const getFamilyMessages = async (familyGroupId) => {
  const path = `/api/v1/families/${familyGroupId}/messages`;
  logRequest("GET", path);
  try {
    const response = await API.get(path, await authRequestConfig());
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** POST /api/v1/families/{familyGroupId}/read — mark family chat read / reset unread count */
export const markFamilyRead = async (familyGroupId) => {
  const path = `/api/v1/families/${familyGroupId}/read`;
  logRequest("POST", path);
  try {
    const response = await API.post(path, {}, await authRequestConfig());
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};
