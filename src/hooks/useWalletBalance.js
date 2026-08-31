import { useSyncExternalStore } from "react";
import {
  getWalletBalanceSnapshot,
  subscribeWalletBalance,
} from "../store/walletStore";

export const useWalletBalance = () =>
  useSyncExternalStore(
    subscribeWalletBalance,
    getWalletBalanceSnapshot,
    getWalletBalanceSnapshot
  );
