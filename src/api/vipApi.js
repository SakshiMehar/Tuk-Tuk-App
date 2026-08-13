import API, { authRequestConfig } from "./axios";

/** GET /api/app/vip/me/profile-frame */
export const getMyVipProfileFrame = async () => {
  const response = await API.get(
    "/api/app/vip/me/profile-frame",
    await authRequestConfig()
  );
  return response.data;
};

/** GET /api/app/vip/:userId/profile-frame — another user's VIP profile frame.
 *  Used as a fallback only where a surface doesn't already embed the frame
 *  URL directly on the user/seat/message payload it returns. */
export const getVipProfileFrameForUser = async (userId) => {
  const response = await API.get(
    `/api/app/vip/${userId}/profile-frame`,
    await authRequestConfig()
  );
  return response.data;
};

/** GET /api/app/vip/me/entry-frame */
export const getMyVipEntryFrame = async () => {
  const response = await API.get(
    "/api/app/vip/me/entry-frame",
    await authRequestConfig()
  );
  return response.data;
};

/** GET /api/app/vip/me/chat-frame */
export const getMyVipChatFrame = async () => {
  const response = await API.get(
    "/api/app/vip/me/chat-frame",
    await authRequestConfig()
  );
  return response.data;
};

/** GET /api/app/vip/me/logo */
export const getMyVipLogo = async () => {
  const response = await API.get(
    "/api/app/vip/me/logo",
    await authRequestConfig()
  );
  return response.data;
};
