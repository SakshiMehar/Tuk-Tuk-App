import { getMyProfilePosts, updatePostCaption } from "../api/postApi";
import { normalizePost } from "./homeService";
import { API_BASE_URL } from "../config/env";

const listFrom = (value, key) => {
  const target = key && value?.[key] !== undefined ? value[key] : value;
  if (Array.isArray(target)) return target;
  return target?.content ?? target?.data ?? target?.items ?? [];
};

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const normalizeMyPost = (post) => {
  const normalized = normalizePost(post);
  return {
    ...normalized,
    imageUrl: resolveMediaUrl(normalized.imageUrl),
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
