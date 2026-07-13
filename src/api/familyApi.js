// ============================================================
// FAMILY API — Family group endpoints
// ============================================================
//
// POST   /api/v1/families                              create family group
// GET    /api/v1/families                               family section list (existingFamilies, newFamilies)
// GET    /api/v1/families/{familyGroupId}                single family detail
// POST   /api/v1/families/{familyGroupId}/join           current user joins family
// POST   /api/v1/families/{familyGroupId}/members        owner adds members { userIds: [1,2] }
// GET    /api/v1/families/{familyGroupId}/messages       family chat history
// POST   /api/v1/families/{familyGroupId}/read           mark family chat read
//
// Auth: Authorization: Bearer <JWT>  |  Content-Type: application/json
// ============================================================

import API, { authRequestConfig } from "./axios";

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

/**
 * POST /api/v1/families — create family group. Body: { name, description, iconUrl }.
 * The backend rejects multipart/form-data on this endpoint ("Content-Type ...
 * is not supported"), so `iconUrl` must already be a hosted URL — there is no
 * endpoint yet to upload a locally-picked photo and get one back. See
 * familyService.createFamilyGroup, which only forwards iconUrl when it's
 * already http(s) and otherwise omits it.
 */
export const createFamily = async ({ name, description, iconUrl } = {}) => {
  const path = "/api/v1/families";
  const body = { name, description, iconUrl };
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
