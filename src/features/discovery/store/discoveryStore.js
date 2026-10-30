import { create } from 'zustand';

export const useDiscoveryStore = create((set) => ({
  nearbyUsers: [],
  activeTab: 'nearby', // 'nearby' | 'explore'
  setNearbyUsers: (users) => set({ nearbyUsers: users }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useDiscoveryStore;
