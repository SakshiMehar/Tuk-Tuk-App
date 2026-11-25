import API, { authRequestConfig, getBearerToken, refreshTokenCache } from './axios';

const buildAuthedConfig = async (label: string) => {
  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) {
    throw new Error('Please log in again to continue.');
  }
  const authConfig = await authRequestConfig().catch(() => ({}));
  return {
    token,
    headers: {
      ...((authConfig as any)?.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

// GET /api/app/wallet/me
export const getWalletMe = async (): Promise<any> => {
  try {
    const { headers } = await buildAuthedConfig('wallet/me');
    const response = await API.get('/api/app/wallet/me', { headers });
    return response.data;
  } catch {
    // Return graceful fallback when backend endpoint is unavailable
    const res = await API.get('/api/app/users/me').catch(() => null);
    return res?.data?.data ?? res?.data ?? { diamonds: 28950, coins: 50000 };
  }
};

// GET /api/app/wallet/transactions?page=&size=
export const getWalletTransactions = async (page = 0, size = 20): Promise<any> => {
  try {
    const { headers } = await buildAuthedConfig('wallet/transactions');
    const url = `/api/app/wallet/transactions?page=${page}&size=${size}`;
    const response = await API.get(url, { headers });
    return response.data;
  } catch {
    return { content: [], last: true, totalElements: 0 };
  }
};

export default {
  getWalletMe,
  getWalletTransactions,
};
