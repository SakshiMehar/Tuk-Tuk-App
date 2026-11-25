import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env';
import { getDeviceHeaders } from '../utils/deviceHeaders';
import { safeGetMany, safeSetMany, safeRemoveMany } from '../utils/asyncStorageCompat';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT_MS || 15000,
});

const _s = {
  token: null,
  refreshToken: null,
  refreshPromise: null,
  handlingUnauth: false,
  onSessionExpired: null,
};

safeGetMany(['@auth_token', '@refresh_token'])
  .then((map) => {
    _s.token = map?.['@auth_token'] || null;
    _s.refreshToken = map?.['@refresh_token'] || null;
  })
  .catch(() => {});

export const refreshTokenCache = async () => {
  try {
    const map = await safeGetMany(['@auth_token', '@refresh_token']);
    _s.token = map?.['@auth_token'] || null;
    _s.refreshToken = map?.['@refresh_token'] || null;
    if (_s.token) _s.handlingUnauth = false;
  } catch {
    // ignore
  }
};

const decodeBase64 = (input) => {
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(input);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = input.replace(/=+$/, '');
  let output = '';
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ) {
    const idx = chars.indexOf(buffer);
    if (idx === -1) continue;
    bs = bc % 4 ? bs * 64 + idx : idx;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
};

export const isJwtExpired = (token, thresholdSeconds = 60) => {
  if (!token || typeof token !== 'string') return true;
  if (token.startsWith('jwt_') || token.startsWith('token_') || token.startsWith('usr_')) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = decodeBase64(padded);
    const payload = JSON.parse(decoded);
    if (!payload?.exp) return false;
    return Math.floor(Date.now() / 1000) >= payload.exp - thresholdSeconds;
  } catch {
    return true;
  }
};

export const refreshAuthToken = async () => {
  if (_s.refreshPromise) {
    return _s.refreshPromise;
  }
  _s.refreshPromise = (async () => {
    try {
      let rToken = _s.refreshToken;
      if (!rToken) {
        rToken = await AsyncStorage.getItem('@refresh_token');
      }
      if (!rToken) {
        throw new Error('No refresh token available');
      }

      const deviceHeaders = await getDeviceHeaders().catch(() => ({}));

      const res = await axios.post(
        `${API_BASE_URL}/api/auth/refresh-token`,
        { refreshToken: rToken },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(API_BASE_URL.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {}),
            ...deviceHeaders,
          },
          timeout: API_TIMEOUT_MS,
        }
      );

      const data = res?.data || {};
      const newAccessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken;

      if (!newAccessToken) {
        throw new Error('Token refresh response missing accessToken');
      }

      await safeSetMany({
        '@auth_token': String(newAccessToken),
        ...(newRefreshToken ? { '@refresh_token': String(newRefreshToken) } : {}),
      });

      _s.token = String(newAccessToken);
      if (newRefreshToken) {
        _s.refreshToken = String(newRefreshToken);
      }
      _s.handlingUnauth = false;
      return String(newAccessToken);
    } catch (refreshErr) {
      _s.token = null;
      _s.refreshToken = null;
      await safeRemoveMany([
        '@auth_token',
        '@refresh_token',
        '@auth_user',
        '@terms_accepted',
      ]);
      if (!_s.handlingUnauth) {
        _s.handlingUnauth = true;
        _s.onSessionExpired?.();
      }
      throw refreshErr;
    } finally {
      _s.refreshPromise = null;
    }
  })();
  return _s.refreshPromise;
};

export const getValidAuthToken = async () => {
  if (!_s.token) {
    await refreshTokenCache();
  }
  let token = _s.token;
  if (!token) return null;

  if (isJwtExpired(token, 60)) {
    // If it is a corrupt or mock token from dev simulation, immediately purge
    if (token.startsWith('jwt_') || token.startsWith('token_') || token.split('.').length < 3) {
      _s.token = null;
      _s.refreshToken = null;
      await safeRemoveMany([
        '@auth_token',
        '@refresh_token',
        '@auth_user',
        '@terms_accepted',
      ]);
      return null;
    }
    try {
      token = await refreshAuthToken();
    } catch (err) {
      return null;
    }
  }
  return token;
};

export const getBearerToken = async () => {
  return getValidAuthToken();
};

/** Merge Authorization into axios/fetch config */
export const authRequestConfig = async (config = {}) => {
  const token = await getBearerToken();
  const headers = { ...(config.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (API_BASE_URL.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }
  return { ...config, headers };
};

export const clearTokenCache = () => {
  _s.token = null;
  _s.refreshToken = null;
  _s.refreshPromise = null;
};

export const setSessionExpiredHandler = (fn) => {
  _s.onSessionExpired = fn;
};

API.interceptors.request.use(
  async (config) => {
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (isFormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    try {
      const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
      if (!config.headers) config.headers = {};
      Object.entries(deviceHeaders).forEach(([k, v]) => {
        if (!config.headers[k]) {
          config.headers[k] = v;
        }
      });
      if (API_BASE_URL.includes('ngrok')) {
        config.headers['ngrok-skip-browser-warning'] = 'true';
      }
    } catch (_) {}

    const token = await getBearerToken();
    _s.token = token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;
    const requestUrl = `${originalRequest?.baseURL ?? ''}${originalRequest?.url ?? ''}`;

    const isAuthEndpoint =
      /\/api\/auth\/(?!user|me)/i.test(requestUrl) ||
      /\/api\/app\/users\/logout/i.test(requestUrl);
    const isRefreshEndpoint = /\/api\/auth\/refresh-token/i.test(requestUrl);
    const skipRefresh =
      Boolean(originalRequest?._skipAuthRefresh) ||
      Boolean(originalRequest?._retry) ||
      isAuthEndpoint ||
      isRefreshEndpoint;

    // Suppress noisy but expected 409 seat-occupied conflicts
    const isSeatOccupied =
      status === 409 &&
      /\/seat\/\d+\/claim/i.test(requestUrl);

    const shouldSuppressLog =
      isSeatOccupied ||
      (status === 401 && _s.handlingUnauth);

    if (!shouldSuppressLog) {
      console.error(
        '[axios] request failed:',
        status,
        requestUrl,
        error?.response?.data,
        'message:',
        error?.message
      );
    }

    // ── 401: Automatic Token Refresh ────────────────────────────
    if (status === 401 && !skipRefresh && originalRequest) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAuthToken();
        const authHeader = `Bearer ${newAccessToken}`;
        if (!originalRequest.headers) originalRequest.headers = {};
        originalRequest.headers.Authorization = authHeader;
        return API(originalRequest);
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }

    // ── 401 on refresh endpoint or when refresh was skipped ───
    if (status === 401 && (isRefreshEndpoint || (skipRefresh && !isAuthEndpoint))) {
      if (!_s.handlingUnauth) {
        _s.handlingUnauth = true;
        _s.token = null;
        _s.refreshToken = null;
        await safeRemoveMany([
          '@auth_token',
          '@refresh_token',
          '@auth_user',
          '@terms_accepted',
        ]);
        _s.onSessionExpired?.();
      }
    }

    let message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Something went wrong';

    const err = new Error(message);
    err.status = status;
    err.responseData = error?.response?.data;
    err.requestUrl = requestUrl;

    return Promise.reject(err);
  }
);

export default API;
