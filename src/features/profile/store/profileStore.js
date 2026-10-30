import { create } from 'zustand';

export const useProfileStore = create((set) => ({
  stats: {
    followers: 1420,
    following: 280,
    diamondsSent: 45000,
  },
  setStats: (stats) => set({ stats }),
}));

export default useProfileStore;
