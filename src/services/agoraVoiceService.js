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
    onJoinChannelSuccess: (connection) => {
      joined = true;
      currentChannel = connection?.channelId ?? currentChannel;
    },
    onLeaveChannel: () => {
      joined = false;
      currentChannel = null;
    },
    onError: () => {},
  });

  engine.enableAudio();
  return engine;
};

export const joinVoiceChannel = async ({ roomId, uid, tokenData, isSpeaker = true }) => {
  const payload = parseTokenPayload(tokenData, roomId, uid);

  if (!payload.token) throw new Error("Voice token missing from backend response.");

  const rtc = ensureEngine(payload.appId);

  if (joined && currentChannel === payload.channel) {
    rtc.setClientRole(
      isSpeaker ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience
    );
    rtc.muteLocalAudioStream(!isSpeaker);
    return payload;
  }

  rtc.setClientRole(
    isSpeaker ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience
  );
  rtc.muteLocalAudioStream(!isSpeaker);

  rtc.joinChannel(payload.token, payload.channel, payload.uid, {
    clientRoleType: isSpeaker
      ? ClientRoleType.ClientRoleBroadcaster
      : ClientRoleType.ClientRoleAudience,
  });

  return payload;
};

export const leaveVoiceChannel = async () => {
  if (!engine || !joined) return;
  try {
    engine.leaveChannel();
  } catch {
    // ignore leave errors on teardown
  }
  joined = false;
  currentChannel = null;
};

export const toggleLocalMute = async (muted) => {
  if (!engine) return;
  engine.muteLocalAudioStream(muted);
};

export const toggleRemoteMute = (muted) => {
  if (!engine) return;
  engine.muteAllRemoteAudioStreams(muted);
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
