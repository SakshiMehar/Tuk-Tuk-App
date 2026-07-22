import API, { authRequestConfig, getBearerToken, refreshTokenCache } from "./axios";

const buildAuthedConfig = async (label) => {
  await refreshTokenCache();
  const token = await getBearerToken();
  if (!token) {
    throw new Error("Please log in again to continue.");
  }
  const authConfig = await authRequestConfig();

  return {
    token,
    headers: {
      ...authConfig.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

/** GET /api/app/invite-friends/me — invite code, personal stats, limited-time task progress. */
export const getInviteFriendsMe = async () => {
  const { headers } = await buildAuthedConfig("invite-friends/me");
  const response = await API.get("/api/app/invite-friends/me", { headers });
  return response.data;
};

/** GET /api/app/invite-friends/config — invite rules copy + reward tier ladder (rarely changes). */
export const getInviteFriendsConfig = async () => {
  const { headers } = await buildAuthedConfig("invite-friends/config");
  const response = await API.get("/api/app/invite-friends/config", { headers });
  console.log("[inviteFriendsApi] GET /api/app/invite-friends/config -> RAW", JSON.stringify(response.data, null, 2));
  return response.data;
};

/** GET /api/app/invite-friends/activity — public ticker of the latest 20 wallet transactions
 *  with referenceType=INVITE_FRIEND_REWARD and a positive diamond amount. Public endpoint —
 *  no JWT required, so this deliberately skips buildAuthedConfig. */
export const getInviteFriendsActivity = async () => {
  const response = await API.get("/api/app/invite-friends/activity");
  console.log("[inviteFriendsApi] GET /api/app/invite-friends/activity ->", JSON.stringify(response.data, null, 2));
  return response.data;
};

/** GET /api/app/invite-friends/record?tab=&page=&size= — invited-friends / rewards / unclaimed
 *  list. `tab` is an uppercase enum on the wire (e.g. FRIENDS) — callers pass the lowercase UI key. */
export const getInviteFriendsRecord = async (tab = "friends", page = 0, size = 20) => {
  const { headers } = await buildAuthedConfig("invite-friends/record");
  const url = `/api/app/invite-friends/record?tab=${encodeURIComponent(tab.toUpperCase())}&page=${page}&size=${size}`;
  const response = await API.get(url, { headers });
  return response.data;
};

/** POST /api/app/invite-friends/share — logs a share action; may progress/complete the
 *  limited-time task. No request body required. */
export const shareInviteFriends = async () => {
  const { headers } = await buildAuthedConfig("invite-friends/share");
  // `undefined` (not `null`) — with Content-Type forced to application/json, axios would
  // otherwise JSON.stringify(null) into a literal "null" body instead of sending none at all.
  const response = await API.post("/api/app/invite-friends/share", undefined, { headers });
  return response.data;
};

/** POST /api/app/invite-friends/withdraw — moves unclaimed earnings into the wallet diamond
 *  balance (server locks the wallet row, tallies earned-minus-received, credits the remainder,
 *  and logs an INVITE_FRIEND_REWARD transaction). No request body required. */
export const withdrawInviteFriendsDiamonds = async () => {
  const { headers } = await buildAuthedConfig("invite-friends/withdraw");
  const response = await API.post("/api/app/invite-friends/withdraw", undefined, { headers });
  return response.data;
};

/** POST /api/app/invite-friends/redeem — redeems an invite code entered on the login screen,
 *  called automatically right after a fresh login/register issues a new JWT. */
export const redeemInviteFriendsCode = async (inviteCode) => {
  const { headers } = await buildAuthedConfig("invite-friends/redeem");
  const response = await API.post(
    "/api/app/invite-friends/redeem",
    { inviteCode },
    { headers }
  );
  console.log("[inviteFriendsApi] POST /api/app/invite-friends/redeem ->", JSON.stringify(response.data, null, 2));
  return response.data;
};
