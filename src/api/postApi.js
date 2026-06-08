import API from "./axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, isNgrokBaseUrl } from "../config/env";

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

export const createPost = async ({ caption, mediaUri, mediaType, media }) => {
  if (mediaUri) {
    const resolvedMediaType = mediaType ?? media?.type ?? "photo";
    const mimeType = media?.mimeType ?? fallbackMimeType(mediaUri, resolvedMediaType);
    const fileName = media?.fileName ?? fallbackFileName(mediaUri, resolvedMediaType);

    const form = new FormData();
    form.append("caption", caption ?? "");
    form.append("mediaType", resolvedMediaType);
    appendIfPresent(form, "width", media?.width);
    appendIfPresent(form, "height", media?.height);
    appendIfPresent(form, "duration", media?.duration);
    appendIfPresent(form, "fileSize", media?.fileSize);
    form.append("media", {
      uri: mediaUri,
      type: mimeType,
      name: fileName,
    });

    const token = await AsyncStorage.getItem("@auth_token");
    const headers = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isNgrokBaseUrl() ? { "ngrok-skip-browser-warning": "true" } : {}),
    };

    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: "POST",
      headers,
      body: form,
    });

    const data = await parseCreatePostResponse(response);
    return data;
  }

  const response = await API.post("/api/posts", { caption });
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

// ── Feed: Like a post ────────────────────────────────────────
// POST /api/home/feed/posts/{postId}/like
export const feedLikePost = async (postId) => {
  const response = await API.post(`/api/home/feed/posts/${postId}/like`);
  return response.data;
};

// ── Feed: Dislike a post (used as unlike) ────────────────────
// POST /api/home/feed/posts/{postId}/dislike
export const feedDislikePost = async (postId) => {
  const response = await API.post(`/api/home/feed/posts/${postId}/dislike`);
  return response.data;
};

// ── Feed: Get comments ────────────────────────────────────────
// GET /api/home/feed/posts/{postId}/comments
export const feedGetComments = async (postId) => {
  const response = await API.get(`/api/home/feed/posts/${postId}/comments`);
  return response.data;
};

// ── Feed: Add a comment ───────────────────────────────────────
// POST /api/home/feed/posts/{postId}/comments
// Body: { "text": "Nice post" }
export const feedAddComment = async (postId, text) => {
  const response = await API.post(`/api/home/feed/posts/${postId}/comments`, { text });
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
// POST /api/home/users/{targetUserId}/report
export const reportUser = async (targetUserId) => {
  const response = await API.post(`/api/home/users/${targetUserId}/report`);
  return response.data;
};

// ── Share a user's post ───────────────────────────────────────
// POST /api/home/users/{targetUserId}/share
export const shareUser = async (targetUserId) => {
  const response = await API.post(`/api/home/users/${targetUserId}/share`);
  return response.data;
};
