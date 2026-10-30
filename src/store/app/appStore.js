import { create } from 'zustand';

export const useAppStore = create((set) => ({
  isAppReady: false,
  themeMode: 'dark', // 'dark' | 'light'
  activeModal: null,

  setAppReady: (ready) => set({ isAppReady: ready }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  openModal: (modalName) => set({ activeModal: modalName }),
  closeModal: () => set({ activeModal: null }),
}));

export default useAppStore;
