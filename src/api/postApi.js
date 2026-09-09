import API, { authRequestConfig, getBearerToken, refreshTokenCache } from "./axios";
import { API_BASE_URL } from "../config/env";

// ── Create a post (text only or with media) ──────────────────
// POST /api/posts
// Body (JSON):  { caption }
// Body (form):  caption + mediaType + media file + available asset metadata
const extensionFromUri = (uri) => {
  const cleanUri = uri?.split("?")?.[0] ?? "";
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? null;
};

const fallbackMimeType = (uri, mediaType) => {
  const ext = extensionFromUri(uri);
  if (mediaType === "video") {
    if (ext === "mov") return "video/quicktime";
    if (ext === "webm") return "video/webm";
    return "video/mp4";
  }

  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "image/jpeg";
};

const fallbackFileName = (uri, mediaType) => {
  const fileName = uri?.split("/")?.pop()?.split("?")?.[0];
  if (fileName?.includes(".")) return fileName;

  const ext = mediaType === "video" ? "mp4" : "jpg";
  return `upload.${ext}`;
};

const appendIfPresent = (form, key, value) => {
  if (value !== undefined && value !== null && value !== "") {
    form.append(key, String(value));
  }
};

const parseCreatePostResponse = async (response) => {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Create post failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const buildAuthHeaders = async (contentType) => {
  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) {
    throw new Error("Please log in again to create a post.");
  }

  const authConfig = await authRequestConfig();
  const headers = {
    ...authConfig.headers,
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  } else {
    delete headers["Content-Type"];
  }

  return { token, headers };
};

// `photos` is an array of picked image assets (1+) for a multi-photo post;
// `video` is a single video asset. The two are mutually exclusive — a post
// is either photos or a video, never both (same convention PostCreateSheet
// enforces). Legacy single-file callers can still pass `mediaUri`/`media`.
export const createPost = async ({ caption, photos, video, mediaType, mediaUri, media }) => {
  const photoList = photos?.length ? photos : (mediaUri && mediaType !== "video" ? [media ?? { uri: mediaUri }] : []);
  const videoAsset = video ?? (mediaUri && mediaType === "video" ? (media ?? { uri: mediaUri }) : null);

  if (videoAsset?.uri) {
    const mimeType = videoAsset.mimeType ?? fallbackMimeType(videoAsset.uri, "video");
    const fileName = videoAsset.fileName ?? fallbackFileName(videoAsset.uri, "video");

    const form = new FormData();
    form.append("caption", caption ?? "");
    form.append("mediaType", "video");
    appendIfPresent(form, "width", videoAsset.width);
    appendIfPresent(form, "height", videoAsset.height);
    appendIfPresent(form, "duration", videoAsset.duration);
    appendIfPresent(form, "fileSize", videoAsset.fileSize);
    form.append("media", { uri: videoAsset.uri, type: mimeType, name: fileName });

    const { token, headers } = await buildAuthHeaders(null);
    form.append("token", token);
    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: "POST",
      headers,
      body: form,
    });
    return parseCreatePostResponse(response);
  }

  if (photoList.length > 0) {
    const form = new FormData();
    form.append("caption", caption ?? "");
    form.append("mediaType", "image");
    // Repeat the "media" field once per file — the standard multipart
    // convention for binding to a MultipartFile[]/List<MultipartFile> on
    // the backend. Per-file width/height/etc. metadata isn't sent for the
    // multi-photo case since there's no established array-keyed contract
    // for it yet; single-photo posts still send it below.
    photoList.forEach((photo, index) => {
      const mimeType = photo.mimeType ?? fallbackMimeType(photo.uri, "photo");
      const fileName = photo.fileName ?? fallbackFileName(photo.uri, "photo") ?? `photo-${index}.jpg`;
      form.append("media", { uri: photo.uri, type: mimeType, name: fileName });
    });
    if (photoList.length === 1) {
      appendIfPresent(form, "width", photoList[0].width);
      appendIfPresent(form, "height", photoList[0].height);
      appendIfPresent(form, "fileSize", photoList[0].fileSize);
    }

    const { token, headers } = await buildAuthHeaders(null);
    form.append("token", token);
    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: "POST",
      headers,
      body: form,
    });
    return parseCreatePostResponse(response);
  }

  const { token, headers } = await buildAuthHeaders("application/json");
  const response = await API.post(
    "/api/posts",
    { caption: caption ?? "", token },
    { headers }
  );
  return response.data;
};

