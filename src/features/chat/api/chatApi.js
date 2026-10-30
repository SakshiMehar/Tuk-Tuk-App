import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const chatApi = {
  getConversations: () => apiClient.get(ENDPOINTS.CHAT.CONVERSATIONS),
  getMessages: (chatId) => apiClient.get(ENDPOINTS.CHAT.MESSAGES(chatId)),
  sendMessage: (chatId, body) => apiClient.post(ENDPOINTS.CHAT.SEND_MESSAGE(chatId), body),
  markAsRead: (chatId) => apiClient.post(ENDPOINTS.CHAT.READ_MESSAGES(chatId), {}),
};

export default chatApi;
