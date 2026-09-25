import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Gift,
  HelpCircle,
  ImageIcon,
  Mic,
  MicOff,
  MoreHorizontal,
  Pause,
  Phone,
  Shield,
  Sparkles,
  PhoneCall,
  PhoneOff,
  Play,
  Send,
  UserPlus,
  Volume2,
  VolumeX,
  X
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getUserUiAssets } from "../src/api/uiAssetsApi";
import { uploadChatMedia } from "../src/api/chatApi";
import Colors from "../src/constants/colors";
import { getAvatarSource, isBundledAvatarId } from "../src/data/avatarOptions";
import { useKeyboardInset } from "../src/hooks/useKeyboardInset";
import { destroyCallEngine, leaveCall, requestPermissions, startCall, subscribeCallStatus, toggleLocalAudio, toggleSpeakerphone } from "../src/services/agoraCallService";
import { formatChatTime, loadChatHistory, markChatAsRead } from "../src/services/chatService";
import { wsService } from "../src/services/websocket";
import { openUserProfile } from "../src/utils/profileNavigation";
import { fetchUserDecorations } from "../src/services/decorationsService";
import { getAppUserId } from "../src/utils/sessionUser";
import { parseRoomInviteMessage } from "../src/utils/deepLinkUtils";
import { getActiveRoomId } from "../src/services/partyVoiceService";
import { extractVipProfileFrameUrl } from "../src/utils/vipProfileFrame";
const NEW_START_BADGE = { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Batches/newstart-batch.png" };

const { width: W } = Dimensions.get("window");
const LIMITED_EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "🤗", "😭", "😡", "👍", "🙏", "🎉", "❤️"];

// Backend may send a bundled preset id (e.g. "avatar3") instead of a real
// image URL — resolve those to the local asset, otherwise treat as a URI.
const resolveAvatarSource = (avatar) => {
  if (isBundledAvatarId(avatar)) return getAvatarSource(avatar);
  return /ngrok-free\.dev|ngrok\.io/i.test(avatar)
    ? { uri: avatar, headers: { "ngrok-skip-browser-warning": "true" } }
    : { uri: avatar };
};

const resolveImageUriSource = (uri) => {
  if (!uri) return null;
  return /ngrok-free\.dev|ngrok\.io/i.test(uri)
    ? { uri, headers: { "ngrok-skip-browser-warning": "true" } }
    : { uri };
};

