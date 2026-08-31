import { Audio } from "expo-av";
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  ConnectionStateType,
} from "react-native-agora";
import { AGORA_APP_ID } from "../config/env";
import { parseTokenPayload, unwrapVoiceTokenResponse, validateTokenPayload } from "./voice/voiceTokenUtils";

const AGORA_ERR_JOIN_REJECTED = -17;

let engine = null;
let joined = false;
let joining = false;
let currentChannel = null;
let currentIsSpeaker = false;
let remoteAudioMuted = false;
let remoteSpeakerUids = new Set();
let lastError = null;
let joinWaiters = [];
let leaveWaiters = [];
let tokenRenewalHandler = null;
let statusListeners = new Set();
let speakingListeners = new Set();   // { uid: number, isSpeaking: boolean }
let connectionState = ConnectionStateType.ConnectionStateDisconnected;

// Volume threshold — Agora reports 0–255; anything above this is "speaking"
const SPEAKING_VOLUME_THRESHOLD = 20;

const JOIN_TIMEOUT_MS = 15000;
const LEAVE_TIMEOUT_MS = 5000;

const notifyStatusListeners = () => {
  const snapshot = getVoiceDiagnostics();
  statusListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // ignore listener errors
    }
  });
};

const notifySpeakingListeners = (uid, isSpeaking) => {
  speakingListeners.forEach((listener) => {
    try {
      listener({ uid, isSpeaking });
    } catch {
      // ignore
    }
  });
};

const settleJoinWaiters = (err = null) => {
  const waiters = joinWaiters;
  joinWaiters = [];
  waiters.forEach(({ resolve, reject, timer }) => {
    clearTimeout(timer);
    if (err) reject(err);
    else resolve();
  });
};

const settleLeaveWaiters = () => {
  const waiters = leaveWaiters;
  leaveWaiters = [];
  waiters.forEach(({ resolve, timer }) => {
    clearTimeout(timer);
    resolve();
  });
};

const waitForJoin = () =>
  new Promise((resolve, reject) => {
    if (joined) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      joinWaiters = joinWaiters.filter((w) => w.resolve !== resolve);
      reject(new Error("Timed out waiting to join voice channel."));
    }, JOIN_TIMEOUT_MS);
    joinWaiters.push({ resolve, reject, timer });
  });

const waitForLeave = () =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      leaveWaiters = leaveWaiters.filter((w) => w.resolve !== resolve);
      resolve();
    }, LEAVE_TIMEOUT_MS);
    leaveWaiters.push({ resolve, timer });
  });

const readConnectionState = (rtc) => {
  try {
    return rtc.getConnectionState();
  } catch {
    return ConnectionStateType.ConnectionStateDisconnected;
  }
};

const isRtcInChannel = (rtc) => {
  if (joined) return true;
  const state = readConnectionState(rtc);
  return (
    state === ConnectionStateType.ConnectionStateConnected ||
    state === ConnectionStateType.ConnectionStateConnecting ||
    state === ConnectionStateType.ConnectionStateReconnecting
  );
};

const channelMediaOptions = (isSpeaker) => ({
  clientRoleType: isSpeaker
    ? ClientRoleType.ClientRoleBroadcaster
    : ClientRoleType.ClientRoleAudience,
  publishMicrophoneTrack: isSpeaker,
  autoSubscribeAudio: true,
});

export const requestMicPermission = async () => {
  const { status } = await Audio.requestPermissionsAsync();
  return status === "granted";
};

const configureAudioSession = async (isSpeaker) => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: isSpeaker,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    // Non-fatal — Agora may still work with default audio routing.
  }
};

const applyClientRole = (rtc, isSpeaker, token) => {
  if (token) {
    rtc.renewToken(token);
  }

  rtc.setClientRole(
    isSpeaker ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience
  );

  try {
    rtc.updateChannelMediaOptions(channelMediaOptions(isSpeaker));
  } catch {
    // updateChannelMediaOptions can fail if not fully joined yet — join options cover that path.
  }

  rtc.enableLocalAudio(isSpeaker);
  rtc.muteLocalAudioStream(!isSpeaker);
  currentIsSpeaker = isSpeaker;
  notifyStatusListeners();
};

