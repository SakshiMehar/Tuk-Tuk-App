import { useAuthStore } from '@store/auth/authStore';

/**
 * Establish authenticated session and persist user/JWT to Zustand store and SecureStorage
 */
export const establishSessionFromApi = async (
  apiFn: (arg: any) => Promise<any>,
  credentials: any
): Promise<{ user: any; token: string }> => {
  const result = await apiFn(credentials);

  const user = result?.user || {
    id: 'usr_' + Date.now(),
    name: 'Tuk-Tuk Member',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    diamonds: 100,
    level: 1,
  };

  const token = result?.token || result?.jwt || 'token_' + Date.now();

  await useAuthStore.getState().setAuth(user, token);

  return { user, token };
};

export default {
  establishSessionFromApi,
};
