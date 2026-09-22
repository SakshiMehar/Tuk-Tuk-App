import { refreshTokenCache } from "../api/axios";
import {
    claimSeat,
    getVoiceToken,
    joinRoom,
    leaveSeat,
    toggleSeatMute,
} from "../api/partyApi";
import { AGORA_APP_ID } from "../config/env";
import { getToken } from "../store/authStore";
import { buildSeatProfile, syncUserFromToken } from "../utils/sessionUser";
import { getVoiceUid } from "../utils/voiceUid";
import * as agoraVoice from "./agoraVoiceService";
import { runVoicePreflightChecks } from "./voice/voiceHealthChecks";
import { unwrapVoiceTokenResponse } from "./voice/voiceTokenUtils";
import { wsService } from "./websocket";

let activeRoomId = null;
let activeIsSpeaker = false;

const ensureAuthToken = async () => {
  await refreshTokenCache();
  const token = await getToken();
  if (!token) {
    throw new Error("Auth token is required. Please log in again.");
  }
  return token;
};

const fetchVoiceToken = async (roomId, uid, isSpeaker) => {
  await ensureAuthToken();
  const data = await getVoiceToken(roomId, uid, isSpeaker);
  return unwrapVoiceTokenResponse(data);
};

const extractRtcToken = (tokenData) => {
  const token =
    tokenData?.token ?? tokenData?.rtcToken ?? tokenData?.agoraToken ?? tokenData?.accessToken;
  if (!token) {
    throw new Error("Voice token missing from backend response.");
  }
  return token;
};

const runPreflightOrThrow = async ({ roomId, uid, tokenData, isSpeaker, micGranted }) => {
  const preflight = runVoicePreflightChecks({
    roomId,
    uid,
    tokenData,
    isSpeaker,
    micPermissionGranted: micGranted,
    fallbackAppId: AGORA_APP_ID,
  });

  if (!preflight.ok) {
    const failed = preflight.checks.filter((c) => !c.passed);
    throw new Error(failed.map((c) => `${c.name}: ${c.detail}`).join(" "));
  }

  return preflight;
};

const registerTokenRenewal = (roomId) => {
  activeRoomId = String(roomId);
  agoraVoice.setTokenRenewalHandler(async ({ isSpeaker }) => {
    const uid = await getVoiceUid();
    const tokenData = await fetchVoiceToken(activeRoomId, uid, isSpeaker ?? activeIsSpeaker);
    activeIsSpeaker = isSpeaker ?? activeIsSpeaker;
    return extractRtcToken(tokenData);
  });
};

export const joinAsListener = async (roomId) => {
  const uid = await getVoiceUid();
  const tokenData = await fetchVoiceToken(roomId, uid, false);

  await runPreflightOrThrow({
    roomId,
    uid,
    tokenData,
    isSpeaker: false,
    micGranted: true,
  });

  registerTokenRenewal(roomId);
  activeIsSpeaker = false;

  await agoraVoice.joinVoiceChannel({
    roomId: String(roomId),
    uid,
    tokenData,
    isSpeaker: false,
  });

  return { uid, tokenData };
};

const isRoomNotJoinedError = (err) => {
  const body = err?.responseData ?? err?.response?.data ?? {};
  const tokens = [
    err?.code,
    err?.message,
    body?.code,
    body?.error,
    body?.errorCode,
    body?.status,
    body?.message,
    body?.error?.code,
    body?.error?.message,
  ]
    .filter((value) => value != null && value !== "")
    .map((value) => String(value).toUpperCase());
  return tokens.some((token) => token.includes("ROOM_NOT_JOINED"));
};

export const reserveSeat = async (roomId, seatNumber) => {
  await ensureAuthToken();
  await syncUserFromToken();
  const profile = await buildSeatProfile();
  let claimData;
  try {
    claimData = await claimSeat(roomId, seatNumber, profile);
  } catch (err) {
    if (!isRoomNotJoinedError(err)) throw err;
    await joinRoom(roomId);
    claimData = await claimSeat(roomId, seatNumber, profile);
  }
  return { seatNumber, profile, claimData };
};

export const activateMicOnSeat = async (roomId, seatNumber) => {
  await ensureAuthToken();
  const uid = await getVoiceUid();

  const micGranted = await agoraVoice.requestMicPermission();
  if (!micGranted) {
    throw new Error("Microphone permission denied.");
  }

  const tokenData = await fetchVoiceToken(roomId, uid, true);

  await runPreflightOrThrow({
    roomId,
    uid,
    tokenData,
    isSpeaker: true,
    micGranted,
  });

  registerTokenRenewal(roomId);
  activeIsSpeaker = true;

  await agoraVoice.joinVoiceChannel({
    roomId: String(roomId),
    uid,
    tokenData,
    isSpeaker: true,
  });
  await toggleSeatMute(roomId, seatNumber, false);
  wsService.sendSpeakingStatus(String(roomId), true);

  return { uid, seatNumber, tokenData };
};

export const takeMic = async (roomId, seatNumber) => {
  const reserved = await reserveSeat(roomId, seatNumber);
  const voice = await activateMicOnSeat(roomId, seatNumber);
  return { ...reserved, ...voice };
};

export const leaveMic = async (roomId, seatNumber) => {
  await ensureAuthToken();

  await agoraVoice.toggleLocalMute(true);
  await toggleSeatMute(roomId, seatNumber, true);
  await leaveSeat(roomId, seatNumber);
  wsService.sendSpeakingStatus(String(roomId), false);

  const uid = await getVoiceUid();
  const tokenData = await fetchVoiceToken(roomId, uid, false);
  activeIsSpeaker = false;

  await agoraVoice.joinVoiceChannel({
    roomId: String(roomId),
    uid,
    tokenData,
    isSpeaker: false,
  });

  return { uid };
};

export const toggleMicMute = async (roomId, seatNumber, muted) => {
  await ensureAuthToken();
  await agoraVoice.toggleLocalMute(muted);
  await toggleSeatMute(roomId, seatNumber, muted);
  wsService.sendSpeakingStatus(String(roomId), !muted);
};

export const getVoiceSessionStatus = () => agoraVoice.getVoiceDiagnostics();

export const subscribeVoiceSessionStatus = (listener) =>
  agoraVoice.subscribeVoiceStatus(listener);

export const reconnectAsListener = async (roomId) => {
  await agoraVoice.leaveVoiceChannel();
  return joinAsListener(roomId);
};

export const getActiveRoomId = () => activeRoomId;

export const teardownVoice = async () => {
  activeRoomId = null;
  activeIsSpeaker = false;
  agoraVoice.setTokenRenewalHandler(null);
  await agoraVoice.leaveVoiceChannel();
  agoraVoice.destroyVoiceEngine();
};
