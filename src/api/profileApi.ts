import API, {
  authRequestConfig,
  getBearerToken,
  refreshTokenCache,
} from './axios';
import { API_BASE_URL } from '../config/env';
import { getUser } from '../store/authStore';

const buildAuthedConfig = async () => {
  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) {
    throw new Error('Please log in again to continue.');
  }
  const authConfig = await authRequestConfig();
  return {
    token,
    headers: {
      ...authConfig.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

const extensionFromUri = (uri: string) => {
  const cleanUri = uri?.split('?')?.[0] ?? '';
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? null;
};

const fallbackMimeType = (uri: string) => {
  const ext = extensionFromUri(uri);
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  return 'image/jpeg';
};

const fallbackFileName = (uri: string) => {
  const fileName = uri?.split('/')?.pop()?.split('?')?.[0];
  if (fileName?.includes('.')) return fileName;
  return 'profile.jpg';
};

// GET /api/app/users/me/profile
export const getMyProfile = async () => {
  const { headers } = await buildAuthedConfig();
  const response = await API.get('/api/app/users/me/profile', { headers });
  return response.data;
};

// PATCH /api/app/users/me/profile
export const patchMyProfile = async (updates: any = {}) => {
  const { token, headers } = await buildAuthedConfig();
  const body = { ...updates, token };

  if (body.country && !body.countryName) {
    body.countryName = String(body.country).trim();
  }
  if ((body.profilePicUrl || body.avatarId) && !body.avatar) {
    body.avatar = body.profilePicUrl || body.avatarId;
  }

  const hasRequired = Boolean(
    (body.name && String(body.name).trim()) ||
    (body.avatar && String(body.avatar).trim()) ||
    (body.countryName && String(body.countryName).trim())
  );

  if (!hasRequired) {
    const user = await getUser().catch(() => null);
    if (user?.name || user?.username) {
      body.name = String(user.name || user.username).trim();
    } else if (user?.countryName || user?.country) {
      body.countryName = String(user.countryName || user.country).trim();
    } else if (user?.avatar || user?.avatarId || user?.profilePicUrl) {
      body.avatar = user.avatar || user.avatarId || user.profilePicUrl;
    }
  }

  if (!body.name && !body.avatar && !body.countryName) {
    return null;
  }

  const response = await API.patch('/api/app/users/me/profile', body, { headers });
  return response.data;
};

// GET /api/app/users/me/country
export const getMyCountry = async () => {
  const { headers } = await buildAuthedConfig();
  const response = await API.get('/api/app/users/me/country', { headers });
  return response.data;
};

// PATCH /api/app/users/me/country
export const patchMyCountry = async ({ countryName, countryCode }: any = {}) => {
  const { headers } = await buildAuthedConfig();
  const body = {
    ...(countryName ? { countryName: String(countryName).trim() } : {}),
    ...(countryCode ? { countryCode: String(countryCode).trim() } : {}),
  };
  const response = await API.patch('/api/app/users/me/country', body, { headers });
  return response.data;
};

// PATCH /api/app/users/me/profile-pic
export const uploadMyProfilePic = async ({ uri, mimeType, fileName }: any) => {
  const { token, headers } = await buildAuthedConfig();

  const form = new FormData();
  form.append('image', {
    uri,
    type: mimeType ?? fallbackMimeType(uri),
    name: fileName ?? fallbackFileName(uri),
  } as any);
  form.append('token', token);

  const uploadHeaders: Record<string, string> = {
    Authorization: String(headers.Authorization),
  };

  const response = await fetch(`${API_BASE_URL}/api/app/users/me/profile-pic`, {
    method: 'PATCH',
    headers: uploadHeaders,
    body: form,
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = data?.message ?? data?.error ?? `Profile picture upload failed (${response.status})`;
    const err: any = new Error(message);
    err.status = response.status;
    err.responseData = data;
    throw err;
  }

  return data;
};

export default {
  getMyProfile,
  patchMyProfile,
  getMyCountry,
  patchMyCountry,
  uploadMyProfilePic,
};
