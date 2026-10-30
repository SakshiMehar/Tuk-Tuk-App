import { create } from 'zustand';

export const useChatStore = create((set) => ({
  conversations: [],
  activeMessages: {}, // chatId -> Array of messages
  typingUsers: {},    // chatId -> Set or array of userIds

  setConversations: (conversations) => set({ conversations }),

  addMessage: (chatId, message) => {
    set((state) => {
      const existing = state.activeMessages[chatId] || [];
      return {
        activeMessages: {
          ...state.activeMessages,
          [chatId]: [...existing, message],
        },
      };
    });
  },

  setMessages: (chatId, messages) => {
    set((state) => ({
      activeMessages: {
        ...state.activeMessages,
        [chatId]: messages,
      },
    }));
  },
}));

export default useChatStore;
