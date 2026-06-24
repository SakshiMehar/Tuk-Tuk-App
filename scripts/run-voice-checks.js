/**
 * Lightweight voice preflight unit checks (no Jest / native Agora required).
 * Run: npm run test:voice
 */

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const parseTokenPayload = (data, roomId, uid, fallbackAppId = "") => {
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

const validateTokenPayload = (payload, { requireToken = true } = {}) => {
  const issues = [];

  if (!payload || typeof payload !== "object") {
    return { ok: false, issues: ["Token payload is missing or invalid."] };
  }

  if (requireToken && !payload.token) issues.push("Voice token missing from backend response.");
  if (!payload.appId) issues.push("Agora appId missing.");
  if (!payload.channel) issues.push("Agora channel name is empty.");
  if (!Number.isFinite(payload.uid) || payload.uid <= 0) {
    issues.push(`Agora uid must be a positive number (got ${payload.uid}).`);
  }

  return { ok: issues.length === 0, issues };
};

const runVoicePreflightChecks = ({
  roomId,
  uid,
  tokenData,
  isSpeaker = false,
  fallbackAppId = "",
  micPermissionGranted = null,
} = {}) => {
  const checks = [];
  const push = (name, passed, detail) => checks.push({ name, passed, detail });

  push("roomId", Boolean(roomId), roomId ? `roomId=${roomId}` : "roomId is required");
  push(
    "voiceUid",
    Number.isFinite(Number(uid)) && Number(uid) > 0,
    uid != null ? `uid=${uid}` : "uid is required"
  );

  const payload = tokenData ? parseTokenPayload(tokenData, roomId, uid, fallbackAppId) : null;
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

  return { ok: checks.every((c) => c.passed), checks, payload };
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tests = [
  [
    "parseTokenPayload",
    () => {
      const payload = parseTokenPayload(
        { rtcToken: "tok_abc", agoraAppId: "app123", channelName: "room-99", userId: 42 },
        "fallback-room",
        7,
        "env-app"
      );
      assert(payload.token === "tok_abc", "token");
      assert(payload.appId === "app123", "appId");
      assert(payload.channel === "room-99", "channel");
      assert(payload.uid === 42, "uid");
    },
  ],
  [
    "parseTokenPayloadFallbacks",
    () => {
      const payload = parseTokenPayload({}, "room-5", 10001, "env-fallback");
      assert(payload.token === "", "empty token");
      assert(payload.appId === "env-fallback", "fallback appId");
      assert(payload.channel === "room-5", "channel fallback");
      assert(payload.uid === 10001, "uid fallback");
    },
  ],
  [
    "validateTokenPayloadOk",
    () => {
      const result = validateTokenPayload({ token: "t", appId: "a", channel: "c", uid: 1 });
      assert(result.ok === true, "should pass");
    },
  ],
  [
    "validateTokenPayloadMissingFields",
    () => {
      const result = validateTokenPayload({ token: "", appId: "", channel: "", uid: 0 });
      assert(result.ok === false, "should fail");
      assert(result.issues.length >= 3, "multiple issues");
    },
  ],
  [
    "preflightListenerOk",
    () => {
      const result = runVoicePreflightChecks({
        roomId: "r1",
        uid: 12345,
        tokenData: { token: "t", appId: "a", channel: "r1" },
        isSpeaker: false,
        fallbackAppId: "a",
      });
      assert(result.ok === true, "listener preflight should pass");
    },
  ],
  [
    "preflightSpeakerNeedsMic",
    () => {
      const result = runVoicePreflightChecks({
        roomId: "r1",
        uid: 12345,
        tokenData: { token: "t", appId: "a", channel: "r1" },
        isSpeaker: true,
        micPermissionGranted: false,
        fallbackAppId: "a",
      });
      assert(result.ok === false, "speaker without mic should fail");
      const micCheck = result.checks.find((c) => c.name === "micPermission");
      assert(micCheck.passed === false, "mic check failed");
    },
  ],
];

let passed = 0;
for (const [name, fn] of tests) {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
}

console.log(`\n${passed}/${tests.length} voice checks passed.`);
