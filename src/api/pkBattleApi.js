import API, {
  authRequestConfig,
  getBearerToken,
  refreshTokenCache,
} from "./axios";

const LOG_TAG = "[PkBattleAPI]";

const logRequest = (method, path, payload) => {
};

const logResponse = (method, path, data) => {
};

const logError = (method, path, error) => {
  // A 404 on the room's "active battle" endpoint just means there is no
  // ongoing battle right now — expected, not an error worth logging.
  const isNoActivePkBattle =
    method === "GET" &&
    /\/api\/app\/pk-battles\/room\/[^/]+\/active$/.test(path) &&
    (error?.status ?? error?.response?.status) === 404;
  if (isNoActivePkBattle) return;

  console.error(
    `${LOG_TAG} ✗ ${method} ${path}`,
    error?.response?.data ?? error?.message ?? error
  );
};

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

/** POST /api/app/pk-battles — room owner/host challenges another host.
 *  `teamAMemberIds` is optional; the caller (Host A) is auto-included. */
export const createPkBattle = async ({
  roomId,
  opponentHostId,
  durationSeconds,
  teamAMemberIds,
}) => {
  const path = "/api/app/pk-battles";
  const body = {
    roomId: String(roomId),
    opponentHostId,
    durationSeconds,
    ...(Array.isArray(teamAMemberIds) && teamAMemberIds.length
      ? { teamAMemberIds }
      : {}),
  };

  logRequest("POST", path, body);
  try {
    const { headers } = await buildAuthedConfig("pk-battles/create");
    const response = await API.post(path, body, { headers });
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** POST /api/app/pk-battles/{battleId}/respond — the challenged host
 *  accepts (optionally naming teamBMemberIds) or rejects. */
export const respondToPkBattle = async (battleId, { accepted, teamBMemberIds }) => {
  const path = `/api/app/pk-battles/${battleId}/respond`;
  const body = accepted
    ? {
        accepted: true,
        ...(Array.isArray(teamBMemberIds) && teamBMemberIds.length
          ? { teamBMemberIds }
          : {}),
      }
    : { accepted: false };

  logRequest("POST", path, body);
  try {
    const { headers } = await buildAuthedConfig("pk-battles/respond");
    const response = await API.post(path, body, { headers });
    logResponse("POST", path, response.data);
    return response.data;
  } catch (error) {
    logError("POST", path, error);
    throw error;
  }
};

/** GET /api/app/pk-battles/room/{roomId}/active — the room's live/pending
 *  PK card, or null/empty if there isn't one right now. */
export const getActivePkBattleForRoom = async (roomId) => {
  const path = `/api/app/pk-battles/room/${roomId}/active`;
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig("pk-battles/active");
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};

/** GET /api/app/pk-battles/{battleId} — one battle's current/final state. */
export const getPkBattleById = async (battleId) => {
  const path = `/api/app/pk-battles/${battleId}`;
  logRequest("GET", path);
  try {
    const { headers } = await buildAuthedConfig("pk-battles/get");
    const response = await API.get(path, { headers });
    logResponse("GET", path, response.data);
    return response.data;
  } catch (error) {
    logError("GET", path, error);
    throw error;
  }
};
