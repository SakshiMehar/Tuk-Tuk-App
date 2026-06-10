import {
  claimSeat,
  leaveSeat,
  toggleSeatMute,
  getVoiceToken,
} from "../api/partyApi";
import { refreshTokenCache } from "../api/axios";
import { getToken } from "../store/authStore";
import * as agoraVoice from "./agoraVoiceService";
import { getVoiceUid } from "../utils/voiceUid";
import { buildSeatProfile, syncUserFromToken } from "../utils/sessionUser";
import { wsService } from "./websocket";

const ensureAuthToken = async () => {
  await refreshTokenCache();
  const token = await getToken();
  if (!token) {
    throw new Error("Auth token is required. Please log in again.");
  }
  return token;
};

export const joinAsListener = async (roomId) => {
  const uid = await getVoiceUid();
  const tokenData = await getVoiceToken(roomId, uid, false);
  await agoraVoice.joinVoiceChannel({
    roomId: String(roomId),
    uid,
    tokenData,
    isSpeaker: false,
  });
  return { uid, tokenData };
};

export const reserveSeat = async (roomId, seatNumber) => {
  await ensureAuthToken();
  await syncUserFromToken();
  const profile = await buildSeatProfile();
  await claimSeat(roomId, seatNumber, profile);
  return { seatNumber, profile };
};

export const activateMicOnSeat = async (roomId, seatNumber) => {
  await ensureAuthToken();
  const uid = await getVoiceUid();

  const granted = await agoraVoice.requestMicPermission();
  if (!granted) {
    throw new Error("Microphone permission denied.");
  }

  const tokenData = await getVoiceToken(roomId, uid, true);
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
  await reserveSeat(roomId, seatNumber);
  return activateMicOnSeat(roomId, seatNumber);
};

export const leaveMic = async (roomId, seatNumber) => {
  await ensureAuthToken();

  await agoraVoice.toggleLocalMute(true);
  await toggleSeatMute(roomId, seatNumber, true);
  await leaveSeat(roomId, seatNumber);
  await agoraVoice.leaveVoiceChannel();
  wsService.sendSpeakingStatus(String(roomId), false);

  return { uid: await getVoiceUid() };
};

export const toggleMicMute = async (roomId, seatNumber, muted) => {
  await ensureAuthToken();
  await agoraVoice.toggleLocalMute(muted);
  await toggleSeatMute(roomId, seatNumber, muted);
  wsService.sendSpeakingStatus(String(roomId), !muted);
};

export const teardownVoice = async () => {
  await agoraVoice.leaveVoiceChannel();
  agoraVoice.destroyVoiceEngine();
};
