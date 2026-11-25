import { getMyProfilePosts, updatePostCaption, deletePost } from '../api/postApi';
import { API_BASE_URL } from '../config/env';

const listFrom = (value: any, key?: string) => {
  const target = key && value?.[key] !== undefined ? value[key] : value;
  if (Array.isArray(target)) return target;
  return target?.content ?? target?.data ?? target?.items ?? [];
};

export const resolveMediaUrl = (url: any): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('ph://')
  ) {
    return trimmed;
  }

  if (
    trimmed.includes('.ngrok-free.dev') ||
    trimmed.includes('.ngrok.io') ||
    trimmed.includes('localhost:') ||
    trimmed.includes('127.0.0.1:') ||
    trimmed.includes('10.0.2.2:')
  ) {
    try {
      const match = trimmed.match(/^https?:\/\/[^\/]+(\/.*)$/);
      if (match && match[1]) {
        return `${API_BASE_URL}${match[1]}`;
      }
    } catch {}
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

export const normalizePost = (post: any) => {
  if (!post) return {};
  const id = post.id ?? post.postId ?? post._id;
  const text = post.text ?? post.caption ?? post.description ?? '';
  const imageUrl = resolveMediaUrl(
    post.imageUrl ?? post.mediaUrl ?? post.photoUrl ?? (Array.isArray(post.imageUrls) ? post.imageUrls[0] : null)
  );
  const videoUrl = resolveMediaUrl(post.videoUrl);
  const hasVideo = Boolean(videoUrl || post.mediaType === 'video' || post.hasVideo);
  const likeCount = Number(post.likeCount ?? post.likes ?? 0);

  return {
    id,
    text,
    imageUrl,
    videoUrl,
    hasVideo,
    likeCount,
    raw: post,
  };
};

export const loadMyProfilePosts = async (page = 1, limit = 20) => {
  try {
    const data = await getMyProfilePosts(page, limit);
    const posts = listFrom(data, 'posts').map(normalizePost);
    return {
      posts,
      hasMore: Boolean(data?.hasMore),
      page: data?.page ?? page,
    };
  } catch (err) {
    return { posts: [], hasMore: false, page };
  }
};

export const updateMyPostDescription = async (postId: any, text: string) => {
  const data = await updatePostCaption(postId, text);
  return normalizePost(data?.data ?? data);
};

export default {
  loadMyProfilePosts,
  updateMyPostDescription,
  deletePost,
};
