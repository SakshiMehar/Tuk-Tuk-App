import { deletePost, getMyProfilePosts, updatePostCaption } from "../api/postApi";
import { normalizePost } from "./homeService";
import { API_BASE_URL } from "../config/env";

const listFrom = (value, key) => {
  const target = key && value?.[key] !== undefined ? value[key] : value;
  if (Array.isArray(target)) return target;
  return target?.content ?? target?.data ?? target?.items ?? [];
};

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("file://") ||
    trimmed.startsWith("content://") ||
    trimmed.startsWith("ph://")
  ) {
    return trimmed;
  }

  if (
    trimmed.includes(".ngrok-free.dev") ||
    trimmed.includes(".ngrok.io") ||
    trimmed.includes("localhost:") ||
    trimmed.includes("127.0.0.1:") ||
    trimmed.includes("10.0.2.2:")
  ) {
    try {
      const match = trimmed.match(/^https?:\/\/[^\/]+(\/.*)$/);
      if (match && match[1]) {
        return `${API_BASE_URL}${match[1]}`;
      }
    } catch {
      // fallback
    }
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

export const normalizeMyPost = (post) => {
  const normalized = normalizePost(post);
  const rawImage =
    normalized.imageUrl ||
    post?.mediaUrl ||
    post?.imageUrl ||
    (Array.isArray(post?.mediaUrls) && post.mediaUrls[0]) ||
    (Array.isArray(post?.imageUrls) && post.imageUrls[0]) ||
    null;
  const rawGallery =
    (Array.isArray(normalized.imageUrls) && normalized.imageUrls.length && normalized.imageUrls) ||
    (Array.isArray(post?.mediaUrls) && post.mediaUrls.length && post.mediaUrls) ||
    (Array.isArray(post?.imageUrls) && post.imageUrls.length && post.imageUrls) ||
    (rawImage ? [rawImage] : []);

  const imageUrls = rawGallery.map(resolveMediaUrl).filter(Boolean);
  const imageUrl = resolveMediaUrl(rawImage) || imageUrls[0] || null;

  return {
    ...normalized,
    imageUrl,
    imageUrls,
    mediaUrl: imageUrl,
    mediaUrls: imageUrls,
    videoUrl: resolveMediaUrl(normalized.videoUrl),
  };
};

export const loadMyProfilePosts = async (page = 1, limit = 20) => {
  const data = await getMyProfilePosts(page, limit);
  const posts = listFrom(data, "posts").map(normalizeMyPost);

  return {
    posts,
    hasMore: Boolean(data?.hasMore),
    page: data?.page ?? page,
  };
};

export const updateMyPostDescription = async (postId, text) => {
  const data = await updatePostCaption(postId, text);
  const raw = data?.post ?? data?.data ?? data;
  const parsed = normalizeMyPost(raw);
  
  return parsed;
};

export const deleteMyPost = async (postId) => {
  return await deletePost(postId);
};