const syncJoinedFromRtc = (rtc, channelId) => {
  const state = readConnectionState(rtc);
  if (
    state === ConnectionStateType.ConnectionStateConnected ||
    state === ConnectionStateType.ConnectionStateReconnecting
  ) {
    joined = true;
    currentChannel = channelId ?? currentChannel;
    joining = false;
    return true;
  }
  return false;
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
      joining = false;
      currentChannel = connection?.channelId ?? currentChannel;
      settleJoinWaiters();
      notifyStatusListeners();
    },
    onLeaveChannel: () => {
      joined = false;
      joining = false;
      currentChannel = null;
      currentIsSpeaker = false;
      remoteSpeakerUids = new Set();
      connectionState = ConnectionStateType.ConnectionStateDisconnected;
      settleLeaveWaiters();
      notifyStatusListeners();
    },
    onConnectionStateChanged: (_connection, state) => {
      connectionState = state;
      if (state === ConnectionStateType.ConnectionStateConnected) {
        joined = true;
        joining = false;
        settleJoinWaiters();
      }
      if (state === ConnectionStateType.ConnectionStateDisconnected) {
        joined = false;
        joining = false;
      }
      notifyStatusListeners();
    },
    onError: (err, msg) => {
      if (err === AGORA_ERR_JOIN_REJECTED) {
        if (engine && syncJoinedFromRtc(engine, currentChannel)) {
          joining = false;
          settleJoinWaiters();
          notifyStatusListeners();
        }
        return;
      }
      lastError = {
        code: err,
        message: typeof msg === "string" ? msg : `Agora error ${err}`,
        at: Date.now(),
      };
      joining = false;
      settleJoinWaiters(new Error(lastError.message));
      notifyStatusListeners();
    },
    onUserJoined: (_connection, remoteUid) => {
      if (remoteUid != null) remoteSpeakerUids.add(Number(remoteUid));
      notifyStatusListeners();
    },
    onUserOffline: (_connection, remoteUid) => {
      if (remoteUid != null) remoteSpeakerUids.delete(Number(remoteUid));
      notifyStatusListeners();
    },
    onRemoteAudioStateChanged: (_connection, remoteUid, state) => {
      if (remoteUid == null) return;
      const uid = Number(remoteUid);
      if (state === 0 || state === 4) {
        remoteSpeakerUids.delete(uid);
      } else {
        remoteSpeakerUids.add(uid);
      }
      notifyStatusListeners();
    },
    onTokenPrivilegeWillExpire: async () => {
      if (!tokenRenewalHandler || !engine) return;
      try {
        const newToken = await tokenRenewalHandler({
          channel: currentChannel,
          isSpeaker: currentIsSpeaker,
        });
        if (newToken) engine.renewToken(newToken);
      } catch (err) {
        lastError = {
          code: "TOKEN_RENEWAL",
          message: err?.message ?? "Failed to renew voice token.",
          at: Date.now(),
        };
        notifyStatusListeners();
      }
    },
    onAudioVolumeIndication: (_connection, speakers, _speakerNumber, _totalVolume) => {
      if (!Array.isArray(speakers)) return;
      speakers.forEach((speaker) => {
        const uid = Number(speaker?.uid ?? speaker?.userId ?? 0);
        const volume = Number(speaker?.volume ?? 0);
        const isSpeaking = volume > SPEAKING_VOLUME_THRESHOLD;
        notifySpeakingListeners(uid, isSpeaking);
      });
    },
  });

  engine.enableAudio();
  engine.setDefaultAudioRouteToSpeakerphone(true);
  // Enable real-time audio volume reporting every 200ms — drives the speaking ring
  engine.enableAudioVolumeIndication(200, 3, true);
  return engine;
};

export const setTokenRenewalHandler = (handler) => {
  tokenRenewalHandler = typeof handler === "function" ? handler : null;
};

export const subscribeVoiceStatus = (listener) => {
  if (typeof listener !== "function") return () => {};
  statusListeners.add(listener);
  listener(getVoiceDiagnostics());
  return () => statusListeners.delete(listener);
};

/**
 * Subscribe to real-time speaking events from Agora audio volume indication.
 * callback({ uid: number, isSpeaking: boolean })
 * uid = 0 means the local user (self).
 * Returns an unsubscribe function.
 */
export const subscribeSpeaking = (callback) => {
  if (typeof callback !== "function") return () => {};
  speakingListeners.add(callback);
  return () => speakingListeners.delete(callback);
};

export const getVoiceDiagnostics = () => ({
  joined,
  joining,
  connectionState,
  currentChannel,
  currentIsSpeaker,
  remoteSpeakerCount: remoteSpeakerUids.size,
  remoteAudioMuted,
  lastError,
  hasEngine: Boolean(engine),
});

const switchRoleInChannel = (rtc, payload, isSpeaker) => {
  if (!syncJoinedFromRtc(rtc, payload.channel)) {
    return null;
  }
  applyClientRole(rtc, isSpeaker, payload.token);
  ensureRemoteAudioPlayback(rtc);
  return payload;
};

const ensureRemoteAudioPlayback = (rtc) => {
  try {
    rtc.setEnableSpeakerphone(true);
    rtc.setDefaultAudioRouteToSpeakerphone(true);
    remoteAudioMuted = false;
    rtc.muteAllRemoteAudioStreams(false);
  } catch {
    // ignore routing errors on some devices
  }
  notifyStatusListeners();
};

