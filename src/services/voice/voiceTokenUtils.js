const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

/** Normalize backend voice-token payload for Agora join. */
export const parseTokenPayload = (data, roomId, uid, fallbackAppId = "") => {
  const appId =
    firstText(data?.appId, data?.agoraAppId, data?.applicationId) || fallbackAppId || "";
  const resolvedUid = Number(firstValue(data?.uid, data?.userId, uid) ?? uid);

  return {
    token: firstText(data?.token, data?.rtcToken, data?.agoraToken, data?.accessToken) ?? "",
    appId,
    channel: firstText(data?.channel, data?.channelName, data?.roomId) ?? String(roomId),
    uid: resolvedUid,
  };
};

/** Pure validation — used by health checks and unit tests. */
export const validateTokenPayload = (payload, { requireToken = true } = {}) => {
  const issues = [];

  if (!payload || typeof payload !== "object") {
    return { ok: false, issues: ["Token payload is missing or invalid."] };
  }

  if (requireToken && !payload.token) {
    issues.push("Voice token missing from backend response.");
  }
  if (!payload.appId) {
    issues.push("Agora appId missing (set EXPO_PUBLIC_AGORA_APP_ID or return appId from API).");
  }
  if (!payload.channel) {
    issues.push("Agora channel name is empty.");
  }
  if (!Number.isFinite(payload.uid) || payload.uid <= 0) {
    issues.push(`Agora uid must be a positive number (got ${payload.uid}).`);
  }

  return { ok: issues.length === 0, issues };
};
