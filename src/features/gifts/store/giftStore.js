import { create } from 'zustand';

export const useGiftStore = create((set) => ({
  catalog: [
    { id: 'g1', name: 'Rose', price: 10, icon: '🌹', category: 'Popular' },
    { id: 'g2', name: 'Love Heart', price: 50, icon: '💖', category: 'Popular' },
    { id: 'g3', name: 'Sports Car', price: 500, icon: '🏎️', category: 'Luxury' },
    { id: 'g4', name: 'Super Rocket', price: 2000, icon: '🚀', category: 'Luxury' },
    { id: 'g5', name: 'Crown', price: 5000, icon: '👑', category: 'Exclusive' },
  ],
  selectedGift: null,
  setSelectedGift: (gift) => set({ selectedGift: gift }),
}));

export default useGiftStore;
