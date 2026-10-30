import { create } from 'zustand';

export const useHomeStore = create((set) => ({
  recommendedUsers: [],
  liveUsers: [],
  setRecommendedUsers: (users) => set({ recommendedUsers: users }),
  setLiveUsers: (users) => set({ liveUsers: users }),
}));

export default useHomeStore;
