import API, {
  authRequestConfig,
  getBearerToken,
  refreshTokenCache,
} from "./axios";
import { API_BASE_URL, isNgrokBaseUrl } from "../config/env";

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

const extensionFromUri = (uri) => {
  const cleanUri = uri?.split("?")?.[0] ?? "";
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? null;
};

const fallbackMimeType = (uri) => {
  const ext = extensionFromUri(uri);
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "image/jpeg";
};

const fallbackFileName = (uri) => {
  const fileName = uri?.split("/")?.pop()?.split("?")?.[0];
  if (fileName?.includes(".")) return fileName;
  return "profile.jpg";
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

// GET /api/app/users/me/profile
export const getMyProfile = async () => {
  const { headers } = await buildAuthedConfig("get-profile");
  
  const response = await API.get("/api/app/users/me/profile", { headers });
  
  
  return response.data;
};

// PATCH /api/app/users/me/profile  { name, profilePicUrl, ... }
export const patchMyProfile = async (updates = {}) => {
  const { token, headers } = await buildAuthedConfig("patch-profile");
  const body = { ...updates, token };
  
  const response = await API.patch("/api/app/users/me/profile", body, { headers });
  
  
  return response.data;
};

// PATCH /api/app/users/me/profile-pic  multipart field: image
export const uploadMyProfilePic = async ({ uri, mimeType, fileName }) => {
  const { token, headers } = await buildAuthedConfig("profile-pic");
  const form = new FormData();
  form.append("image", {
    uri,
    type: mimeType ?? fallbackMimeType(uri),
    name: fileName ?? fallbackFileName(uri),
  });
  if (token) form.append("token", token);

  const uploadHeaders = {
    Authorization: headers.Authorization,
    ...(isNgrokBaseUrl() ? { "ngrok-skip-browser-warning": "true" } : {}),
  };

  
  const response = await fetch(`${API_BASE_URL}/api/app/users/me/profile-pic`, {
    method: "PATCH",
    headers: uploadHeaders,
    body: form,
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    const message =
      data?.message ??
      data?.error ??
      `Profile picture upload failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.responseData = data;
    throw err;
  }

  
  
  return data;
};
