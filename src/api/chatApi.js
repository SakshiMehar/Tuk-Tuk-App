import API, { authRequestConfig } from "./axios";

export const getChats = async () => {
  const response = await API.get("/api/app/chats", await authRequestConfig());
  console.log("[chatApi] GET /api/app/chats:", JSON.stringify(response.data, null, 2));
  return response.data;
};

export const getUserMessages = async (userId) => {
  const response = await API.get(
    `/api/app/chats/users/${userId}/messages`,
    await authRequestConfig()
  );
  console.log(
    `[chatApi] GET /api/app/chats/users/${userId}/messages:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const markUserMessagesRead = async (userId) => {
  const response = await API.post(
    `/api/app/chats/users/${userId}/read`,
    {},
    await authRequestConfig()
  );
  console.log(
    `[chatApi] POST /api/app/chats/users/${userId}/read:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};
