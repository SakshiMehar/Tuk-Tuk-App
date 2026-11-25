import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { apiClient } from '@shared/network/apiClient';
import { websocketService } from '@shared/services/websocket/websocketService';
import { secureStorage } from '@shared/storage/secureStorage';
import { storage } from '@shared/storage/storage';
import { STORAGE_KEYS } from '@shared/storage/storageKeys';
import { logger } from '@shared/utils/logger';
import { refreshTokenCache, clearTokenCache } from '../../api/axios';
import { getDeviceHeaders } from '../../utils/deviceHeaders';
import { safeGetMany, safeSetMany, safeRemoveMany } from '../../utils/asyncStorageCompat';

import {
  registerForPushNotifications,
  unregisterDevicePushToken,
} from '../../services/pushNotificationService';

const isValidJwt = (token) => {
  if (!token || typeof token !== 'string') return false;
  if (token.startsWith('jwt_') || token.startsWith('token_') || token.startsWith('usr_')) return false;
  return token.split('.').length === 3;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token, refreshToken = null) => {
    logger.info('AuthStore', `User logged in: ${user?.id || user?.userId || 'unknown'}`);

    if (!isValidJwt(token)) {
      logger.warn('AuthStore', 'Attempted to set invalid/mock JWT token');
    }

    apiClient.setAuthToken(token);
    websocketService.setAuthToken(token);

    try {
      const headers = await getDeviceHeaders().catch(() => ({}));
      if (headers?.['X-Device-Id']) {
        apiClient.setDeviceId(headers['X-Device-Id']);
      }
    } catch {}

    const entries = {
      '@auth_token': String(token || ''),
      '@auth_user': JSON.stringify(user || {}),
    };
    if (refreshToken) {
      entries['@refresh_token'] = String(refreshToken);
    }

    await safeSetMany(entries);
    await secureStorage.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await storage.setItem(STORAGE_KEYS.CURRENT_USER, user);
    await refreshTokenCache();

    set({
      user,
      token,
      refreshToken,
      isAuthenticated: isValidJwt(token),
      isLoading: false,
    });

    DeviceEventEmitter.emit('sessionSaved', user);

    if (isValidJwt(token)) {
      registerForPushNotifications({ force: true }).catch(() => {});
      try {
        websocketService.connect();
      } catch {}
    }
  },

  updateUser: async (partialUser) => {
    const current = get().user || {};
    const updated = { ...current, ...partialUser };
    await AsyncStorage.setItem('@auth_user', JSON.stringify(updated)).catch(() => {});
    await storage.setItem(STORAGE_KEYS.CURRENT_USER, updated);
    set({ user: updated });
    DeviceEventEmitter.emit('userProfileUpdated', updated);
    return updated;
  },

  logout: async () => {
    logger.info('AuthStore', 'Logging out user');
    unregisterDevicePushToken().catch(() => {});

    apiClient.setAuthToken(null);
    websocketService.setAuthToken(null);
    websocketService.disconnect();

    await safeRemoveMany([
      '@auth_token',
      '@refresh_token',
      '@auth_user',
      '@terms_accepted',
    ]);
    await secureStorage.removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.CURRENT_USER);
    clearTokenCache();

    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  hydrateAuth: async () => {
    try {
      const map = await safeGetMany(['@auth_token', '@refresh_token', '@auth_user']);

      let token = map['@auth_token'];
      let refreshToken = map['@refresh_token'];
      let user = null;

      try {
        const rawUser = map['@auth_user'];
        user = rawUser ? JSON.parse(rawUser) : null;
      } catch {
        user = null;
      }

      if (!token) {
        token = await secureStorage.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      }
      if (!user) {
        user = await storage.getJson(STORAGE_KEYS.CURRENT_USER);
      }

      // Discard stale mock tokens from dev simulation
      if (token && !isValidJwt(token)) {
        logger.warn('AuthStore', 'Purging stale non-JWT token from storage:', token);
        await safeRemoveMany(['@auth_token', '@refresh_token', '@auth_user']);
        await secureStorage.removeSecureItem(STORAGE_KEYS.AUTH_TOKEN).catch(() => {});
        token = null;
        user = null;
        refreshToken = null;
      }

      if (token && user) {
        apiClient.setAuthToken(token);
        websocketService.setAuthToken(token);
        try {
          const headers = await getDeviceHeaders().catch(() => ({}));
          if (headers?.['X-Device-Id']) {
            apiClient.setDeviceId(headers['X-Device-Id']);
          }
        } catch {}

        await refreshTokenCache();

        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        try {
          websocketService.connect();
        } catch {}
      } else {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      logger.error('AuthStore', 'Failed to hydrate auth', error);
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
