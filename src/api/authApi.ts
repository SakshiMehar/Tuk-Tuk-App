import API, { authRequestConfig } from './axios';
import { getDeviceHeaders } from '../utils/deviceHeaders';

const postAuthWithFallback = async (
  paths: string[],
  body: any,
  extraHeaders: Record<string, string> = {}
) => {
  let lastError: any;
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  for (const path of paths) {
    try {
      const response = await API.post(path, body, {
        headers: {
          ...deviceHeaders,
          ...extraHeaders,
        },
      });
      return response.data;
    } catch (error: any) {
      lastError = error;
      const status = error?.status ?? error?.response?.status;
      if (status !== 404 || path === paths[paths.length - 1]) {
        throw error;
      }
    }
  }
  throw lastError;
};

export const guestLogin = async () => {
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post(
    '/api/auth/guest',
    {},
    {
      headers: deviceHeaders,
    }
  );
  return response.data;
};

export const googleLogin = async (idToken: string, name?: string) => {
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post(
    '/api/auth/google-login',
    { idToken, name },
    { headers: deviceHeaders }
  );
  return response.data;
};

export const appleLogin = async (identityToken: string, name?: string) => {
  const body = { identityToken, ...(name ? { name } : {}) };
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post('/api/auth/apple-login', body, {
    headers: deviceHeaders,
  });
  return response.data;
};

export const firebasePhoneAuth = async (
  idToken: string,
  phoneNumber: string,
  name?: string
) => {
  const body = { idToken, phoneNumber, ...(name ? { name } : {}) };
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post('/api/auth/firebase-phone', body, {
    headers: deviceHeaders,
  });
  return response.data;
};

export const firebaseFacebookAuth = async (
  idToken: string,
  phoneNumber?: string | null,
  name?: string,
  avatar?: string
) => {
  const body = {
    idToken,
    ...(phoneNumber ? { phoneNumber } : {}),
    ...(name ? { name } : {}),
    ...(avatar ? { avatar } : {}),
  };
  return postAuthWithFallback(
    ['/api/auth/firebase-facebook', '/api/auth/facebook-login'],
    body
  );
};

export const facebookLogin = async (accessToken: string) => {
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await API.post(
    '/api/auth/facebook-login',
    { accessToken },
    { headers: deviceHeaders }
  );
  return response.data;
};

export const refreshToken = async (refreshTokenValue: any) => {
  const token =
    typeof refreshTokenValue === 'string'
      ? refreshTokenValue
      : refreshTokenValue?.refreshToken;
  const body = { refreshToken: token };
  const deviceHeaders = await getDeviceHeaders().catch(() => ({}));
  const response = await (API as any).post('/api/auth/refresh-token', body, {
    _skipAuthRefresh: true,
    headers: deviceHeaders,
  });
  return response.data;
};

export const logout = async (payload: any = {}) => {
  const refreshTokenValue =
    typeof payload === 'string' ? payload : payload?.refreshToken;
  const body = refreshTokenValue ? { refreshToken: refreshTokenValue } : {};
  return postAuthWithFallback(
    ['/api/app/users/logout', '/api/auth/logout'],
    body
  );
};

export const deleteAccount = async ({
  reason,
  additionalComment,
}: { reason?: string; additionalComment?: string } = {}) => {
  const body = {
    reason: String(reason ?? '').trim(),
    additionalComment: String(additionalComment ?? '').trim(),
  };

  const response = await API.delete('/api/auth/account', {
    ...(await authRequestConfig()),
    data: body,
  });
  return response.data;
};

export const authApi = {
  guestLogin,
  googleLogin,
  appleLogin,
  firebasePhoneAuth,
  firebaseFacebookAuth,
  facebookLogin,
  refreshToken,
  logout,
  deleteAccount,
};

export default authApi;
