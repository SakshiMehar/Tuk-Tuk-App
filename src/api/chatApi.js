import API from "./axios";

export const getChats = async () => {
  const response = await API.get("/api/app/chats");
  console.log("[chatApi] GET /api/app/chats:", JSON.stringify(response.data, null, 2));
  return response.data;
};

export const getUserMessages = async (userId) => {
  const response = await API.get(`/api/app/chats/users/${userId}/messages`);
  console.log(
    `[chatApi] GET /api/app/chats/users/${userId}/messages:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

export const markUserMessagesRead = async (userId) => {
  const response = await API.post(`/api/app/chats/users/${userId}/read`);
  console.log(
    `[chatApi] POST /api/app/chats/users/${userId}/read:`,
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};
