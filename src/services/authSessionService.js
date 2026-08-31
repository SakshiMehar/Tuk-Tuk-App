import { logout as apiLogout, deleteAccount as apiDeleteAccount } from "../api/authApi";
import {
  saveSession,
  clearSession,
  setTermsAccepted,
  getUser,
  updateUser,
  getPendingInviteCode,
  clearPendingInviteCode,
} from "../store/authStore";
import { normalizeAuthResponse } from "../utils/authResponse";
import { refreshTokenCache, clearTokenCache } from "../api/axios";
import { wsService } from "./websocket";
import { loadMyProfile } from "./meProfileService";
import { applyNewUserFrameForLogin } from "./newUserFrameService";
import { applyInitialUserLevelForLogin } from "./userLevelService";
import { redeemInviteCode } from "./inviteFriendsService";

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

/** Login/auth responses omit avatar — load persisted profile from GET /api/app/users/me/profile. */
export const hydrateSessionUserFromProfile = async () => {
  try {
    const profile = await loadMyProfile();
    const useLocalAvatar = Boolean(profile.avatarId) || !profile.profilePicUrl;

    await updateUser({
      ...(profile.name ? { name: profile.name } : {}),
      ...(profile.gender ? { gender: profile.gender } : {}),
      ...(profile.avatarId
        ? { avatarId: profile.avatarId, avatar: profile.avatarId }
        : {}),
      profilePicUrl: profile.profilePicUrl ?? null,
      ...(profile.profilePicUrl ? { avatarUrl: profile.profilePicUrl } : {}),
      useLocalAvatar,
      ...(profile.createdAt ? { createdAt: profile.createdAt } : {}),
      ...(profile.hasNewUserFrame ? { hasNewUserFrame: true } : {}),
      ...(profile.newUserFrameUrl ? { newUserFrameUrl: profile.newUserFrameUrl } : {}),
      ...(profile.level != null ? { level: profile.level } : {}),
      ...(profile.levelBadgeUrl ? { levelBadgeUrl: profile.levelBadgeUrl } : {}),
    });

    return profile;
  } catch {
    return null;
  }
};

/** Login page → invite code entered → login/register → JWT issued → redeem it here,
 *  automatically, before the caller navigates to home. Covers every login path since
 *  they all funnel through establishSessionFromApi. Best-effort: a failed/missing code
 *  never blocks login — it's just cleared so a stale code isn't retried forever. */
const applyPendingInviteCodeIfAny = async () => {
  const code = await getPendingInviteCode();
  if (!code) return;
  try {
    await redeemInviteCode(code);
  } catch (err) {
    console.log("[authSessionService] invite code redeem failed:", err?.message ?? err);
  } finally {
    await clearPendingInviteCode();
  }
};

/** Call backend auth endpoint, persist JWT + user. */
export const establishSessionFromApi = async (apiCall, credential) => {
  const data = await apiCall(credential);
  const { token, user } = normalizeAuthResponse(data);

  if (!token) {
    throw new Error("Authentication succeeded but no token was returned.");
  }
  await saveSession(token, user);
  await refreshTokenCache();
  await hydrateSessionUserFromProfile();
  await applyNewUserFrameForLogin(data);
  await applyInitialUserLevelForLogin(data);
  await setTermsAccepted(true);
  await applyPendingInviteCodeIfAny();
  try {
    await wsService.connect();
  } catch {
    // WebSocket optional on login — reconnect when chat/party opens
  }
  const sessionUser = (await getUser()) ?? user;
  return { token, user: sessionUser };
};
