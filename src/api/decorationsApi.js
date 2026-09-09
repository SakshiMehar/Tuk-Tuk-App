import API, { authRequestConfig } from "./axios";

/** GET /api/v1/users/:userId/decorations — a user's currently-equipped
 *  decoration URLs: { badgeUrl, frameUrl }. Either field may be null. */
export const getUserDecorations = async (userId) => {
  const id = String(userId);

  const response = await API.get(
    `/api/v1/users/${id}/decorations`,
    await authRequestConfig()
  );
  console.log(`[decorationsApi] GET /api/v1/users/${id}/decorations -> RAW`, JSON.stringify(response.data));
  return response.data;
};
