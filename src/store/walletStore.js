import { getHomeInit } from "../api/homeApi";
import { getWalletMe } from "../api/walletApi";
import { parseWalletBalance } from "../services/walletService";

let balance = { diamonds: 0, coins: 0 };
const listeners = new Set();
let refreshPromise = null;

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const getWalletBalanceSnapshot = () => balance;

export const subscribeWalletBalance = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setWalletBalance = (next = {}) => {
  balance = {
    diamonds: Number(next.diamonds ?? balance.diamonds ?? 0),
    coins: Number(next.coins ?? balance.coins ?? 0),
  };
  emit();
};

/** Deduct diamonds locally after a gift purchase (returns false if insufficient). */
export const deductDiamonds = (amount) => {
  const cost = Math.max(0, Number(amount) || 0);
  if (cost === 0) return true;
  if (balance.diamonds < cost) return false;
  setWalletBalance({ diamonds: balance.diamonds - cost });
  return true;
};

/** Prefer wallet API when available; otherwise fall back to home init profile. */
export const applyWalletFromSources = ({ walletData, userProfile } = {}) => {
  if (walletData != null) {
    const parsed = parseWalletBalance(walletData);
    setWalletBalance({
      diamonds: Number(parsed.diamonds ?? 0),
      coins: Number(parsed.coins ?? 0),
    });
    return balance;
  }

  setWalletBalance({
    diamonds: Number(userProfile?.diamonds ?? 0),
    coins: Number(userProfile?.coins ?? 0),
  });
  return balance;
};

/** Refresh balance from backend — used on screen focus and after rewards. */
export const refreshWalletBalance = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const [walletResult, initResult] = await Promise.allSettled([
        getWalletMe(),
        getHomeInit(),
      ]);

      const walletData =
        walletResult.status === "fulfilled" ? walletResult.value : null;
      const userProfile =
        initResult.status === "fulfilled"
          ? initResult.value?.userProfile
          : null;

      return applyWalletFromSources({ walletData, userProfile });
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
