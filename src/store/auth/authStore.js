import { create } from 'zustand';
import { apiClient } from '@shared/network/apiClient';
import { websocketService } from '@shared/services/websocket/websocketService';
import { secureStorage } from '@shared/storage/secureStorage';
import { storage } from '@shared/storage/storage';
import { STORAGE_KEYS } from '@shared/storage/storageKeys';
import { logger } from '@shared/utils/logger';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token) => {
    logger.info('AuthStore', `User logged in: ${user?.id || 'unknown'}`);
    apiClient.setAuthToken(token);
    websocketService.setAuthToken(token);

    await secureStorage.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await storage.setItem(STORAGE_KEYS.CURRENT_USER, user);

    set({
      user,
      token,
      isAuthenticated: !!token,
      isLoading: false,
    });
  },

  updateUser: (partialUser) => {
    set((state) => {
      const updated = { ...state.user, ...partialUser };
      storage.setItem(STORAGE_KEYS.CURRENT_USER, updated);
      return { user: updated };
    });
  },

  logout: async () => {
    logger.info('AuthStore', 'Logging out user');
    apiClient.setAuthToken(null);
    websocketService.setAuthToken(null);
    websocketService.disconnect();

    await secureStorage.removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.CURRENT_USER);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  hydrateAuth: async () => {
    try {
      const token = await secureStorage.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      const user = await storage.getJson(STORAGE_KEYS.CURRENT_USER);

      if (token && user) {
        apiClient.setAuthToken(token);
        websocketService.setAuthToken(token);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      logger.error('AuthStore', 'Failed to hydrate auth', error);
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
