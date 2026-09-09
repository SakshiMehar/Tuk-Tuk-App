import { Audio } from "expo-av";
import { PermissionsAndroid, Platform } from "react-native";
import { ChannelProfileType, ClientRoleType, createAgoraRtcEngine } from "react-native-agora";
import { AGORA_APP_ID } from "../config/env";

let engine = null;
let joined = false;
let currentChannel = null;
let localAudioEnabled = true;
let localVideoEnabled = true;
let remoteUid = 0;
let speakerphoneEnabled = true;
let statusListeners = new Set();

export const requestPermissions = async (isVideo = false) => {
  if (Platform.OS === "android") {
    const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (isVideo) {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    }
    const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
    
    let allGranted = true;
    for (const p of permissionsToRequest) {
      if (results[p] !== PermissionsAndroid.RESULTS.GRANTED) {
        allGranted = false;
      }
    }
    return allGranted;
  }
  const { status: micStatus } = await Audio.requestPermissionsAsync();
  return micStatus === "granted";
};

export const configureAudioSession = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    // ignore
  }
};

const notifyStatusListeners = () => {
  const status = { joined, localAudioEnabled, localVideoEnabled, remoteUid, speakerphoneEnabled };
  statusListeners.forEach((listener) => {
    try {
      listener(status);
    } catch {
      // ignore
    }
  });
};

export const subscribeCallStatus = (listener) => {
  statusListeners.add(listener);
  listener({ joined, localAudioEnabled, localVideoEnabled, remoteUid, speakerphoneEnabled });
  return () => statusListeners.delete(listener);
};

export const initializeCallEngine = () => {
  if (engine) return engine;
  engine = createAgoraRtcEngine();
  engine.initialize({
    appId: AGORA_APP_ID,
    channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting
  });

  engine.registerEventHandler({
    onJoinChannelSuccess: (connection) => {
      joined = true;
      currentChannel = connection.channelId;
      notifyStatusListeners();
    },
    onLeaveChannel: () => {
      joined = false;
      currentChannel = null;
      remoteUid = 0;
      notifyStatusListeners();
    },
    onUserJoined: (connection, uid) => {
      remoteUid = uid;
      notifyStatusListeners();
    },
    onUserOffline: (connection, uid) => {
      if (remoteUid === uid) remoteUid = 0;
      notifyStatusListeners();
    },
    onError: (err, msg) => {
      console.error("[AgoraCallService] Engine Error:", err, msg);
      // Alert the user so they can physically see if the token is being rejected
      if (err === 109 || err === 110 || err === -17) {
         import("react-native").then(RN => RN.Alert.alert("Agora Error", `Connection rejected (Code: ${err}). Please check if App Certificate is enabled!`));
      }
    },
  });

  engine.enableAudio();
  return engine;
};

export const startCall = async ({ channelId, uid, isVideo = true }) => {
  await configureAudioSession();
  const rtc = initializeCallEngine();

  if (isVideo) {
    rtc.enableVideo();
    rtc.enableLocalVideo(true);
    rtc.startPreview();
    localVideoEnabled = true;
  } else {
    rtc.disableVideo();
    localVideoEnabled = false;
  }
  localAudioEnabled = true;

  // Audio routing - route to speakerphone so user can hear it without holding to ear
  rtc.setDefaultAudioRouteToSpeakerphone(true);
  try {
    rtc.setEnableSpeakerphone(true);
  } catch (e) { }

  // Set the client role explicitly before joining
  rtc.setClientRole(ClientRoleType.ClientRoleBroadcaster);

  // We are assuming Testing Mode allows null token.
  // Use uid: 0 to let Agora dynamically assign a valid integer UID
  rtc.joinChannel(null, channelId, 0, {
    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    publishMicrophoneTrack: true,
    autoSubscribeAudio: true,
    publishCameraTrack: isVideo,
    autoSubscribeVideo: isVideo,
  });

  try {
    rtc.muteAllRemoteAudioStreams(false);
  } catch (e) { }
};

export const leaveCall = () => {
  if (!engine) return;
  try {
    engine.leaveChannel();
    engine.stopPreview();
  } catch (err) {
    // ignore
  }
  joined = false;
  currentChannel = null;
  remoteUid = 0;
  notifyStatusListeners();
};

export const toggleLocalAudio = () => {
  if (!engine) return;
  localAudioEnabled = !localAudioEnabled;
  engine.enableLocalAudio(localAudioEnabled);
  notifyStatusListeners();
};

export const toggleLocalVideo = () => {
  if (!engine) return;
  localVideoEnabled = !localVideoEnabled;
  engine.enableLocalVideo(localVideoEnabled);
  if (localVideoEnabled) {
    engine.startPreview();
  } else {
    engine.stopPreview();
  }
  notifyStatusListeners();
};

export const toggleSpeakerphone = (enabled) => {
  if (!engine) return;
  speakerphoneEnabled = enabled;
  try {
    engine.setEnableSpeakerphone(enabled);
  } catch(e) {}
  notifyStatusListeners();
};

export const destroyCallEngine = () => {
  if (!engine) return;
  try {
    engine.leaveChannel();
    engine.release();
  } catch (err) {
    // ignore
  }
  engine = null;
  statusListeners.clear();
};
