import { create } from 'zustand';

export const useWalletStore = create((set) => ({
  diamonds: 1250,
  packages: [
    { id: 'p1', diamonds: 100, price: '₹99', bonus: 0 },
    { id: 'p2', diamonds: 550, price: '₹499', bonus: 50 },
    { id: 'p3', diamonds: 1200, price: '₹999', bonus: 200 },
    { id: 'p4', diamonds: 3000, price: '₹2499', bonus: 600 },
  ],
  transactions: [],
  isRechargeModalOpen: false,

  setDiamonds: (diamonds) => set({ diamonds }),
  setPackages: (packages) => set({ packages }),
  setRechargeModalOpen: (open) => set({ isRechargeModalOpen: open }),
}));

export default useWalletStore;
