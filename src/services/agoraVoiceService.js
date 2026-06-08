import { Audio } from "expo-av";
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from "react-native-agora";
import { AGORA_APP_ID } from "../config/env";

let engine = null;
let joined = false;
let currentChannel = null;

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const parseTokenPayload = (data, roomId, uid) => {
  const appId =
    firstText(data?.appId, data?.agoraAppId, data?.applicationId) || AGORA_APP_ID || "";
  const resolvedUid = Number(firstValue(data?.uid, data?.userId, uid) ?? uid);

  return {
    token: firstText(data?.token, data?.rtcToken, data?.agoraToken, data?.accessToken) ?? "",
    appId,
    channel: firstText(data?.channel, data?.channelName, data?.roomId) ?? String(roomId),
    uid: resolvedUid,
  };
};

export const requestMicPermission = async () => {
  const { status } = await Audio.requestPermissionsAsync();
  console.log("[agoraVoice] mic permission:", status);
  return status === "granted";
};

const ensureEngine = (appId) => {
  if (engine) return engine;
  if (!appId) throw new Error("Agora appId missing from voice-token response.");

  engine = createAgoraRtcEngine();
  engine.initialize({
    appId,
    channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
  });

  engine.registerEventHandler({
    onJoinChannelSuccess: (connection, elapsed) => {
      console.log("[agoraVoice] joined channel:", connection?.channelId, "elapsed:", elapsed);
      joined = true;
      currentChannel = connection?.channelId ?? currentChannel;
    },
    onLeaveChannel: (connection, stats) => {
      console.log("[agoraVoice] left channel:", connection?.channelId, stats);
      joined = false;
      currentChannel = null;
    },
    onUserJoined: (connection, remoteUid, elapsed) => {
      console.log("[agoraVoice] remote user joined:", remoteUid, "channel:", connection?.channelId);
    },
    onUserOffline: (connection, remoteUid, reason) => {
      console.log("[agoraVoice] remote user left:", remoteUid, "reason:", reason);
    },
    onError: (err, msg) => {
      console.log("[agoraVoice] error:", err, msg);
    },
  });

  engine.enableAudio();
  return engine;
};

export const joinVoiceChannel = async ({ roomId, uid, tokenData, isSpeaker = true }) => {
  const payload = parseTokenPayload(tokenData, roomId, uid);
  console.log("[agoraVoice] joinVoiceChannel:", JSON.stringify(payload, null, 2));

  if (!payload.token) throw new Error("Voice token missing from backend response.");

  const rtc = ensureEngine(payload.appId);

  if (joined && currentChannel === payload.channel) {
    rtc.setClientRole(
      isSpeaker ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience
    );
    rtc.muteLocalAudioStream(!isSpeaker);
    console.log("[agoraVoice] switched role, speaker:", isSpeaker);
    return payload;
  }

  rtc.setClientRole(
    isSpeaker ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience
  );
  rtc.muteLocalAudioStream(!isSpeaker);

  const result = rtc.joinChannel(payload.token, payload.channel, payload.uid, {
    clientRoleType: isSpeaker
      ? ClientRoleType.ClientRoleBroadcaster
      : ClientRoleType.ClientRoleAudience,
  });

  console.log("[agoraVoice] joinChannel result:", result);
  return payload;
};

export const leaveVoiceChannel = async () => {
  if (!engine || !joined) return;
  try {
    engine.leaveChannel();
    console.log("[agoraVoice] leaveChannel called");
  } catch (err) {
    console.log("[agoraVoice] leave failed:", err?.message ?? err);
  }
  joined = false;
  currentChannel = null;
};

export const toggleLocalMute = async (muted) => {
  if (!engine) return;
  engine.muteLocalAudioStream(muted);
  console.log("[agoraVoice] local mute:", muted);
};

export const toggleRemoteMute = (muted) => {
  if (!engine) return;
  engine.muteAllRemoteAudioStreams(muted);
  console.log("[agoraVoice] remote mute:", muted);
};

export const isVoiceJoined = () => joined;

export const destroyVoiceEngine = () => {
  if (!engine) return;
  try {
    engine.release();
  } catch {
    // ignore release errors on teardown
  }
  engine = null;
  joined = false;
  currentChannel = null;
};
