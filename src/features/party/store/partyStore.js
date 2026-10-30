import { create } from 'zustand';

const INITIAL_SEATS = Array.from({ length: 8 }, (_, i) => ({
  index: i,
  userId: null,
  userName: null,
  userAvatar: null,
  isMuted: false,
  isLocked: false,
  isHost: i === 0,
}));

export const usePartyStore = create((set, get) => ({
  // Room metadata
  room: null,
  seats: INITIAL_SEATS,

  // Real-time voice isolation: Map of userId -> volume level
  speakingUsers: {},

  // Room chat feed
  chatMessages: [],

  // Gifts
  giftQueue: [],
  activeGift: null,

  // Feature modals state isolated from screen
  modals: {
    exit: false,
    create: false,
    follow: false,
    pk: false,
    treasure: false,
  },

  // Actions
  setRoom: (room) => set({ room }),

  setSeats: (seats) => set({ seats }),

  updateSeat: (seatIndex, partialSeat) => {
    set((state) => {
      const updatedSeats = [...state.seats];
      if (updatedSeats[seatIndex]) {
        updatedSeats[seatIndex] = { ...updatedSeats[seatIndex], ...partialSeat };
      }
      return { seats: updatedSeats };
    });
  },

  setSpeaking: (userId, isSpeaking, volume = 0) => {
    set((state) => {
      if (!isSpeaking && !state.speakingUsers[userId]) return state;
      const copy = { ...state.speakingUsers };
      if (isSpeaking) {
        copy[userId] = volume;
      } else {
        delete copy[userId];
      }
      return { speakingUsers: copy };
    });
  },

  addChatMessage: (message) => {
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-50), message],
    }));
  },

  enqueueGift: (gift) => {
    set((state) => ({
      giftQueue: [...state.giftQueue, gift],
      activeGift: state.activeGift || gift,
    }));
  },

  dequeueGift: (giftId) => {
    set((state) => {
      const remaining = state.giftQueue.filter((g) => g.id !== giftId);
      return {
        giftQueue: remaining,
        activeGift: remaining[0] || null,
      };
    });
  },

  setModalVisible: (modalName, visible) => {
    set((state) => ({
      modals: { ...state.modals, [modalName]: visible },
    }));
  },

  resetRoom: () => {
    set({
      room: null,
      seats: INITIAL_SEATS,
      speakingUsers: {},
      chatMessages: [],
      giftQueue: [],
      activeGift: null,
      modals: {
        exit: false,
        create: false,
        follow: false,
        pk: false,
        treasure: false,
      },
    });
  },
}));

export default usePartyStore;
