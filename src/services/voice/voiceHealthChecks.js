import { parseTokenPayload, unwrapVoiceTokenResponse, validateTokenPayload } from "./voiceTokenUtils";

/**
 * Run preflight checks before joining an Agora voice channel.
 * Returns { ok, checks } where each check has { name, passed, detail }.
 */
export const runVoicePreflightChecks = ({
  roomId,
  uid,
  tokenData,
  isSpeaker = false,
  fallbackAppId = "",
  micPermissionGranted = null,
} = {}) => {
  const checks = [];

  const push = (name, passed, detail) => {
    checks.push({ name, passed, detail });
  };

  push("roomId", Boolean(roomId), roomId ? `roomId=${roomId}` : "roomId is required");
  push(
    "voiceUid",
    Number.isFinite(Number(uid)) && Number(uid) > 0,
    uid != null ? `uid=${uid}` : "uid is required"
  );

  const payload = tokenData
    ? parseTokenPayload(unwrapVoiceTokenResponse(tokenData), roomId, uid, fallbackAppId)
    : null;
  const validation = validateTokenPayload(payload);
  push("tokenPayload", validation.ok, validation.ok ? "token payload valid" : validation.issues.join("; "));

  if (isSpeaker) {
    push(
      "micPermission",
      micPermissionGranted === true,
      micPermissionGranted === null
        ? "mic permission not checked yet"
        : micPermissionGranted
          ? "microphone granted"
          : "microphone permission denied"
    );
  } else {
    push("micPermission", true, "not required for listener role");
  }

  push("speakerRole", true, isSpeaker ? "broadcaster (mic on)" : "audience (listen only)");

  const ok = checks.every((c) => c.passed);
  return { ok, checks, payload };
};

/** Summarize Agora runtime diagnostics for dev / support. */
export const summarizeVoiceDiagnostics = (diagnostics = {}) => {
  const {
    joined = false,
    currentChannel = null,
    currentIsSpeaker = false,
    remoteSpeakerCount = 0,
    lastError = null,
    remoteAudioMuted = false,
  } = diagnostics;

  const lines = [
    `joined: ${joined}`,
    `channel: ${currentChannel ?? "—"}`,
    `role: ${currentIsSpeaker ? "broadcaster" : "audience"}`,
    `remoteSpeakers: ${remoteSpeakerCount}`,
    `remoteAudioMuted: ${remoteAudioMuted}`,
  ];

  if (lastError) {
    lines.push(`lastError: ${lastError.message ?? JSON.stringify(lastError)}`);
  }

  return lines.join("\n");
};
