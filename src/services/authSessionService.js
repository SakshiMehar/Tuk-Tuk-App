import { saveSession } from "../store/authStore";
import { normalizeAuthResponse } from "../utils/authResponse";
import { resolveAppUserId } from "../utils/sessionUser";
import { refreshTokenCache } from "../api/axios";
import { wsService } from "./websocket";

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
  await refreshTokenCache(); // keep axios cache in sync immediately after login
  try {
    await wsService.connect();
  } catch {
    // WebSocket optional on login — reconnect when chat/party opens
  }
  return { token, user };
};
