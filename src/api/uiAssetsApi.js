import API, { authRequestConfig } from "./axios";

/** GET /api/app/ui-assets/new-user-frame */
export const getNewUserFrame = async () => {
  const response = await API.get(
    "/api/app/ui-assets/new-user-frame",
    await authRequestConfig()
  );
  return response.data;
};

/** GET /api/app/ui-assets/level/:level — level badge image for profile */
export const getLevelBadge = async (level = 1) => {
  const response = await API.get(
    `/api/app/ui-assets/level/${level}`,
    await authRequestConfig()
  );
  return response.data;
};
