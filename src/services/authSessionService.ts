import { logout as apiLogout, deleteAccount as apiDeleteAccount } from '../api/authApi';
import {
  saveSession,
  clearSession,
  setTermsAccepted,
  getUser,
} from '../store/authStore';
import { normalizeAuthResponse } from '../utils/authResponse';
import { refreshTokenCache, clearTokenCache } from '../api/axios';
import { websocketService } from '@shared/services/websocket/websocketService';
import { unregisterDevicePushToken } from './pushNotificationService';

export const endLocalSession = async () => {
  websocketService.disconnect();
  await unregisterDevicePushToken().catch(() => {});
  await clearSession();
  clearTokenCache();
};

export const logoutSession = async () => {
  unregisterDevicePushToken().catch(() => {});
  apiLogout().catch(() => {});
  await endLocalSession();
};

export const deleteAccountSession = async ({
  reason,
  additionalComment,
}: { reason?: string; additionalComment?: string } = {}) => {
  try {
    await unregisterDevicePushToken().catch(() => {});
    const data = await apiDeleteAccount({ reason, additionalComment });
    return data;
  } finally {
    await endLocalSession();
  }
};

/** Call backend auth endpoint, normalize response, and persist real JWT + user. */
export const establishSessionFromApi = async (
  apiCall: (credential: any) => Promise<any>,
  credential: any
): Promise<{ token: string; accessToken: string; refreshToken: string | null; user: any }> => {
  const data = await apiCall(credential);
  const { token, accessToken, refreshToken, user } = normalizeAuthResponse(data);
  const activeAccessToken = accessToken ?? token;

  if (!activeAccessToken) {
    throw new Error('Authentication succeeded but no token was returned.');
  }

  await saveSession({ accessToken: activeAccessToken, refreshToken }, user);
  await refreshTokenCache();
  await setTermsAccepted(true);

  try {
    websocketService.connect();
  } catch {}

  const sessionUser = (await getUser()) ?? user;
  return {
    token: activeAccessToken,
    accessToken: activeAccessToken,
    refreshToken,
    user: sessionUser,
  };
};

export default {
  endLocalSession,
  logoutSession,
  deleteAccountSession,
  establishSessionFromApi,
};