const AudioPlayer = ({ uri, durationMs, fromMe }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [actualDuration, setActualDuration] = useState(durationMs || 0);

  useEffect(() => {
    setActualDuration(durationMs || 0);
  }, [durationMs]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadSound = async () => {
    try {
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );
      if (status.isLoaded && status.durationMillis) {
        setActualDuration(status.durationMillis);
      }
      setSound(newSound);
      return newSound;
    } catch (error) {
      Alert.alert("Error", "Could not load audio.");
      return null;
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);
      if (status.durationMillis && actualDuration === 0) {
        setActualDuration(status.durationMillis);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        sound?.setPositionAsync(0);
      }
    }
  };

  const togglePlayPause = async () => {
    try {
      let currentSound = sound;
      if (!currentSound) {
        currentSound = await loadSound();
        if (!currentSound) return;
      }

      if (isPlaying) {
        await currentSound.pauseAsync();
      } else {
        const status = await currentSound.getStatusAsync();
        if (status.isLoaded && (status.positionMillis >= status.durationMillis - 100 || status.didJustFinish)) {
          await currentSound.setPositionAsync(0);
        }
        await currentSound.playAsync();
      }
    } catch (error) {
      console.log("Audio playback error:", error);
    }
  };

  const formatDuration = (millis) => {
    const totalSeconds = Math.floor((millis || 0) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const progressPercent = actualDuration > 0 ? (position / actualDuration) * 100 : 0;
  const waveBars = [30, 60, 40, 80, 50, 100, 70, 40, 80, 50, 30, 90, 60, 40, 70, 40, 80, 50, 30, 60];

  return (
    <View style={{ flexDirection: "row", alignItems: "center", width: W * 0.6, gap: 12 }}>
      <TouchableOpacity onPress={togglePlayPause} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: fromMe ? Colors.whiteAlpha20 : Colors.primaryAlpha15, alignItems: "center", justifyContent: "center" }}>
        {isPlaying ? (
          <Pause size={20} color={fromMe ? "white" : Colors.secondary} />
        ) : (
          <Play size={20} color={fromMe ? "white" : Colors.secondary} style={{ marginLeft: 3 }} />
        )}
      </TouchableOpacity>
      <View style={{ flex: 1, gap: 6 }}>
        {/* Fake Waveform */}
        <View style={{ height: 24, flexDirection: "row", alignItems: "center", gap: 3 }}>
          {waveBars.map((h, i) => (
            <View key={`bg-${i}`} style={{ width: 3, height: `${h}%`, backgroundColor: fromMe ? Colors.whiteAlpha30 : Colors.borderPrimaryAlpha, borderRadius: 2 }} />
          ))}
          {/* Active Played Waveform Overlay */}
          <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progressPercent}%`, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 3 }}>
            {waveBars.map((h, i) => (
              <View key={`fg-${i}`} style={{ width: 3, height: `${h}%`, backgroundColor: fromMe ? "white" : Colors.primary, borderRadius: 2 }} />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: fromMe ? Colors.whiteAlpha80 : Colors.grayPlaceholder, fontSize: 11, fontWeight: "500" }}>
            {formatDuration(position)} / {formatDuration(actualDuration)}
          </Text>
          <Mic size={12} color={fromMe ? Colors.whiteAlpha80 : Colors.grayPlaceholder} />
        </View>
      </View>
    </View>
  );
};

export default function ChatBox({ user = {}, onBack }) {
  const {
    userId = null,
    name = "User",
    avatar = null,
    lastMsg = "",
  } = user;
  const router = useRouter();
  const handleAvatarPress = () => {
    if (!userId) return;
    openUserProfile(router, { userId, name, avatar });
  };

  const [showBanner, setShowBanner] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const [showEmojiBox, setShowEmojiBox] = useState(false);
  const [otherUserHasNewFrame, setOtherUserHasNewFrame] = useState(false);
  const [otherUserVipFrame, setOtherUserVipFrame] = useState(null);
  // Header identity badge row (decoration) — fetched once when the other
  // user's id becomes known, same one-shot pattern as UserProfileView's
  // refresh(). VIP logo is derived from otherUserVipFrame above (already
  // fetched via getUserUiAssets) instead of a second fetch.
  const [otherUserDecorationBadge, setOtherUserDecorationBadge] = useState(null);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const { composerBottom, keyboardHeight, isKeyboardVisible, safeBottom, idleBottom } = useKeyboardInset();
  const scrollRef = useRef(null);
  const [composerHeight, setComposerHeight] = useState(136);

  const handleJoinRoomInvite = (inviteInfo) => {
    if (!inviteInfo?.roomId || isJoiningRoom) return;
    const targetRoomId = String(inviteInfo.roomId);
    const activeRoomId = getActiveRoomId?.();

    if (activeRoomId && String(activeRoomId) === targetRoomId) {
      Alert.alert(
        "Already in Room",
        `You are already in "${inviteInfo.roomTitle || "this room"}".`,
        [
          {
            text: "Open Room",
            onPress: () => {
              router.push({
                pathname: "/voice-party",
                params: { roomId: targetRoomId },
              });
            },
          },
          { text: "OK", style: "cancel" },
        ],
      );
      return;
    }

    if (activeRoomId && String(activeRoomId) !== targetRoomId) {
      Alert.alert(
        "Switch Room?",
        "You are currently in another voice room. Do you want to leave it and join this party room?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Join Room",
            onPress: () => {
              setIsJoiningRoom(true);
              router.push({
                pathname: "/voice-party",
                params: { roomId: targetRoomId },
              });
              setTimeout(() => setIsJoiningRoom(false), 1500);
            },
          },
        ],
      );
      return;
    }

    setIsJoiningRoom(true);
    router.push({
      pathname: "/voice-party",
      params: { roomId: targetRoomId },
    });
    setTimeout(() => setIsJoiningRoom(false), 1500);
  };

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  const [callState, setCallState] = useState({
    status: "IDLE", // IDLE, INCOMING, OUTGOING, CONNECTED
    callType: null, // 'audio' | 'video'
    channelId: null,
    agoraState: { joined: false, localAudioEnabled: true, localVideoEnabled: true, remoteUid: 0 }
  });
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval = null;
    if (callState.status === "CONNECTED") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.status]);

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    const unsub = subscribeCallStatus((status) => {
      setCallState((prev) => ({ ...prev, agoraState: status }));
    });
    return () => {
      unsub();
      destroyCallEngine();
    };
  }, []);

  const initiateCall = async (type) => {
    const granted = await requestPermissions(type === 'video');
    if (!granted) return Alert.alert("Permission required", "Microphone and Camera access are needed for calling.");

    const sortedIds = [String(myUserId), String(userId)].sort();
    const channel = `call_${sortedIds[0]}_${sortedIds[1]}`;

    setCallState(prev => ({ ...prev, status: "OUTGOING", callType: type, channelId: channel }));
    wsService.sendCallSignal(String(userId), "OFFER", type, channel);
    startCall({ channelId: channel, uid: 0, isVideo: type === 'video' });
  };

  const endCallLocal = () => {
    leaveCall();
    setCallState({ status: "IDLE", callType: null, channelId: null, agoraState: { joined: false, localAudioEnabled: true, localVideoEnabled: true, remoteUid: 0 } });
  };

  const handleCallSignal = (payload) => {
    const { callSignalType, callType, callChannelId } = payload;

    if (callSignalType === "OFFER") {
      setCallState(prev => {
        if (prev.status !== "IDLE") return prev; // already busy
        return { ...prev, status: "INCOMING", callType, channelId: callChannelId };
      });
    } else if (callSignalType === "ANSWER") {
      setCallState(prev => ({ ...prev, status: "CONNECTED" }));
    } else if (callSignalType === "REJECT" || callSignalType === "END") {
      endCallLocal();
    }
  };

  const acceptCall = async () => {
    const granted = await requestPermissions(callState.callType === 'video');
    if (!granted) {
      wsService.sendCallSignal(String(userId), "REJECT", callState.callType, callState.channelId);
      endCallLocal();
      return Alert.alert("Permission required", "Microphone and Camera access are needed for calling.");
    }
    wsService.sendCallSignal(String(userId), "ANSWER", callState.callType, callState.channelId);
    setCallState(prev => ({ ...prev, status: "CONNECTED" }));
    startCall({ channelId: callState.channelId, uid: 0, isVideo: callState.callType === 'video' });
  };

  const rejectCall = () => {
    wsService.sendCallSignal(String(userId), "REJECT", callState.callType, callState.channelId);
    endCallLocal();
  };

  const endCall = () => {
    wsService.sendCallSignal(String(userId), "END", callState.callType, callState.channelId);
    endCallLocal();
  };

  const mapApiMessage = (m, currentUserId) => ({
    id: String(m.messageId ?? m.id ?? Date.now()),
    text: m.content ?? m.message ?? m.text ?? "",
    image: m.imageUrl ?? m.image ?? m.media?.find(media => (media.type === 'IMAGE' || media.mediaType === 'IMAGE'))?.url ?? m.media?.find(media => (media.type === 'IMAGE' || media.mediaType === 'IMAGE'))?.mediaUrl ?? null,
    audio: m.audioUrl ?? m.audio ?? m.media?.find(media => (media.type === 'AUDIO' || media.mediaType === 'AUDIO'))?.url ?? m.media?.find(media => (media.type === 'AUDIO' || media.mediaType === 'AUDIO'))?.mediaUrl ?? null,
    audioDuration: m.audioDuration ?? 0,
    fromMe: String(m.senderId) === String(currentUserId),
    time: m.timestamp || m.createdAt ? new Date(m.timestamp || m.createdAt) : new Date(),
  });

  // Loads the message history for this conversation from the server.
  // Extracted so both the initial mount and the "Retry" tap (shown when a
  // load fails) go through the same path — previously a failed fetch was
  // swallowed silently, leaving the chat looking empty/"vanished" with no
  // way to reload short of leaving and re-entering the screen.
  const fetchHistory = useCallback(async (currentUserId) => {
    if (!userId) return;
    setHistoryError(false);
    setHistoryLoading(true);
    try {
      const { messages: apiMessages } = await loadChatHistory(userId);
      setMessages(
        apiMessages
          .map((m) => mapApiMessage(m, currentUserId))
          .filter((m) => !m.text.startsWith("__CALL_SIGNAL__|"))
      );
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
      markChatAsRead(userId).catch(() => {});
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  // Connects WS (best-effort) and resolves the local user id before
  // handing off to fetchHistory. Both the initial mount and the "Retry"
  // button run this same sequence — getAppUserId() can throw (e.g. session
  // not hydrated yet), and previously that throw was unguarded, so it
  // silently aborted the load and left the chat stuck on its loading state
  // forever with no way to recover except leaving and re-entering.
  const loadChatSession = useCallback(async () => {
    setHistoryError(false);
    setHistoryLoading(true);

    try {
      await wsService.connect();
    } catch {
      // Non-fatal — history loads over REST regardless of WS state.
    }

    let currentUserId;
    try {
      currentUserId = await getAppUserId();
    } catch {
      setHistoryError(true);
      setHistoryLoading(false);
      return;
    }
    setMyUserId(currentUserId);

    await fetchHistory(currentUserId);
  }, [fetchHistory]);

  const handleRetryHistory = () => {
    loadChatSession();
  };

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    const initChat = async () => {
      await loadChatSession();
      if (cancelled) return;

      // Fetch new-user frame status for the badge
      try {
        const assets = await getUserUiAssets(userId);
        const hasFrame = Boolean(
          assets?.showNewUserFrame ??
          assets?.hasNewUserFrame ??
          assets?.data?.showNewUserFrame ??
          assets?.data?.hasNewUserFrame ??
          false
        );
        if (!cancelled) setOtherUserHasNewFrame(hasFrame);

        const vipFrameUrl = extractVipProfileFrameUrl(assets) ?? extractVipProfileFrameUrl(assets?.data);
        if (!cancelled) setOtherUserVipFrame(vipFrameUrl);
      } catch {
        // non-critical
      }

      // Decoration badge for the header badge row — one-shot fetch per
      // other-user id (not per render), mirroring UserProfileView's
      // fetchUserDecorations pattern.
      try {
        const decorations = await fetchUserDecorations(userId);
        if (!cancelled) {
          setOtherUserDecorationBadge(decorations?.badgeUrl ?? null);
        }
      } catch {
        // non-critical
      }
    };

    initChat();
    return () => { cancelled = true; };
  }, [userId, loadChatSession]);

  useEffect(() => {
    if (!userId || !myUserId) return undefined;

    const unsub = wsService.onMessage((payload) => {
      const senderId = payload?.senderId;
      const receiverId = payload?.receiverId;
      const peerId = String(userId);
      const isThisChat =
        String(senderId) === peerId ||
        String(receiverId) === peerId;

      if (!isThisChat) return;

      const text = payload?.content ?? payload?.message ?? "";
      const image = payload?.image ?? payload?.media?.find(m => (m.type === 'IMAGE' || m.mediaType === 'IMAGE'))?.url ?? payload?.media?.find(m => (m.type === 'IMAGE' || m.mediaType === 'IMAGE'))?.mediaUrl ?? null;
      const audio = payload?.audio ?? payload?.audioUrl ?? payload?.media?.find(m => (m.type === 'AUDIO' || m.mediaType === 'AUDIO'))?.url ?? payload?.media?.find(m => (m.type === 'AUDIO' || m.mediaType === 'AUDIO'))?.mediaUrl ?? null;
      const audioDuration = payload?.audioDuration ?? 0;
      
      console.log("[ChatBox] onMessage parsed image:", image, "audio:", audio);

      // Check if this is a call signal embedded in the message
      if (text && text.startsWith("__CALL_SIGNAL__|")) {
        const parts = text.split("|");
        const signalPayload = {
          callSignalType: parts[1],
          callType: parts[2],
          callChannelId: parts[3]
        };
        handleCallSignal(signalPayload);
        return;
      }

      if (payload?.callSignalType) {
        handleCallSignal(payload);
        return;
      }

      if (!text && !image && !audio) return;

      const id = String(payload?.messageId ?? payload?.id ?? `ws-${Date.now()}`);
      const fromMe = String(senderId) === String(myUserId);

      setMessages((prev) => {
        // Skip duplicate real IDs
        if (prev.some((m) => String(m.id) === id)) return prev;

        // If the server echoes our own message back, replace the optimistic
        // pending entry. For media messages, ignore text if image/audio match.
        const isMatch = (m) => m._pending && fromMe && (
          (image && m.image === image) || 
          (audio && m.audio === audio) || 
          (!image && !audio && m.text === text)
        );

        const filtered = prev.filter((m) => !isMatch(m));

        return [
          ...filtered,
          {
            id,
            text,
            image,
            audio,
            audioDuration,
            fromMe,
            time: payload?.timestamp ? new Date(payload.timestamp) : new Date(),
          },
        ];
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      if (String(senderId) === peerId) {
        markChatAsRead(userId).catch(() => { });
      }
    });

    return unsub;
  }, [userId, myUserId]);

  const sendMessageText = (rawText, { clearComposer = false } = {}) => {
    const text = String(rawText ?? "").trim();
    if (!text || !userId) return;

    // Optimistic update — show the message immediately so the user gets
    // instant feedback. The WS handler deduplicates server echoes later.
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, text, image: null, audio: null, fromMe: true, time: new Date(), _pending: true },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      wsService.sendMessage(String(userId), text);
    } catch (err) {
      // Roll back the optimistic entry on send failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Send failed", err?.message || "WebSocket not connected.");
      return;
    }

    if (clearComposer) setMessage("");
    setShowEmojiBox(false);
  };

  const handleGalleryPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        sendImageMessage(asset.uri);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const sendImageMessage = async (localUri) => {
    if (!userId) return;

    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, text: "", image: localUri, audio: null, fromMe: true, time: new Date(), _pending: true },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const response = await uploadChatMedia(localUri, 'image/jpeg');
      const imageUrl = response?.media?.find(m => m.type === 'IMAGE')?.url || response?.media?.[0]?.url || response?.url;
      
      if (imageUrl) {
        wsService.sendMessage(String(userId), "", response);
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, image: imageUrl, _pending: true } : m));
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Send failed", err?.message || "Could not upload image.");
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);
        setRecordingDuration(0);
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      } else {
        Alert.alert("Permission to access microphone is required!");
      }
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      const durationMs = status.durationMillis;
      recordingRef.current = null;

      if (durationMs < 1000) {
        // Ignore recordings shorter than 1 second
        return;
      }

      sendAudioMessage(uri, durationMs);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const sendAudioMessage = async (localUri, durationMs) => {
    if (!userId) return;

    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, text: "", image: null, audio: localUri, audioDuration: durationMs, fromMe: true, time: new Date(), _pending: true },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const response = await uploadChatMedia(localUri, 'audio/m4a');
      const audioUrl = response?.media?.find(m => m.type === 'AUDIO')?.url || response?.media?.[0]?.url || response?.url;
      
      if (audioUrl) {
        wsService.sendMessage(String(userId), "", { ...response, audioDuration: durationMs });
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, audio: audioUrl, _pending: true } : m));
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Send failed", err?.message || "Could not upload audio.");
    }
  };

  const sendMessage = () => {
    sendMessageText(message, { clearComposer: true });
  };

  const handleEmojiPick = (emoji) => {
    sendMessageText(emoji);
  };
  const showComingSoon = (feature) => {
    Alert.alert("Coming soon", `${feature} will be available soon.`);
  };

  const formatTime = (date) => formatChatTime(date) || date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    if (!isKeyboardVisible) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [isKeyboardVisible, message]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* ── HEADER ── */}
      <LinearGradient colors={[Colors.white, Colors.white]} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8} onPress={onBack}>
          <ArrowLeft size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerNameRow}>
          <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
          {otherUserDecorationBadge && (
            <View style={styles.headerBadgeRow}>
              <Image
                source={{ uri: otherUserDecorationBadge }}
                style={styles.headerDecorationBadge}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8}>
            <UserPlus size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8}>
            <MoreHorizontal size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.bodyWrap}>
        <Modal
          visible={showEmojiBox}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEmojiBox(false)}
        >
          <TouchableOpacity
            style={styles.emojiOverlay}
            activeOpacity={1}
            onPress={() => setShowEmojiBox(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.emojiSheet,
                { bottom: composerBottom + (isKeyboardVisible ? 72 : 126) },
              ]}
              onPress={() => { }}
            >
              <Text style={styles.emojiSheetTitle}>Emojis</Text>
              <View style={styles.emojiGrid}>
                {LIMITED_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiItem}
                    activeOpacity={0.8}
                    onPress={() => handleEmojiPick(emoji)}
                  >
                    <Text style={styles.emojiItemText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <ScrollView
          ref={scrollRef}
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: composerHeight + (isKeyboardVisible ? keyboardHeight : 0) + 12,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── NOTIFICATION BANNER ── */}
          {showBanner && (
            <View style={styles.bannerWrap}>
              <LinearGradient
                colors={[Colors.primaryAlpha08, Colors.secondaryAlpha08]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.banner}
              >
                <View style={styles.bannerIconWrap}>
                  <Text style={styles.bannerIconEmoji}>📬</Text>
                </View>
                <Text style={styles.bannerText}>
                  Enable notification to receive their messages
                </Text>
                <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.8}>
                  <Text style={styles.bannerBtnText}>Notify me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bannerClose}
                  activeOpacity={0.8}
                  onPress={() => setShowBanner(false)}
                >
                  <X size={13} color={Colors.primary} />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* ── USER PROFILE CARD ── */}
          <View style={styles.matchCardWrap}>
            <LinearGradient
              colors={[Colors.bgSlateLight, Colors.bgSlateMedium, Colors.bgSlateLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.matchCard}
            >
              <View style={styles.matchTopRow}>
                <TouchableOpacity activeOpacity={0.85} onPress={handleAvatarPress}>
                  <LinearGradient
                    colors={otherUserVipFrame ? [Colors.white, Colors.white] : [Colors.primary, Colors.secondary]}
                    style={styles.matchAvatarRing}
                  >
                    <View style={styles.matchAvatarWrap}>
                      {avatar ? (
                        <Image
                          source={resolveAvatarSource(avatar)}
                          style={styles.matchAvatar}
                        />
                      ) : (
                        <View style={[styles.matchAvatar, styles.matchAvatarPlaceholder]}>
                          <Text style={styles.matchInitial}>{name?.[0]?.toUpperCase() ?? "?"}</Text>
                        </View>
                      )}
                      {otherUserVipFrame ? (
                        // VIP profile frame overlay — scale/position may need visual tuning on device
                        <Image
                          source={{ uri: otherUserVipFrame }}
                          style={styles.matchAvatarFrameOverlay}
                          resizeMode="contain"
                          pointerEvents="none"
                        />
                      ) : null}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                <View style={styles.matchUserInfo}>
                  <Text style={styles.matchUserName}>{name}</Text>
                  {lastMsg ? (
                    <Text style={styles.matchLastMsg} numberOfLines={2}>{lastMsg}</Text>
                  ) : null}
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ── MESSAGES AREA ── */}
          {messages.length === 0 ? (
            historyError ? (
              <View style={styles.historyErrorWrap}>
                <Text style={styles.historyErrorText}>
                  Couldn&apos;t load messages. Check your connection and try again.
                </Text>
                <TouchableOpacity
                  style={styles.historyRetryBtn}
                  activeOpacity={0.8}
                  onPress={handleRetryHistory}
                >
                  <Text style={styles.historyRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : historyLoading ? (
              <View style={styles.historyLoadingWrap}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <View style={styles.emptyChat} />
            )
          ) : (
            <View style={styles.messagesList}>
              {messages.map((msg) => {
                const inviteInfo = parseRoomInviteMessage(msg.text);
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.msgRow,
                      msg.fromMe ? styles.msgRowMe : styles.msgRowThem,
                    ]}
                  >
                    {!msg.fromMe && (
                      <TouchableOpacity activeOpacity={0.85} onPress={handleAvatarPress}>
                        <View style={styles.msgAvatarWrap}>
                          {avatar ? (
                            <Image
                              source={resolveAvatarSource(avatar)}
                              style={styles.msgAvatar}
                            />
                          ) : (
                            <View style={[styles.msgAvatar, styles.msgAvatarPlaceholder]}>
                              <Text style={styles.msgInitial}>{name?.[0]?.toUpperCase() ?? "?"}</Text>
                            </View>
                          )}
                          {otherUserVipFrame ? (
                            <Image
                              source={{ uri: otherUserVipFrame }}
                              style={styles.msgAvatarFrameOverlay}
                              resizeMode="contain"
                              pointerEvents="none"
                            />
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    )}
                    <View
                      style={[
                        styles.msgBubble,
                        msg.fromMe ? styles.msgBubbleMe : styles.msgBubbleThem,
                        inviteInfo.isRoomInvite && styles.msgBubbleInvite,
                        (msg.image || msg.imageUrl) && { backgroundColor: "transparent", borderWidth: 0 },
                      ]}
                    >
                      {msg.fromMe ? (
                        <LinearGradient
                          colors={
                            (msg.image || msg.imageUrl)
                              ? ["transparent", "transparent"]
                              : inviteInfo.isRoomInvite
                              ? ["#2e1065", "#4c1d95"]
                              : [Colors.primary, Colors.secondary]
                          }
                          style={[
                            styles.msgBubbleGrad,
                            inviteInfo.isRoomInvite && styles.msgBubbleGradInvite,
                            (msg.image || msg.imageUrl) && { paddingHorizontal: 0, paddingVertical: 0 },
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          {msg.image || msg.imageUrl ? (
                            <Image
                              source={{ uri: msg.image || msg.imageUrl }}
                              style={{ width: W * 0.6, height: W * 0.6, borderRadius: 18 }}
                              resizeMode="cover"
                            />
                          ) : null}

                          {msg.audio ? (
                            <AudioPlayer uri={msg.audio} durationMs={msg.audioDuration} fromMe={true} />
                          ) : null}

                          {inviteInfo.isRoomInvite ? (
                            <View style={styles.roomInviteCard}>
                              <View style={styles.roomInviteHeader}>
                                <View style={styles.roomInviteBadge}>
                                  <Text style={styles.roomInviteBadgeText}>🎙️ Voice Party</Text>
                                </View>
                                <Sparkles size={14} color="#fde047" />
                              </View>
                              <Text style={styles.roomInviteTitle} numberOfLines={2}>
                                {inviteInfo.roomTitle}
                              </Text>
                              <Text style={styles.roomInviteSub}>
                                You invited them to join this room.
                              </Text>
                              <TouchableOpacity
                                style={styles.roomInviteJoinBtn}
                                activeOpacity={0.85}
                                disabled={isJoiningRoom}
                                onPress={() => handleJoinRoomInvite(inviteInfo)}
                              >
                                <LinearGradient
                                  colors={["#f97316", "#ea580c"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.roomInviteJoinGrad}
                                >
                                  <Text style={styles.roomInviteJoinText}>Open Room 🎙️</Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            </View>
                          ) : msg.text && !( (msg.image || msg.audio) && (msg.text === "📷 Image" || msg.text === "🎵 Audio" || msg.text === " ") ) ? (
                            <Text style={styles.msgTextMe}>{msg.text}</Text>
                          ) : null}

                          <Text
                            style={[
                              styles.msgTime,
                              { color: Colors.whiteAlpha70 },
                              (msg.image || msg.imageUrl) && {
                                position: "absolute",
                                bottom: 8,
                                right: 12,
                                backgroundColor: Colors.blackAlpha40,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 10,
                                overflow: "hidden",
                              },
                            ]}
                          >
                            {formatTime(msg.time)}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View>
                          {/* NEW STAR badge row */}
                          {otherUserHasNewFrame && (
                            <View style={styles.msgBadgeRow}>
                              <Image
                                source={NEW_START_BADGE}
                                style={styles.msgNewStarBadge}
                                resizeMode="contain"
                              />
                            </View>
                          )}
                          <View
                            style={[
                              styles.msgBubbleThemInner,
                              inviteInfo.isRoomInvite && styles.msgBubbleThemInnerInvite,
                              (msg.image || msg.imageUrl) && {
                                paddingHorizontal: 0,
                                paddingVertical: 0,
                                borderWidth: 0,
                                backgroundColor: "transparent",
                              },
                            ]}
                          >
                            {msg.image || msg.imageUrl ? (
                              <Image
                                source={{ uri: msg.image || msg.imageUrl }}
                                style={{ width: W * 0.6, height: W * 0.6, borderRadius: 18, borderBottomLeftRadius: 4 }}
                                resizeMode="cover"
                              />
                            ) : null}

                            {msg.audio ? (
                              <AudioPlayer uri={msg.audio} durationMs={msg.audioDuration} fromMe={false} />
                            ) : null}

                            {inviteInfo.isRoomInvite ? (
                              <View style={styles.roomInviteCard}>
                                <View style={styles.roomInviteHeader}>
                                  <View style={styles.roomInviteBadge}>
                                    <Text style={styles.roomInviteBadgeText}>🎙️ Voice Party</Text>
                                  </View>
                                  <Sparkles size={14} color="#fde047" />
                                </View>
                                <Text style={styles.roomInviteTitle} numberOfLines={2}>
                                  {inviteInfo.roomTitle}
                                </Text>
                                <Text style={styles.roomInviteSub}>
                                  You've been invited to join this room!
                                </Text>
                                <TouchableOpacity
                                  style={styles.roomInviteJoinBtn}
                                  activeOpacity={0.85}
                                  disabled={isJoiningRoom}
                                  onPress={() => handleJoinRoomInvite(inviteInfo)}
                                >
                                  <LinearGradient
                                    colors={["#f97316", "#ea580c"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.roomInviteJoinGrad}
                                  >
                                    <Text style={styles.roomInviteJoinText}>Join Room 🎙️</Text>
                                  </LinearGradient>
                                </TouchableOpacity>
                              </View>
                            ) : msg.text && !( (msg.image || msg.audio) && (msg.text === "📷 Image" || msg.text === "🎵 Audio" || msg.text === " ") ) ? (
                              <Text style={styles.msgTextThem}>{msg.text}</Text>
                            ) : null}

                            <Text
                              style={[
                                styles.msgTime,
                                { color: Colors.grayPlaceholder },
                                (msg.image || msg.imageUrl) && {
                                  position: "absolute",
                                  bottom: 8,
                                  right: 12,
                                  backgroundColor: Colors.blackAlpha40,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 10,
                                  overflow: "hidden",
                                  color: "white",
                                },
                              ]}
                            >
                              {formatTime(msg.time)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ── COMPOSER (floats above keyboard) ── */}
        <View
          style={[
            styles.composer,
            styles.composerFloating,
            {
              bottom: isKeyboardVisible ? keyboardHeight : 0,
              paddingBottom: isKeyboardVisible ? 0 : idleBottom,
            }
          ]}
          onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}
        >
          <View style={styles.inputArea}>
            <TouchableOpacity
              style={styles.safeInputIcon}
              activeOpacity={0.8}
              onPress={() => setShowEmojiBox((v) => !v)}
            >
              <Text style={styles.emojiBtnText}>😊</Text>
            </TouchableOpacity>

            <View style={styles.inputRow}>
              {isRecording ? (
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error }} />
                  <Text style={{ color: Colors.textDark, fontSize: 15 }}>
                    Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
                  </Text>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Type a message"
                    placeholderTextColor={Colors.grayPlaceholder}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                  />
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, message.trim() && styles.sendBtnActive]}
              activeOpacity={0.8}
              onPress={sendMessage}
            >
              <LinearGradient
                colors={message.trim() ? [Colors.primary, Colors.secondary] : [Colors.borderLight, Colors.borderLight]}
                style={styles.sendBtnGrad}
              >
                <Send size={18} color={message.trim() ? "white" : Colors.grayPlaceholder} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {!isKeyboardVisible && (
            <View style={styles.actionBar}>
              {[
                {
                  icon: isRecording ? <Mic size={22} color={Colors.error} /> : <Mic size={22} color={Colors.primary} />,
                  label: "Speaker",
                  action: isRecording ? stopRecording : startRecording
                },
                { icon: <ImageIcon size={22} color={Colors.primary} />, label: "Gallery", action: handleGalleryPick },
                { icon: <HelpCircle size={22} color={Colors.primary} />, label: "Help" },
                { icon: <Gift size={22} color={Colors.accentGold || Colors.accentGold} />, label: "Gift" },
                { icon: <Phone size={22} color={Colors.primary} />, label: "Call", action: () => initiateCall('audio') },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={() => item.action ? item.action() : showComingSoon(item.label)}
                >
                  {item.icon}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── CALL OVERLAY ── */}
        {callState.status !== "IDLE" && (
          <Modal visible={true} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: Colors.white }}>
              {/* Call Background */}
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primaryAlpha20, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  {avatar ? (
                    <Image source={resolveAvatarSource(avatar)} style={{ width: 120, height: 120, borderRadius: 60 }} />
                  ) : (
                    <Text style={{ color: Colors.primary, fontSize: 40, fontWeight: "800" }}>{name?.[0]?.toUpperCase() ?? "?"}</Text>
                  )}
                </View>
                <Text style={{ color: Colors.textDark, fontSize: 28, fontWeight: "700", marginBottom: 8 }}>{name}</Text>
                <Text style={{ color: Colors.textDarkMuted, fontSize: 16 }}>
                  {callState.status === "INCOMING" ? "Incoming Call..." : callState.status === "OUTGOING" ? "Calling..." : formatCallDuration(callDuration)}
                </Text>
              </View>

              {/* Call Controls */}
              <View style={{ position: "absolute", bottom: 50, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 30, paddingHorizontal: 40 }}>
                {callState.status === "INCOMING" ? (
                  <>
                    <TouchableOpacity onPress={rejectCall} style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.errorBg, alignItems: "center", justifyContent: "center" }}>
                      <PhoneOff size={30} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={acceptCall} style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.success, alignItems: "center", justifyContent: "center" }}>
                      <PhoneCall size={30} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {(callState.status === "CONNECTED" || callState.status === "OUTGOING") && (
                      <>
                        <TouchableOpacity onPress={toggleLocalAudio} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.blackAlpha05, alignItems: "center", justifyContent: "center" }}>
                          {callState.agoraState.localAudioEnabled ? <Mic size={24} color="white" /> : <MicOff size={24} color={Colors.errorBg} />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleSpeakerphone(!callState.agoraState.speakerphoneEnabled)} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.blackAlpha05, alignItems: "center", justifyContent: "center" }}>
                          {callState.agoraState.speakerphoneEnabled ? <Volume2 size={24} color={Colors.primary} /> : <VolumeX size={24} color={Colors.grayPlaceholder} />}
                        </TouchableOpacity>

                      </>
                    )}
                    <TouchableOpacity onPress={endCall} style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.errorBg, alignItems: "center", justifyContent: "center" }}>
                      <PhoneOff size={30} color="white" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  bodyWrap: { flex: 1, position: "relative" },
  emojiOverlay: {
    flex: 1,
    backgroundColor: Colors.blackAlpha20,
  },
  emojiSheet: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 12,
  },
  emojiSheetTitle: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiItem: {
    width: (W - 60) / 6,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emojiItemText: { fontSize: 20 },
  composer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  composerFloating: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 10,
    gap: 6,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryAlpha12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderPrimaryAlpha,
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    gap: 10,
    // marginLeft: 4,
  },
  headerAvatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  headerAvatarPlaceholder: {
    backgroundColor: Colors.primaryAlpha15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  headerInitial: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  headerNameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  headerName: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  headerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  headerDecorationBadge: {
    height: 16,
    width: 16 * (438 / 179),
  },
  headerRight: { flexDirection: "row", gap: 6 },

  // Body
  body: { flex: 1 },

  // Banner
  bannerWrap: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
  },
  bannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primaryAlpha10,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerIconEmoji: { fontSize: 20 },
  bannerText: { flex: 1, color: Colors.textSlate, fontSize: 12, lineHeight: 17 },
  bannerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  bannerBtnText: { color: "white", fontSize: 11, fontWeight: "700" },
  bannerClose: { position: "absolute", top: 6, right: 6, padding: 4 },

  // Match card
  matchCardWrap: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderPrimaryAlpha20,
  },
  matchCard: { padding: 14, gap: 12 },

  matchTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  matchAvatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2.5,
  },
  matchAvatarWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  matchAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  matchAvatarFrameOverlay: {
    position: "absolute",
    width: "130%",
    height: "130%",
    left: "-15%",
    top: "-15%",
  },
  matchAvatarPlaceholder: {
    backgroundColor: Colors.primaryAlpha35,
    alignItems: "center",
    justifyContent: "center",
  },
  matchInitial: {
    color: Colors.textSlateDark,
    fontSize: 22,
    fontWeight: "800",
  },
  matchUserInfo: {
    flex: 1,
    gap: 4,
  },
  matchUserName: {
    color: Colors.textSlateDark,
    fontSize: 20,
    fontWeight: "800",
  },
  matchLastMsg: {
    color: Colors.textSlateMuted,
    fontSize: 13,
    fontWeight: "500",
  },

  // Safe mode banner
  safeBannerWrap: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  safeBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
  },
  safeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.bgSlateMedium,
    alignItems: "center",
    justifyContent: "center",
  },
  safeText: { flex: 1, color: Colors.secondary, fontSize: 12, fontWeight: "600" },
  safeArrow: { flexDirection: "row", alignItems: "center" },

  // Empty chat
  emptyChat: { height: 120 },
  historyLoadingWrap: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  historyErrorWrap: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  historyErrorText: {
    color: Colors.textSlateMuted,
    fontSize: 13,
    textAlign: "center",
  },
  historyRetryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  historyRetryText: { color: "white", fontSize: 13, fontWeight: "700" },

  // Messages
  messagesList: { paddingHorizontal: 14, paddingTop: 16, gap: 12 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowThem: { justifyContent: "flex-start" },
  msgAvatarWrap: { width: 32, height: 32, position: "relative" },
  msgAvatar: { width: 32, height: 32, borderRadius: 16 },
  msgAvatarFrameOverlay: {
    position: "absolute",
    width: "130%",
    height: "130%",
    left: "-15%",
    top: "-15%",
  },
  msgAvatarPlaceholder: {
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  msgInitial: {
    color: Colors.textSlateDark,
    fontSize: 13,
    fontWeight: "700",
  },
  msgBubble: { maxWidth: W * 0.68 },
  msgBubbleMe: {},
  msgBubbleThem: {},
  msgBubbleGrad: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  msgBubbleThemInner: {
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  msgTextMe: { color: "white", fontSize: 14, lineHeight: 20 },
  msgTextThem: { color: Colors.textSlateDark, fontSize: 14, lineHeight: 20 },
  msgTime: { color: Colors.grayPlaceholder, fontSize: 10, alignSelf: "flex-end" },

  // Input
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  safeInputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgSlateMedium,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: Colors.textSlateDark,
    fontSize: 14,
    maxHeight: 80,
    padding: 0,
  },
  emojiBtn: { paddingLeft: 8 },
  emojiBtnText: { fontSize: 20 },
  sendBtn: { width: 42, height: 42 },
  sendBtnActive: {},
  sendBtnGrad: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  // New star badge row above "them" bubbles
  msgBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 2,
  },
  msgNewStarBadge: {
    width: 52,
    height: 24,
    marginLeft: 2,
  },

  // Bottom action bar
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgSlateMedium,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Voice Party Room Invitation Card
  msgBubbleInvite: {
    maxWidth: W * 0.76,
  },
  msgBubbleGradInvite: {
    padding: 12,
  },
  msgBubbleThemInnerInvite: {
    backgroundColor: "#1f1238",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 77, 255, 0.3)",
  },
  roomInviteCard: {
    width: "100%",
    minWidth: 200,
    gap: 6,
    marginBottom: 4,
  },
  roomInviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  roomInviteBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  roomInviteBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  roomInviteTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  roomInviteSub: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 11,
    lineHeight: 15,
  },
  roomInviteJoinBtn: {
    marginTop: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  roomInviteJoinGrad: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  roomInviteJoinText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