// ── Delete a post ────────────────────────────────────────────
// DELETE /api/posts/{postId}
export const deletePost = async (postId) => {
  const response = await API.delete(`/api/posts/${postId}`);
  return response.data;
};

// ── Like a post ──────────────────────────────────────────────
// POST /api/posts/{postId}/like
export const likePost = async (postId) => {
  const response = await API.post(`/api/posts/${postId}/like`);
  return response.data;
};

// ── Unlike a post ────────────────────────────────────────────
// DELETE /api/posts/{postId}/like
export const unlikePost = async (postId) => {
  const response = await API.delete(`/api/posts/${postId}/like`);
  return response.data;
};

// ── Get comments on a post ───────────────────────────────────
// GET /api/posts/{postId}/comments?page=0&size=20
export const getPostComments = async (postId, page = 0, size = 20) => {
  const response = await API.get(`/api/posts/${postId}/comments?page=${page}&size=${size}`);
  return response.data;
};

// ── Add a comment ────────────────────────────────────────────
// POST /api/posts/{postId}/comments
export const addComment = async (postId, text) => {
  const response = await API.post(`/api/posts/${postId}/comments`, { text });
  return response.data;
};

// ── Mark user as Interested ───────────────────────────────────
// POST /api/home/users/{targetUserId}/interested
export const markInterested = async (targetUserId) => {
  const response = await API.post(`/api/home/users/${targetUserId}/interested`);
  return response.data;
};

// ── Mark user as Not Interested ───────────────────────────────
// POST /api/home/users/{targetUserId}/not-interested
export const markNotInterested = async (targetUserId) => {
  const response = await API.post(`/api/home/users/${targetUserId}/not-interested`);
  return response.data;
};

// ── Report a user ─────────────────────────────────────────────
// POST /api/home/report
export const reportUser = async (targetUserId, reason) => {
  const response = await API.post(`/api/home/report`, { targetUserId, reason });
  return response.data;
};

// ── Share a user's post ───────────────────────────────────────
// POST /api/home/users/{targetUserId}/share
export const shareUser = async (targetUserId) => {
  const response = await API.post(`/api/home/users/${targetUserId}/share`);
  return response.data;
};

// ── Home tab feeds (Online / Following / New) ─────────────────
// These power the Home screen tabs. page is 0-based.

// API 1 — Online users
// GET /api/posts/online?page=0&size=10
export const getOnlinePosts = async (page = 0, size = 10) => {
  const response = await API.get(`/api/posts/online?page=${page}&size=${size}`);
  return response.data;
};

// API 2 — Following
// GET /api/posts/following?page=0&size=10
export const getFollowingPosts = async (page = 0, size = 10) => {
  const response = await API.get(`/api/posts/following?page=${page}&size=${size}`);
  return response.data;
};

// API 3 — Discover / New users
// GET /api/posts/discover?page=0&size=10
export const getDiscoverPosts = async (page = 0, size = 10) => {
  const response = await API.get(`/api/posts/discover?page=${page}&size=${size}`);
  return response.data;
};

// GET /api/posts/me/profile — current user's posts (Profile → Moment tab)
export const getMyProfilePosts = async (page = 1, limit = 20) => {
  const url = `/api/posts/me/profile?page=${page}&limit=${limit}`;

  const response = await API.get(url, await authRequestConfig());
  // Temporary — confirming which field this endpoint actually uses for the
  // post image (normalizePost's imageUrl aliases come up empty here even
  // though the same aliases work fine against /api/home/feed).
  console.log("[postApi] GET /api/posts/me/profile -> RAW", JSON.stringify(response.data));
  return response.data;
};

// PATCH /api/posts/{postId}
// Content-Type: application/json
// Body: { "text": "Updated caption" } — "description" field also accepted
// Media posts: { "text": "" } clears caption
export const updatePostCaption = async (postId, text) => {
  const { token, headers } = await buildAuthHeaders("application/json");
  const body = { text, description: text, token };

  const response = await API.patch(`/api/posts/${postId}`, body, { headers });


  return response.data;
};
