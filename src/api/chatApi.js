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

  console.log("[CHAT API] Status:", response.status);
  console.log("[CHAT API] Response:", response.data);


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

export const uploadChatMedia = async (fileUri, mimeType) => {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'file';

  const fieldName = mimeType.startsWith('image/') ? 'images' : 'audio';

  formData.append(fieldName, {
    uri: fileUri,
    type: mimeType,
    name: filename,
  });

  const config = await authRequestConfig();
  const token = config?.headers?.Authorization || "";
  const baseUrl = API.defaults.baseURL;

  const response = await fetch(`${baseUrl}/api/app/chats/media/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: token,
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return data;
};
