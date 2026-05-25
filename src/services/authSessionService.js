import { saveSession } from "../store/authStore";
import { normalizeAuthResponse } from "../utils/authResponse";

/** Call backend auth endpoint, persist JWT + user. */
export const establishSessionFromApi = async (apiCall, credential) => {
  const data = await apiCall(credential);
  const { token, user } = normalizeAuthResponse(data);
  if (!token) {
    throw new Error("Authentication succeeded but no token was returned.");
  }
  await saveSession(token, user);
  return { token, user };
};
