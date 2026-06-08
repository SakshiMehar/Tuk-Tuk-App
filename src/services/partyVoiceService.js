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

/**
 * Join room audio as listener (no mic publish).
 * GET voice-token?uid={uid}&isSpeaker=false
 */
export const joinAsListener = async (roomId) => {
  const uid = await getVoiceUid();
  const tokenData = await getVoiceToken(roomId, uid, false);
  await agoraVoice.joinVoiceChannel({
    roomId: String(roomId),
    uid,
    tokenData,
    isSpeaker: false,
  });
  console.log("[partyVoice] joined as listener, uid:", uid);
  return { uid, tokenData };
};

/**
 * Take mic: claim seat + speaker token + unmute.
 * GET voice-token?uid={uid}&isSpeaker=true
 * POST toggle-mute?isMuted=false
 */
export const takeMic = async (roomId, seatNumber) => {
  const token = await ensureAuthToken();
  console.log("[partyVoice] takeMic auth:", token ? `token present (${token.length} chars)` : "missing");
  await syncUserFromToken();
  const profile = await buildSeatProfile();
  console.log("[partyVoice] seat profile:", JSON.stringify(profile));
  const uid = await getVoiceUid();

  const granted = await agoraVoice.requestMicPermission();
  if (!granted) {
    throw new Error("Microphone permission denied.");
  }

  await claimSeat(roomId, seatNumber, profile);
  const tokenData = await getVoiceToken(roomId, uid, true);
  await agoraVoice.joinVoiceChannel({
    roomId: String(roomId),
    uid,
    tokenData,
    isSpeaker: true,
  });
  await toggleSeatMute(roomId, seatNumber, false);
  wsService.sendSpeakingStatus(String(roomId), true);

  console.log("[partyVoice] took mic, seat:", seatNumber, "uid:", uid);
  return { uid, seatNumber, tokenData };
};

/**
 * Leave mic: mute + leave seat + switch to listener token.
 */
export const leaveMic = async (roomId, seatNumber) => {
  await ensureAuthToken();

  await agoraVoice.toggleLocalMute(true);
  await toggleSeatMute(roomId, seatNumber, true);
  await leaveSeat(roomId, seatNumber);
  await agoraVoice.leaveVoiceChannel();
  wsService.sendSpeakingStatus(String(roomId), false);

  console.log("[partyVoice] left mic, seat:", seatNumber);
  return { uid: await getVoiceUid() };
};

/**
 * Toggle mute while on mic.
 * POST toggle-mute?isMuted=true  → muted
 * POST toggle-mute?isMuted=false → unmuted
 */
export const toggleMicMute = async (roomId, seatNumber, muted) => {
  await ensureAuthToken();
  await agoraVoice.toggleLocalMute(muted);
  await toggleSeatMute(roomId, seatNumber, muted);
  wsService.sendSpeakingStatus(String(roomId), !muted);
  console.log("[partyVoice] toggle mute:", muted);
};

export const teardownVoice = async () => {
  await agoraVoice.leaveVoiceChannel();
  agoraVoice.destroyVoiceEngine();
};
