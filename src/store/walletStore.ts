import API from '../api/axios';

interface WalletBalance {
  diamonds: number;
  coins: number;
}

let balance: WalletBalance = { diamonds: 28950, coins: 50000 };
const listeners = new Set<() => void>();
let refreshPromise: Promise<WalletBalance> | null = null;

const emit = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
};

export const getWalletBalanceSnapshot = (): WalletBalance => balance;

export const subscribeWalletBalance = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setWalletBalance = (next: Partial<WalletBalance> = {}) => {
  balance = {
    diamonds: Number(next.diamonds ?? balance.diamonds ?? 0),
    coins: Number(next.coins ?? balance.coins ?? 0),
  };
  emit();
};

export const deductDiamonds = (amount: number): boolean => {
  const cost = Math.max(0, Number(amount) || 0);
  if (cost === 0) return true;
  if (balance.diamonds < cost) return false;
  setWalletBalance({ diamonds: balance.diamonds - cost });
  return true;
};

export const refreshWalletBalance = async (): Promise<WalletBalance> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await API.get('/api/app/wallet/me');
      const data = res?.data?.data ?? res?.data ?? {};
      setWalletBalance({
        diamonds: Number(data.diamonds ?? data.diamondBalance ?? balance.diamonds),
        coins: Number(data.coins ?? data.coinBalance ?? balance.coins),
      });
      return balance;
    } catch {
      try {
        const res = await API.get('/api/app/users/me');
        const user = res?.data?.data ?? res?.data ?? {};
        if (user.diamonds != null || user.coins != null) {
          setWalletBalance({
            diamonds: Number(user.diamonds ?? balance.diamonds),
            coins: Number(user.coins ?? balance.coins),
          });
        }
      } catch {}
      return balance;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export default {
  getWalletBalanceSnapshot,
  subscribeWalletBalance,
  setWalletBalance,
  deductDiamonds,
  refreshWalletBalance,
};
