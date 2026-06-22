import { logout as apiLogout, deleteAccount as apiDeleteAccount } from "../api/authApi";
import { saveSession, clearSession, setTermsAccepted } from "../store/authStore";
import { normalizeAuthResponse } from "../utils/authResponse";
import { resolveAppUserId } from "../utils/sessionUser";
import { refreshTokenCache, clearTokenCache } from "../api/axios";
import { wsService } from "./websocket";

export const endLocalSession = async () => {
  wsService.disconnect();
  await clearSession();
  clearTokenCache();
};

export const logoutSession = async () => {
  try {
    const data = await apiLogout();
    
    return data;
  } catch (err) {
    
    throw err;
  } finally {
    await endLocalSession();
  }
};

export const deleteAccountSession = async ({ reason, additionalComment }) => {
  const data = await apiDeleteAccount({ reason, additionalComment });
  
  await endLocalSession();
  return data;
};

/** Call backend auth endpoint, persist JWT + user. */
export const establishSessionFromApi = async (apiCall, credential) => {
  const data = await apiCall(credential);
  const { token, user } = normalizeAuthResponse(data);
  const resolvedUserId = resolveAppUserId(user, token);
  
  if (!token) {
    throw new Error("Authentication succeeded but no token was returned.");
  }
  await saveSession(token, user);
  await setTermsAccepted(true);
  await refreshTokenCache(); // keep axios cache in sync immediately after login
  try {
    await wsService.connect();
  } catch {
    // WebSocket optional on login — reconnect when chat/party opens
  }
  return { token, user };
};
