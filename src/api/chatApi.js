import API, { authRequestConfig } from "./axios";

export const getChats = async () => {
  const response = await API.get("/api/app/chats", await authRequestConfig());
  
  return response.data;
};

export const getUserMessages = async (userId) => {
  const response = await API.get(
    `/api/app/chats/users/${userId}/messages`,
    await authRequestConfig()
  );
  
  return response.data;
};

export const markUserMessagesRead = async (userId) => {
  const response = await API.post(
    `/api/app/chats/users/${userId}/read`,
    {},
    await authRequestConfig()
  );
  
  return response.data;
};
