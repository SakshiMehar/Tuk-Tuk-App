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
    console.log(
      "[authSession] logout response:",
      JSON.stringify(data, null, 2)
    );
    return data;
  } catch (err) {
    console.log("[authSession] logout failed:", err?.message);
    throw err;
  } finally {
    await endLocalSession();
  }
};

export const deleteAccountSession = async ({ reason, additionalComment }) => {
  const data = await apiDeleteAccount({ reason, additionalComment });
  console.log(
    "[authSession] delete account response:",
    JSON.stringify(data, null, 2)
  );
  await endLocalSession();
  return data;
};

/** Call backend auth endpoint, persist JWT + user. */
export const establishSessionFromApi = async (apiCall, credential) => {
  const data = await apiCall(credential);
  const { token, user } = normalizeAuthResponse(data);
  const resolvedUserId = resolveAppUserId(user, token);
  console.log(
    "[authLogin] session:",
    JSON.stringify(
      {
        userId: resolvedUserId,
        name: user?.name ?? user?.username ?? null,
        profilePicUrl: user?.profilePicUrl ?? user?.avatarUrl ?? null,
        hasToken: Boolean(token),
        user,
      },
      null,
      2
    )
  );
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