const handleJoinRejected = (rtc, payload, isSpeaker) => {
  if (syncJoinedFromRtc(rtc, payload.channel)) {
    return switchRoleInChannel(rtc, payload, isSpeaker);
  }
  joining = false;
  return null;
};

export const joinVoiceChannel = async ({ roomId, uid, tokenData, isSpeaker = true }) => {
  const rawToken = unwrapVoiceTokenResponse(tokenData);
  const payload = parseTokenPayload(rawToken, roomId, uid, AGORA_APP_ID);
  const validation = validateTokenPayload(payload);
  if (!validation.ok) {
    throw new Error(validation.issues[0]);
  }

  await configureAudioSession(isSpeaker);

  const rtc = ensureEngine(payload.appId);

  if (joining) {
    try {
      await waitForJoin();
    } catch {
      if (!syncJoinedFromRtc(rtc, payload.channel)) {
        joining = false;
      }
    }
  }

  const alreadyInTargetChannel =
    readConnectionState(rtc) === ConnectionStateType.ConnectionStateConnected &&
    currentChannel === payload.channel;

  if (alreadyInTargetChannel) {
    const switched = switchRoleInChannel(rtc, payload, isSpeaker);
    if (switched) return switched;
  }

  if (isRtcInChannel(rtc) && currentChannel && currentChannel !== payload.channel) {
    await leaveVoiceChannel();
    await waitForLeave();
  }

  joining = true;
  currentChannel = payload.channel;

  const result = rtc.joinChannel(
    payload.token,
    payload.channel,
    payload.uid,
    channelMediaOptions(isSpeaker)
  );

  if (typeof result === "number" && result < 0) {
    if (result === AGORA_ERR_JOIN_REJECTED) {
      const switched = handleJoinRejected(rtc, payload, isSpeaker);
      if (switched) return switched;
      try {
        rtc.leaveChannel();
      } catch {
        // ignore
      }
      joined = false;
      currentChannel = null;
      joining = true;
      const retry = rtc.joinChannel(
        payload.token,
        payload.channel,
        payload.uid,
        channelMediaOptions(isSpeaker)
      );
      if (typeof retry === "number" && retry < 0 && retry !== AGORA_ERR_JOIN_REJECTED) {
        joining = false;
        throw new Error(`Agora joinChannel failed (code ${retry}).`);
      }
    } else {
      joining = false;
      currentChannel = joined ? currentChannel : null;
      throw new Error(`Agora joinChannel failed (code ${result}).`);
    }
  }

  try {
    await waitForJoin();
  } catch (err) {
    if (syncJoinedFromRtc(rtc, payload.channel)) {
      applyClientRole(rtc, isSpeaker, payload.token);
    } else {
      joining = false;
      if (!joined) currentChannel = null;
      throw err;
    }
  }

  joining = false;
  applyClientRole(rtc, isSpeaker, null);
  ensureRemoteAudioPlayback(rtc);

  if (remoteAudioMuted) {
    rtc.muteAllRemoteAudioStreams(true);
  }

  return payload;
};

export const leaveVoiceChannel = async () => {
  if (!engine) return;

  const inChannel = isRtcInChannel(engine);
  if (!inChannel && !joined && !joining) return;

  joining = false;
  try {
    engine.leaveChannel();
  } catch {
    // ignore leave errors on teardown
  }

  if (!leaveWaiters.length) {
    joined = false;
    currentChannel = null;
    currentIsSpeaker = false;
    remoteSpeakerUids = new Set();
    notifyStatusListeners();
  }
};

export const toggleLocalMute = async (muted) => {
  if (!engine) return;
  engine.muteLocalAudioStream(muted);
};

export const toggleRemoteMute = (muted) => {
  if (!engine) return;
  remoteAudioMuted = Boolean(muted);
  engine.muteAllRemoteAudioStreams(remoteAudioMuted);
  notifyStatusListeners();
};

export const isVoiceJoined = () => joined;

export const destroyVoiceEngine = () => {
  if (!engine) return;
  try {
    engine.leaveChannel();
  } catch {
    // ignore
  }
  try {
    engine.release();
  } catch {
    // ignore release errors on teardown
  }
  engine = null;
  joined = false;
  joining = false;
  currentChannel = null;
  currentIsSpeaker = false;
  remoteSpeakerUids = new Set();
  remoteAudioMuted = false;
  connectionState = ConnectionStateType.ConnectionStateDisconnected;
  tokenRenewalHandler = null;
  speakingListeners.clear();
  settleJoinWaiters(new Error("Voice engine destroyed."));
  settleLeaveWaiters();
  notifyStatusListeners();
};
