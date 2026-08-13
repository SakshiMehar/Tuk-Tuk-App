import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  TextInput,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  DeviceEventEmitter,
  BackHandler,
  PermissionsAndroid,
  Keyboard,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { Image as ExpoImage } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  followUser,
  unfollowUser,
  blockUser,
  loadRelationshipStatus,
  isSameUser,
} from "../src/services/relationshipService";
import { getAppUserId } from "../src/utils/sessionUser";
import {
  enterRoomSession,
  exitRoomSession,
  enterRandomPartySession,
  parseSeats,
  parseOnlineUsers,
  normalizeChatMessage,
  normalizeChatMessages,
  createLocalChatMessage,
  upsertChatMessage,
} from "../src/services/partyService";
import { wsService } from "../src/services/websocket";
import { getRoomState, getRoomChatMessages, lockSeat, postSeatHeartbeat } from "../src/api/partyApi";
import { refreshTokenCache } from "../src/api/axios";
import { useKeyboardInset } from "../src/hooks/useKeyboardInset";
import { useTreasureBoxProgress } from "../src/hooks/useTreasureBoxProgress";
import { useWalletBalance } from "../src/hooks/useWalletBalance";
import { refreshWalletBalance, applyWalletFromSources } from "../src/store/walletStore";
import {
  buyGiftToBackpack,
  loadPartyGiftCatalog,
  loadGiftInventory,
  normalizeGiftAnimation,
  sendPartyRoomGift,
  findInventoryGift,
  adjustInventoryQty,
  reconcileInventory,
  parseBuyResultInventory,
  giftsMatch,
} from "../src/services/giftCatalogService";
import TreasureBoxModal from "./TreasureBoxModal";
import RoomUserProfilePopup from "./RoomUserProfilePopup";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";
import {
  MEDIA_SECTIONS,
  emojiCategories,
  stickerPacks,
  gifCategories,
  isChatMediaUrl,
} from "../src/data/voicePartyMediaPicker";
import { loadConversations } from "../src/services/chatService";
import { getUser } from "../src/store/authStore";
import { resolveProfileAvatarUri, resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { resolveNewUserFrameSource } from "../src/utils/newUserFrame";
import { extractVipProfileFrameUrl } from "../src/utils/vipProfileFrame";
import { NEW_USER_FRAME_LAYOUT } from "../src/constants/newUserFrameLayout";
import { syncNewUserFrameForSession } from "../src/services/newUserFrameService";
import { getUserUiAssets } from "../src/api/uiAssetsApi";
import { reportUser } from "../src/api/postApi";
import ReportReasonModal from "./ReportReasonModal";
import { syncUserLevelForSession } from "../src/services/userLevelService";
import { loadUserDetail } from "../src/services/nearbyService";
import { resolveVideoSource, resolveImageSource } from "../src/utils/videoSource";
import * as partyVoice from "../src/services/partyVoiceService";
import * as agoraVoice from "../src/services/agoraVoiceService";
import { loadMyVipAssets } from "../src/services/vipService";
import {
  VIP_PROFILE_FRAME_LAYOUT,
  VIP_CHAT_FRAME_FITTED_BY_TIER,
} from "../src/constants/vip";
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  Power,
  Plus,
  Mic,
  MicOff,
  Smile,
  MessageSquare,
  Volume2,
  VolumeX,
  LayoutGrid,
  MessageCircle,
  AlertCircle,
  Ban,
  Crown,
  Sparkles,
  Minimize2,
  Play,
} from "lucide-react-native";

const { width: W, height: H } = Dimensions.get("window");
// Keep W/H live — on foldables or edge-to-edge layout shifts, refresh the values
Dimensions.addEventListener("change", ({ window }) => {
  // StyleSheet values are computed once, but absolute-positioned bg covers
  // are replaced with "100%" via StyleSheet below, so this is only needed
  // for any future dynamic usage.
});

const TREASURE_BOX_GIF = require("../assets/Gift/tresurebox.gif");
const NEW_START_BADGE = require("../assets/Batches/newstart-batch.png");

// Listen Rewards — countdown thresholds in seconds
const LISTEN_THRESHOLDS = [60, 3600, 18000]; // 1 min, 1 hr, 5 hr
const LISTEN_THRESHOLD_LABELS = ["1 min", "1 hr", "5 hr"];
const LISTEN_LOCKED_IMGS = [
  require("../assets/Gift/gift1.png"),
  require("../assets/Gift/gift2.png"),
  require("../assets/Gift/gift3.png"),
];
const LISTEN_GIFT_POOL = [
  require("../assets/Gift/gift1.png"),
  require("../assets/Gift/gift2.png"),
  require("../assets/Gift/gift3.png"),
  require("../assets/Gift/gift4.gif"),
];

const enrichSeatsWithMyProfile = async (parsedSeats, seatNumber) => {
  if (!seatNumber) return parsedSeats;
  const user = await getUser();
  const userId = await getAppUserId().catch(() => null);
  // For OWN seat always prefer local profile data — WS data can be stale or empty.
  const resolvedAvatarUri =
    resolveProfileAvatarUri(user) ??
    user?.profilePicUrl ??
    user?.avatarUrl ??
    user?.profileImageUrl ??
    user?.profileImage ??
    null;
  const name = user?.name ?? user?.username ?? user?.nickname ?? "User";
  const username = user?.username ?? user?.name ?? null;

  return parsedSeats.map((seat) => {
    if (seat.id !== seatNumber) return seat;

    const existing = seat.user ?? {};
    return {
      ...seat,
      user: {
        ...existing,
        id: existing.id ?? userId,
        name:
          existing.name && existing.name !== "Guest" ? existing.name : (name ?? existing.name ?? "User"),
        username: existing.username ?? username,
        // Always use local profile data for avatar fields on own seat.
        avatarId: user?.avatarId ?? existing.avatarId ?? null,
        avatar: resolvedAvatarUri ?? existing.avatar ?? null,
        avatarUrl: user?.avatarUrl ?? existing.avatarUrl ?? null,
        profilePicUrl: user?.profilePicUrl ?? existing.profilePicUrl ?? null,
        profileImageUrl: user?.profileImageUrl ?? existing.profileImageUrl ?? null,
        profileImage: user?.profileImage ?? existing.profileImage ?? null,
        hasNewUserFrame: Boolean(user?.hasNewUserFrame),
        newUserFrameUrl: user?.newUserFrameUrl ?? null,
        level: existing.level ?? user?.level ?? 1,
        active: true,
        muted: existing.muted ?? false,
      },
    };
  });
};

const reconcileSeatAssignments = (
  parsedSeats,
  { onlineUsers = null, myUserId = null, mySeatNumber = null } = {}
) => {
  const next = parsedSeats.map((seat) => ({ ...seat, user: seat.user ? { ...seat.user } : null }));

  const onlineIds =
    Array.isArray(onlineUsers) && onlineUsers.length > 0
      ? new Set(
        onlineUsers
          .map((u) => (u?.id != null ? String(u.id) : null))
          .filter(Boolean)
      )
      : null;

  // If room presence is known, clear seats for users who already left.
  if (onlineIds) {
    for (let i = 0; i < next.length; i += 1) {
      const userId = next[i]?.user?.id != null ? String(next[i].user.id) : null;
      if (userId && !onlineIds.has(userId)) {
        next[i] = { ...next[i], user: null };
      }
    }
  }

  const indexByUserId = new Map();
  for (let i = 0; i < next.length; i += 1) {
    const seat = next[i];
    const userId = seat?.user?.id != null ? String(seat.user.id) : null;
    if (!userId) continue;

    if (!indexByUserId.has(userId)) {
      indexByUserId.set(userId, i);
      continue;
    }

    const prevIdx = indexByUserId.get(userId);
    const prevSeat = next[prevIdx];
    const prevUser = prevSeat?.user;
    const currUser = seat?.user;

    let keepCurrent = false;
    if (myUserId && String(myUserId) === userId && mySeatNumber) {
      keepCurrent = seat.id === mySeatNumber && prevSeat.id !== mySeatNumber;
    } else if (Boolean(currUser?.active) !== Boolean(prevUser?.active)) {
      keepCurrent = Boolean(currUser?.active);
    } else if (Boolean(currUser?.muted) !== Boolean(prevUser?.muted)) {
      keepCurrent = Boolean(prevUser?.muted) && !Boolean(currUser?.muted);
    } else {
      // Fallback: prefer later seat as fresher assignment.
      keepCurrent = Number(seat.id) >= Number(prevSeat.id);
    }

    if (keepCurrent) {
      next[prevIdx] = { ...next[prevIdx], user: null };
      indexByUserId.set(userId, i);
    } else {
      next[i] = { ...next[i], user: null };
    }
  }

  return next;
};

const micSeats = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, user: null, locked: false }));

const initialMessages = [
  {
    id: 1,
    system: true,
    text: "🔥 • T|O|M • 🔥 cleaned the chat",
  },
  {
    id: 2,
    user: "ziddi_shehzadi_99",
    avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    level: 6,
    text: "hmm",
    coins: 0,
    diamonds: 4,
  },
  {
    id: 3,
    user: "Broken 💔",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    level: 4,
    text: "hello everyone 👋",
    coins: 2,
    diamonds: 1,
  },
  {
    id: 4,
    user: "T|O|M",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    level: 8,
    text: "welcome to the room 🎉",
    coins: 5,
    diamonds: 3,
  },
];

const audienceAvatars = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/55.jpg",
  "https://randomuser.me/api/portraits/women/66.jpg",
];

const SEAT_SIZE = (W - 32 - 40) / 5;
const GIFT_CARD_W = (W - 32) / 4 - 6;

const formatGiftPrice = (price) =>
  Number(price ?? 0).toLocaleString();

const SEAT_FRAME_CONFIG = NEW_USER_FRAME_LAYOUT;

const RING_SIZE = SEAT_SIZE - 2;
const RING_BASE_STYLE = {
  position: "absolute",
  width: RING_SIZE,
  height: RING_SIZE,
  borderRadius: RING_SIZE / 2,
  borderWidth: 2.5,
  borderColor: "#4ade80",
  backgroundColor: "transparent",
};

const SpeakingRing = ({ active }) => {
  const s1 = useSharedValue(1);
  const o1 = useSharedValue(0);
  const s2 = useSharedValue(1);
  const o2 = useSharedValue(0);
  const s3 = useSharedValue(1);
  const o3 = useSharedValue(0);

  useEffect(() => {
    const CYCLE = 1500;
    if (active) {
      s1.value = withRepeat(
        withSequence(withTiming(1, { duration: 0 }), withTiming(1.5, { duration: CYCLE })),
        -1
      );
      o1.value = withRepeat(
        withSequence(withTiming(0.9, { duration: 0 }), withTiming(0, { duration: CYCLE })),
        -1
      );
      s2.value = withDelay(
        500,
        withRepeat(
          withSequence(withTiming(1, { duration: 0 }), withTiming(1.5, { duration: CYCLE })),
          -1
        )
      );
      o2.value = withDelay(
        500,
        withRepeat(
          withSequence(withTiming(0.9, { duration: 0 }), withTiming(0, { duration: CYCLE })),
          -1
        )
      );
      s3.value = withDelay(
        1000,
        withRepeat(
          withSequence(withTiming(1, { duration: 0 }), withTiming(1.5, { duration: CYCLE })),
          -1
        )
      );
      o3.value = withDelay(
        1000,
        withRepeat(
          withSequence(withTiming(0.9, { duration: 0 }), withTiming(0, { duration: CYCLE })),
          -1
        )
      );
    } else {
      s1.value = withTiming(1, { duration: 300 });
      o1.value = withTiming(0, { duration: 300 });
      s2.value = withTiming(1, { duration: 300 });
      o2.value = withTiming(0, { duration: 300 });
      s3.value = withTiming(1, { duration: 300 });
      o3.value = withTiming(0, { duration: 300 });
    }
  }, [active]);

  const a1 = useAnimatedStyle(() => ({
    transform: [{ scale: s1.value }],
    opacity: o1.value,
  }));
  const a2 = useAnimatedStyle(() => ({
    transform: [{ scale: s2.value }],
    opacity: o2.value,
  }));
  const a3 = useAnimatedStyle(() => ({
    transform: [{ scale: s3.value }],
    opacity: o3.value,
  }));

  return (
    <>
      <Animated.View style={[RING_BASE_STYLE, a1]} />
      <Animated.View style={[RING_BASE_STYLE, a2]} />
      <Animated.View style={[RING_BASE_STYLE, a3]} />
    </>
  );
};

export default function VoiceParty() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roomIdParam = params.roomId ?? params.id ?? null;
  const isRandomParty = params.party === "true";

  const [roomLoading, setRoomLoading] = useState(true);
  const [roomId, setRoomId] = useState(roomIdParam);
  const [roomInfo, setRoomInfo] = useState(null);
  const [seats, setSeats] = useState(micSeats);
  const [speakingUserIds, setSpeakingUserIds] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState([]);
  // The logged-in user's own VIP cosmetics (profile/entry/chat frame + logo) —
  // unlocked once their gamification totalXp crosses VIP_XP_THRESHOLD. Only
  // covers the CURRENT user for now; other participants' VIP status isn't
  // available from the room/chat payloads yet.
  const [myVipAssets, setMyVipAssets] = useState({
    unlocked: false,
    profileFrame: null,
    entryFrame: null,
    chatFrame: null,
    logo: null,
  });
  // Current name/avatar fetched per-userId for chat senders who aren't in the
  // room's live participant/seat lists — see resolveChatSenderName/Avatar below.
  const [userProfileCache, setUserProfileCache] = useState({});
  const avatarLookupAttemptedRef = useRef(new Set());
  const [inputText, setInputText] = useState("");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [taggedUser, setTaggedUser] = useState(null); // { id, name, username }
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [onMic, setOnMic] = useState(false);
  const [mySeatNumber, setMySeatNumber] = useState(null);
  const [voiceConnecting, setVoiceConnecting] = useState(false);
  const [voiceListenStatus, setVoiceListenStatus] = useState("idle");
  const [voiceDiagnostics, setVoiceDiagnostics] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const exitedRef = useRef(false);
  const onMicRef = useRef(false);
  const mySeatNumberRef = useRef(null);
  const buyingGiftRef = useRef(false);
  const roomIdRef = useRef(roomIdParam);
  const fetchedUiAssetIdsRef = useRef(new Set());
  const { keyboardHeight, safeBottom, idleBottom } = useKeyboardInset();
  const [showPlayCenter, setShowPlayCenter] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [listenSeconds, setListenSeconds] = useState(0);
  const listenSecondsRef = useRef(0);
  const [rewardStates, setRewardStates] = useState([
    { claimed: false, rewardImg: null },
    { claimed: false, rewardImg: null },
    { claimed: false, rewardImg: null },
  ]);
  const [showTreasureBox, setShowTreasureBox] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [backpackMainTab, setBackpackMainTab] = useState("Backpack");
  const [backpackSubTab, setBackpackSubTab] = useState("Gift");
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftQty, setGiftQty] = useState(1);
  const [purchaseGift, setPurchaseGift] = useState(null);
  const [backpackGifts, setBackpackGifts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);
  const [giftCatalog, setGiftCatalog] = useState({
    random: [],
    gift: [],
    activity: [],
    activityByEvent: {},
    relationship: [],
    pk: [],
    special: [],
    vip: [],
  });
  const [giftReceiverId, setGiftReceiverId] = useState(null);
  const [showGiftReceiverPicker, setShowGiftReceiverPicker] = useState(false);
  const giftReceiverTouchedRef = useRef(false);
  const [giftPopup, setGiftPopup] = useState(null);
  const [activityEvent, setActivityEvent] = useState("Flamenco Fantasy");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  // Frame data keyed by userId string — lives independently of seats/onlineUsers
  // so WebSocket seat resets can never wipe it.
  const [userFrameData, setUserFrameData] = useState({});
  // Empty-seat action sheet
  const [seatActionSheet, setSeatActionSheet] = useState(null); // { seatId }
  const [seatActionLoading, setSeatActionLoading] = useState(false);
  // Mic permission warning popup (stores pending seatId)
  const [micPermWarning, setMicPermWarning] = useState(null); // seatId | null
  // Pinned welcome message (editable by the host)
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome everyone! Let's chat and have fun together!");
  const [showWelcomeEdit, setShowWelcomeEdit] = useState(false);
  const [welcomeDraft, setWelcomeDraft] = useState("");

  const videoPlayer = useVideoPlayer(null, (p) => { p.loop = false; });

  useEffect(() => {
    if (!showVideoModal || !currentVideo) {
      videoPlayer.pause();
      return undefined;
    }

    let cancelled = false;
    const source = resolveVideoSource(currentVideo.videoUrl ?? currentVideo.uri);
    if (!source) return undefined;

    (async () => {
      try {
        await videoPlayer.replaceAsync(source);
        if (!cancelled) videoPlayer.play();
      } catch (err) {
        console.error("[VoiceParty] relationship video failed", err);
        if (!cancelled) {
          Alert.alert("Video error", "Could not play this video. Try again.");
          setShowVideoModal(false);
          setCurrentVideo(null);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [showVideoModal, currentVideo?.id, currentVideo?.videoUrl, currentVideo?.uri]);
  const [mediaSection, setMediaSection] = useState("emoji");
  const [emojiTab, setEmojiTab] = useState("smileys");
  const [stickerTab, setStickerTab] = useState("reactions");
  const [gifTab, setGifTab] = useState("trending");
  const [showChatInput, setShowChatInput] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [profilePopupUser, setProfilePopupUser] = useState(null);
  const [profilePopupAvatarSource, setProfilePopupAvatarSource] = useState(null);
  const [profilePopupLoading, setProfilePopupLoading] = useState(false);
  const [profilePopupFollowing, setProfilePopupFollowing] = useState(false);
  const [profileFollowLoading, setProfileFollowLoading] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const [localSessionUser, setLocalSessionUser] = useState(null);
  const hostId = roomInfo?.hostId ?? null;
  const isHostSelf = isSameUser(hostId, myUserId);
  const { treasureState, selectChest } = useTreasureBoxProgress(!roomLoading && Boolean(roomId));
  const { diamonds: walletDiamonds } = useWalletBalance();

  useEffect(() => {
    refreshWalletBalance();
  }, []);

  useEffect(() => {
    getUser()
      .then((user) => setLocalSessionUser(user))
      .catch(() => setLocalSessionUser(null));
  }, []);

  // When the user updates their profile (avatar, name, etc.) anywhere in the app,
  // refresh localSessionUser and patch their avatar into the mic seat immediately.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("userProfileUpdated", (updatedUser) => {
      setLocalSessionUser(updatedUser);
      if (!mySeatNumber) return;
      // Re-resolve the avatar URI from the freshly-saved user object.
      const freshAvatarUri =
        resolveProfileAvatarUri(updatedUser) ??
        updatedUser?.profilePicUrl ??
        updatedUser?.avatarUrl ??
        updatedUser?.profileImageUrl ??
        updatedUser?.profileImage ??
        null;
      setSeats((prev) =>
        prev.map((seat) => {
          if (seat.id !== mySeatNumber || !seat.user) return seat;
          return {
            ...seat,
            user: {
              ...seat.user,
              // Use updated values unconditionally — null means "no longer set".
              avatarId: updatedUser?.avatarId ?? null,
              avatar: freshAvatarUri ?? null,
              avatarUrl: updatedUser?.avatarUrl ?? null,
              profilePicUrl: updatedUser?.profilePicUrl ?? null,
              profileImageUrl: updatedUser?.profileImageUrl ?? null,
              profileImage: updatedUser?.profileImage ?? null,
              name: updatedUser?.name ?? updatedUser?.username ?? seat.user.name,
            },
          };
        })
      );
    });
    return () => sub.remove();
  }, [mySeatNumber]);

  // Collect all visible user IDs (seats + audience + chat senders) and fetch UI
  // assets for any we haven't seen before. Results go into userFrameData — a
  // separate state that WebSocket seat resets can never touch — so the frame
  // survives any re-render. Chat senders are included so the NEW STAR badge
  // also appears for audience members who are not on a mic seat.
  useEffect(() => {
    const seatUserIds = seats
      .filter((seat) => seat.user?.id != null)
      .map((seat) => String(seat.user.id));
    const audienceUserIds = onlineUsers
      .filter((u) => u?.id != null)
      .map((u) => String(u.id));
    const chatSenderIds = messages
      .filter((m) => m?.userId != null)
      .map((m) => String(m.userId));
    const allIds = [...new Set([...seatUserIds, ...audienceUserIds, ...chatSenderIds])];
    const pending = allIds.filter((userId) => !fetchedUiAssetIdsRef.current.has(userId));

    if (pending.length === 0) return;

    pending.forEach((userId) => {
      fetchedUiAssetIdsRef.current.add(userId);
      getUserUiAssets(userId)
        .then((response) => {
          console.log(`[VoiceParty] ui-assets userId=${userId}:`, JSON.stringify(response));
          const showFrame = Boolean(
            response?.showNewUserFrame ??
            response?.hasNewUserFrame ??
            response?.data?.showNewUserFrame ??
            response?.data?.hasNewUserFrame ??
            false
          );
          const frameUrl =
            response?.newUserFrameUrl ??
            response?.frameUrl ??
            response?.data?.newUserFrameUrl ??
            response?.data?.frameUrl ??
            null;
          const vipProfileFrameUrl =
            extractVipProfileFrameUrl(response) ?? extractVipProfileFrameUrl(response?.data);
          setUserFrameData((prev) => ({
            ...prev,
            [userId]: { hasNewUserFrame: showFrame, newUserFrameUrl: frameUrl, vipProfileFrameUrl },
          }));
        })
        .catch((err) => {
          if (__DEV__) console.warn(`[VoiceParty] ui-assets fetch failed userId=${userId}:`, err?.message ?? err);
        });
    });
  }, [seats, onlineUsers, messages]);

  const hostUserLike = useMemo(() => {
    const fromSeat = seats.find(
      (seat) => seat.user && isSameUser(seat.user.id ?? seat.user.userId, hostId)
    )?.user;
    if (fromSeat) return fromSeat;

    const fromOnline = onlineUsers.find(
      (user) => isSameUser(user.id ?? user.userId, hostId)
    );
    if (fromOnline) return fromOnline;

    if (isHostSelf && localSessionUser) {
      return {
        ...localSessionUser,
        profileImageUrl:
          roomInfo?.profileImageUrl ??
          localSessionUser.profileImageUrl ??
          localSessionUser.profilePicUrl,
        avatar:
          roomInfo?.profileImageUrl ??
          localSessionUser.avatar ??
          localSessionUser.avatarUrl,
      };
    }

    if (!hostId && !roomInfo?.profileImageUrl) return null;

    return {
      id: hostId,
      name: roomInfo?.name ?? "Host",
      avatar: roomInfo?.profileImageUrl,
      profileImageUrl: roomInfo?.profileImageUrl,
      avatarUrl: roomInfo?.profileImageUrl,
    };
  }, [hostId, seats, onlineUsers, roomInfo, isHostSelf, localSessionUser]);

  useEffect(() => {
    if (!showBackpack) return undefined;

    let cancelled = false;
    setCatalogLoading(true);
    Promise.all([
      loadPartyGiftCatalog()
        .then((catalog) => {
          if (!cancelled) setGiftCatalog(catalog);
        })
        .catch(() => {}),
      loadGiftInventory()
        .then((items) => {
          if (!cancelled) setBackpackGifts(items);
        })
        .catch(() => {
          if (!cancelled) setBackpackGifts([]);
        }),
      refreshWalletBalance(),
    ]).finally(() => {
      if (!cancelled) setCatalogLoading(false);
    });

    return () => { cancelled = true; };
  }, [showBackpack, catalogRefreshKey]);

  useEffect(() => {
    const keys = Object.keys(giftCatalog.activityByEvent);
    if (keys.length && !keys.includes(activityEvent)) {
      setActivityEvent(keys[0]);
    }
  }, [giftCatalog.activityByEvent, activityEvent]);

  const resolveRecipientUserId = useCallback(
    (userLike) => {
      const direct = userLike?.id ?? userLike?.userId ?? userLike?.uid;
      if (direct != null && String(direct).length > 0) return String(direct);

      const name = userLike?.name?.trim()?.toLowerCase();
      if (!name) return null;

      const fromOnline = onlineUsers.find(
        (user) => user?.id && user.name?.trim()?.toLowerCase() === name
      );
      if (fromOnline?.id) return String(fromOnline.id);

      return null;
    },
    [onlineUsers]
  );

  // Chat messages store the sender's name/avatar as a snapshot from when they were
  // SENT (that's how the backend persists them) — so a later username change never
  // updates old messages at the source. Resolve the CURRENT name/avatar instead,
  // from whatever's freshest: the room's live participant/seat lists, then the
  // per-user lookup cache populated by the effect below (for senders who've since
  // left the room — the profile lookup works for anyone, online or not).
  const resolveChatSenderAvatar = useCallback(
    (userId) => {
      if (userId == null) return null;
      const idStr = String(userId);
      const fromOnline = onlineUsers.find((user) => user?.id != null && String(user.id) === idStr);
      if (fromOnline?.avatar) return fromOnline.avatar;
      const fromSeat = seats.find((seat) => seat?.user?.id != null && String(seat.user.id) === idStr);
      if (fromSeat?.user?.avatar) return fromSeat.user.avatar;
      return userProfileCache[idStr]?.avatarUrl ?? null;
    },
    [onlineUsers, seats, userProfileCache]
  );

  const resolveChatSenderName = useCallback(
    (userId, fallbackName) => {
      if (userId == null) return fallbackName;
      const idStr = String(userId);
      const fromOnline = onlineUsers.find((user) => user?.id != null && String(user.id) === idStr);
      if (fromOnline?.name) return fromOnline.name;
      const fromSeat = seats.find((seat) => seat?.user?.id != null && String(seat.user.id) === idStr);
      if (fromSeat?.user?.name) return fromSeat.user.name;
      return userProfileCache[idStr]?.name ?? fallbackName;
    },
    [onlineUsers, seats, userProfileCache]
  );

  // For any chat sender not currently in the room's live participant/seat lists —
  // meaning we only have the stale name/avatar snapshotted on the message itself —
  // fetch their current profile once (by userId, works whether they're in the room
  // or not) and cache it so every one of their messages, old and new, picks it up.
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.system || msg.userId == null) return;
      const idStr = String(msg.userId);
      if (avatarLookupAttemptedRef.current.has(idStr)) return;

      const fromOnline = onlineUsers.find((user) => user?.id != null && String(user.id) === idStr);
      if (fromOnline) return;
      const fromSeat = seats.find((seat) => seat?.user?.id != null && String(seat.user.id) === idStr);
      if (fromSeat?.user) return;

      avatarLookupAttemptedRef.current.add(idStr);
      loadUserDetail(idStr)
        .then((detail) => {
          setUserProfileCache((prev) => ({
            ...prev,
            [idStr]: { avatarUrl: detail?.avatarUrl ?? null, name: detail?.name ?? null },
          }));
        })
        .catch(() => {
          setUserProfileCache((prev) => ({ ...prev, [idStr]: null }));
        });
    });
  }, [messages, onlineUsers, seats]);

  const giftRecipientOptions = useMemo(() => {
    const byId = new Map();

    const addRecipient = ({ id, name, avatar, subtitle }) => {
      const normalizedId = id != null ? String(id) : null;
      if (!normalizedId || isSameUser(normalizedId, myUserId)) return;

      if (byId.has(normalizedId)) {
        const existing = byId.get(normalizedId);
        if (!existing.avatar && avatar) existing.avatar = avatar;
        if (subtitle && !existing.subtitle?.includes("Mic")) {
          existing.subtitle = subtitle;
        }
        return;
      }

      byId.set(normalizedId, {
        id: normalizedId,
        name: name ?? "User",
        avatar: avatar ?? null,
        subtitle: subtitle ?? null,
      });
    };

    if (hostId && !isSameUser(hostId, myUserId)) {
      addRecipient({
        id: hostId,
        name: roomInfo?.name ?? "Host",
        avatar: roomInfo?.profileImageUrl ?? null,
        subtitle: "Host",
      });
    }

    onlineUsers.forEach((user) => {
      const userId = resolveRecipientUserId(user);
      if (!userId) return;
      addRecipient({
        id: userId,
        name: user.name,
        avatar: user.avatar,
        subtitle: "In room",
      });
    });

    seats.forEach((seat) => {
      if (!seat.user) return;
      const userId = resolveRecipientUserId(seat.user);
      if (!userId) return;
      addRecipient({
        id: userId,
        name: seat.user.name,
        avatar: seat.user.avatar,
        subtitle: `On mic · ${seat.id}`,
      });
    });

    return Array.from(byId.values());
  }, [hostId, roomInfo, onlineUsers, seats, myUserId, resolveRecipientUserId]);

  useEffect(() => {
    if (!showBackpack) setShowGiftReceiverPicker(false);
  }, [showBackpack]);

  useEffect(() => {
    if (giftReceiverTouchedRef.current || giftReceiverId) return;
    const preferred =
      giftRecipientOptions[0]?.id ??
      (hostId && !isSameUser(hostId, myUserId) ? String(hostId) : null) ??
      null;
    if (preferred) setGiftReceiverId(preferred);
  }, [giftRecipientOptions, giftReceiverId, hostId, myUserId]);

  useEffect(() => {
    if (!showBackpack || giftReceiverTouchedRef.current || giftReceiverId) return;
    const preferred = giftRecipientOptions[0]?.id ?? null;
    if (preferred) setGiftReceiverId(preferred);
  }, [showBackpack, giftRecipientOptions, giftReceiverId]);

  useEffect(() => {
    getAppUserId()
      .then((id) => setMyUserId(id))
      .catch(() => setMyUserId(null));
  }, []);

  useEffect(() => {
    if (!hostId || isSameUser(hostId, myUserId)) {
      setIsFollowing(false);
      return;
    }
    let cancelled = false;
    loadRelationshipStatus(hostId)
      .then((status) => {
        if (!cancelled) setIsFollowing(status.following);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [hostId, myUserId]);

  const handleFollowToggle = async () => {
    if (!hostId || isHostSelf) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(hostId);
      } else {
        await followUser(hostId);
      }
      setIsFollowing((v) => !v);
    } catch (err) {
      Alert.alert(
        isFollowing ? "Unfollow failed" : "Follow failed",
        err.message || "Please try again."
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlockHost = async () => {
    if (!hostId || isHostSelf) return;
    setShowMoreMenu(false);
    try {
      await blockUser(hostId);
      Alert.alert("Blocked", "User has been blocked.");
    } catch (err) {
      Alert.alert("Block failed", err.message || "Please try again.");
    }
  };

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;
    const initRoom = async () => {
      setRoomLoading(true);
      exitedRef.current = false;
      await refreshTokenCache();
      try {
        await syncNewUserFrameForSession();
        const levelData = await syncUserLevelForSession();
        loadMyVipAssets(levelData?.xp?.totalXp)
          .then((vip) => { if (!cancelled) setMyVipAssets(vip); })
          .catch(() => {});
        let session;
        if (isRandomParty) {
          session = await enterRandomPartySession();
        } else if (roomIdParam) {
          session = await enterRoomSession(String(roomIdParam));
        } else {
          throw new Error("Room id is required.");
        }
        if (cancelled) return;
        setRoomId(session.roomId);
        roomIdRef.current = session.roomId;
        setRoomInfo(session.room);
        const initialSeatNumber = session.reservedSeatNumber ?? null;
        if (initialSeatNumber) {
          mySeatNumberRef.current = initialSeatNumber;
          setMySeatNumber(initialSeatNumber);
          const enrichedSeats = await enrichSeatsWithMyProfile(
            session.seats,
            initialSeatNumber
          );
          setSeats(
            reconcileSeatAssignments(enrichedSeats, {
              onlineUsers: session.onlineUsers,
              myUserId,
              mySeatNumber: initialSeatNumber,
            })
          );
        } else {
          setSeats(
            reconcileSeatAssignments(session.seats, {
              onlineUsers: session.onlineUsers,
              myUserId,
              mySeatNumber: null,
            })
          );
        }
        setOnlineUsers(session.onlineUsers);
        setOnlineCount(session.onlineCount);
        // Chat is session-local: start with a clean screen on every entry
        // instead of replaying the room's persisted message history.
        sessionMessageBaselineRef.current = session.messages.length;
        setMessages([]);

        // Deferred reconcile — fetch a fresh room snapshot a few seconds after
        // entry so any ghost/stale seat users the backend cleaned up are removed.
        setTimeout(async () => {
          if (cancelled) return;
          try {
            const freshState = await getRoomState(String(session.roomId));
            if (cancelled) return;
            const freshOnline = parseOnlineUsers(freshState, null);
            const freshSeats = parseSeats(freshState?.seats, freshState);
            if (freshOnline.length > 0) {
              setOnlineUsers(freshOnline);
              setOnlineCount(freshOnline.length);
            }
            setSeats((prev) =>
              reconcileSeatAssignments(freshSeats, {
                onlineUsers: freshOnline.length > 0 ? freshOnline : null,
                myUserId,
                mySeatNumber: mySeatNumberRef.current,
              })
            );
          } catch {
            // Non-critical — ignore failures
          }
        }, 5000);

        setVoiceListenStatus("connecting");
        setIsSpeakerMuted(false);
        agoraVoice.toggleRemoteMute(false);

        const connectRoomAudio = async (attempt = 1) => {
          try {
            await partyVoice.joinAsListener(String(session.roomId));
            if (!cancelled) {
              setVoiceListenStatus("ready");
              agoraVoice.toggleRemoteMute(false);
            }
          } catch (voiceErr) {
            if (cancelled) return;
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 900));
              return connectRoomAudio(attempt + 1);
            }
            setVoiceListenStatus("failed");
            const msg = voiceErr?.message ?? "Could not connect to room audio.";
            if (__DEV__) {
              console.warn("[voice-party] joinAsListener failed:", msg);
            }
            Alert.alert(
              "Voice audio unavailable",
              `${msg}\n\nYou can still chat in the room. Tap Reconnect to try audio again, or Take Mic to speak.`,
              [
                {
                  text: "Reconnect",
                  onPress: async () => {
                    setVoiceListenStatus("connecting");
                    try {
                      await partyVoice.reconnectAsListener(String(session.roomId));
                      setVoiceListenStatus("ready");
                      agoraVoice.toggleRemoteMute(false);
                      setIsSpeakerMuted(false);
                    } catch (retryErr) {
                      setVoiceListenStatus("failed");
                      Alert.alert(
                        "Reconnect failed",
                        retryErr?.message ?? "Could not reconnect room audio."
                      );
                    }
                  },
                },
                { text: "OK", style: "cancel" },
              ]
            );
          }
        };

        await connectRoomAudio();
      } catch (err) {
        if (!cancelled) {
          Alert.alert(
            isRandomParty
              ? "Could not join party room"
              : "Could not join room",
            err?.message || "Please try again."
          );
          router.back();
        }
      } finally {
        if (!cancelled) setRoomLoading(false);
      }
    };
    initRoom();
    return () => {
      cancelled = true;
      const activeRoomId = roomIdRef.current;
      if (activeRoomId && !exitedRef.current) {
        exitedRef.current = true;
        const seatToLeave = onMicRef.current ? mySeatNumberRef.current : null;
        const cleanup = async () => {
          if (seatToLeave) {
            await partyVoice.leaveMic(String(activeRoomId), seatToLeave).catch(() => {});
          }
          await partyVoice.teardownVoice().catch(() => {});
          await exitRoomSession(String(activeRoomId)).catch(() => {});
        };
        cleanup();
      } else {
        partyVoice.teardownVoice().catch(() => {});
      }
    };
  }, [roomIdParam, isRandomParty, router]);

  useEffect(() => {
    if (!roomId) return undefined;
    return partyVoice.subscribeVoiceSessionStatus((diag) => {
      setVoiceDiagnostics(diag);
      if (__DEV__ && diag?.lastError) {
        console.warn("[voice-party] Agora:", diag.lastError.message);
      }
    });
  }, [roomId]);

  useEffect(() => {
    messageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    loadConversations()
      .then((conversations) => {
        const unread = conversations.reduce((sum, chat) => sum + (chat.unread || 0), 0);
        setChatUnreadCount(unread);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 150);
    return () => clearTimeout(timer);
  }, [roomId, messages.length]);

  const revealGiftAnimation = useCallback((payload, fallbackGift) => {
    const animated = normalizeGiftAnimation(payload, fallbackGift);
    setGiftPopup({
      gift: animated,
      qty: animated.quantity,
    });
    setTimeout(() => setGiftPopup(null), 2800);
  }, []);

  useEffect(() => {
    if (!roomId) return undefined;
    const appendChatMessage = (payload) => {
      setMessages((prev) => upsertChatMessage(prev, payload));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const unsubChat = wsService.onRoomChat(String(roomId), appendChatMessage);
    const unsubChatSummary = wsService.onRoomChatSummary(String(roomId), async (summary) => {
      const remoteCount = summary?.messageCount;
      const baseline = sessionMessageBaselineRef.current;
      if (remoteCount == null || baseline + messageCountRef.current >= remoteCount) return;
      try {
        const data = await getRoomChatMessages(String(roomId));
        // Only keep messages sent since this session started — never replay
        // pre-entry history back onto the cleaned screen.
        setMessages(normalizeChatMessages(data).slice(baseline));
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      } catch {
        // logged in partyApi
      }
    });
    const unsubUi = wsService.onRoomUiState(String(roomId), (payload) => {
      const hasPresenceSnapshot =
        Array.isArray(payload?.participants) ||
        Array.isArray(payload?.onlineUsers) ||
        Array.isArray(payload?.members) ||
        Array.isArray(payload?.users);
      const users = parseOnlineUsers(payload, null);
      if (hasPresenceSnapshot) {
        setOnlineUsers(users);
        setOnlineCount(users.length);
      }

      if (payload?.seats) {
        const nextSeats = parseSeats(payload.seats, payload);
        if (mySeatNumber) {
          enrichSeatsWithMyProfile(nextSeats, mySeatNumber).then((enriched) =>
            setSeats(
              reconcileSeatAssignments(enriched, {
                onlineUsers: hasPresenceSnapshot ? users : null,
                myUserId,
                mySeatNumber,
              })
            )
          );
        } else {
          setSeats(
            reconcileSeatAssignments(nextSeats, {
              onlineUsers: hasPresenceSnapshot ? users : null,
              myUserId,
              mySeatNumber,
            })
          );
        }
      }
    });
    const unsubSpeaking = wsService.onRoomSpeaking(String(roomId), (payload) => {
      const speakerId = payload.userId;
      if (!speakerId) return;
      const isSpeaking = Boolean(payload.isSpeaking);
      setOnlineUsers((prev) =>
        prev.map((u) => ({
          ...u,
          isSpeaking: u.id === speakerId ? isSpeaking : u.isSpeaking,
        }))
      );
      setSeats((prev) =>
        prev.map((seat) => {
          if (!seat.user || String(seat.user.id) !== String(speakerId)) return seat;
          return { ...seat, user: { ...seat.user, active: isSpeaking } };
        })
      );
      setSpeakingUserIds((prev) => {
        const next = new Set(prev);
        if (isSpeaking) {
          next.add(String(speakerId));
        } else {
          next.delete(String(speakerId));
        }
        return next;
      });
    });
    const unsubGiftAnimation = wsService.onRoomGiftAnimation(String(roomId), (payload) => {
      revealGiftAnimation(payload);
      const senderName =
        payload?.senderName ?? payload?.sender ?? "Someone";
      const giftName = payload?.giftName ?? payload?.name ?? "a gift";
      const qty = Math.max(1, Number(payload?.quantity ?? 1));
      const giftText = `sent ${payload?.emoji ?? "🎁"} ${giftName}${qty > 1 ? ` ×${qty}` : ""}`;
      const normalized = normalizeChatMessage({
        id: payload?.id ?? `gift-ws-${Date.now()}`,
        message: `${senderName} ${giftText}`,
        senderName,
        text: `${senderName} ${giftText}`,
        isGift: true,
      });
      if (!normalized.text) return;
      setMessages((prev) => {
        const exists = prev.some((m) => String(m.id) === String(normalized.id));
        if (exists) return prev;
        return [...prev, normalized];
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => {
      unsubChat();
      unsubChatSummary();
      unsubUi();
      unsubSpeaking();
      unsubGiftAnimation();
    };
  }, [roomId, mySeatNumber, myUserId, revealGiftAnimation]);

  const handleExitRoom = useCallback(async () => {
    setShowPowerMenu(false);
    if (!roomId || exitedRef.current) {
      router.back();
      return;
    }
    exitedRef.current = true;
    try {
      if (onMic && mySeatNumber) {
        await partyVoice.leaveMic(String(roomId), mySeatNumber).catch(() => {});
      }
      await partyVoice.teardownVoice();
      await exitRoomSession(String(roomId));
    } catch {
      // APIs logged in partyApi
    }
    onMicRef.current = false;
    mySeatNumberRef.current = null;
    setOnMic(false);
    setMySeatNumber(null);
    router.back();
  }, [roomId, onMic, mySeatNumber, router]);

  // Intercept Android hardware back button — close any open chat input /
  // pickers first; only exit the room when none of those are open.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (showTagPicker) {
        setShowTagPicker(false);
        return true;
      }
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
        return true;
      }
      if (showChatInput) {
        setShowChatInput(false);
        Keyboard.dismiss();
        return true;
      }
      handleExitRoom();
      return true; // prevent default navigation
    });
    return () => sub.remove();
  }, [handleExitRoom, showChatInput, showEmojiPicker, showTagPicker]);

  // Listen Rewards — tick every second while in the room.
  // Component unmounts on exit so counters reset automatically.
  useEffect(() => {
    const interval = setInterval(() => {
      if (exitedRef.current) return;
      listenSecondsRef.current += 1;
      const sec = listenSecondsRef.current;
      setListenSeconds(sec);
      setRewardStates((prev) =>
        prev.map((r, i) => {
          if (!r.rewardImg && sec >= LISTEN_THRESHOLDS[i]) {
            const idx = Math.floor(Math.random() * LISTEN_GIFT_POOL.length);
            return { ...r, rewardImg: LISTEN_GIFT_POOL[idx] };
          }
          return r;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mic-seat heartbeat — fires every 25 s while user is on a seat.
  // Backend removes the seat automatically after 30 s of silence.
  // Uses WebSocket publish when connected, REST POST as fallback.
  useEffect(() => {
    if (!onMic || !mySeatNumber || !roomId) return;

    const ping = async () => {
      try {
        if (wsService.connected) {
          wsService.sendSeatHeartbeat(String(roomId));
        } else {
          await postSeatHeartbeat(String(roomId));
        }
      } catch {
        // Non-critical — backend will evict after the timeout automatically
      }
    };

    ping(); // send immediately when seat is taken
    const interval = setInterval(ping, 25_000);
    return () => clearInterval(interval);
  }, [onMic, mySeatNumber, roomId]);

  const handleTakeMic = async () => {
    if (!roomId || voiceConnecting) return;

    if (onMic && mySeatNumber) {
      setVoiceConnecting(true);
      try {
        await partyVoice.leaveMic(String(roomId), mySeatNumber);
        onMicRef.current = false;
        mySeatNumberRef.current = null;
        setOnMic(false);
        setMySeatNumber(null);
        setIsMicMuted(true);
        const state = await getRoomState(String(roomId));
        setSeats(
          reconcileSeatAssignments(parseSeats(state?.seats, state), {
            onlineUsers,
            myUserId,
            mySeatNumber: null,
          })
        );
      } catch (err) {
        Alert.alert("Leave mic failed", err?.message || "Please try again.");
      } finally {
        setVoiceConnecting(false);
      }
      return;
    }

    // Build candidate list: prefer current seat, then all empty unlocked seats
    // in order. We refresh from the server first so the list is up-to-date.
    setVoiceConnecting(true);
    try {
      const freshState = await getRoomState(String(roomId));
      const freshSeats = parseSeats(freshState?.seats, freshState);
      setSeats(
        reconcileSeatAssignments(freshSeats, { onlineUsers, myUserId, mySeatNumber })
      );

      const emptySeats = freshSeats
        .filter((s) => !s.user && !s.locked)
        .map((s) => s.id);

      // If we already hold a seat number, try that first
      const candidates = mySeatNumber
        ? [mySeatNumber, ...emptySeats.filter((id) => id !== mySeatNumber)]
        : emptySeats;

      if (candidates.length === 0) {
        Alert.alert("No seats available", "All microphone seats are currently full.");
        setVoiceConnecting(false);
        return;
      }

      let targetSeat = null;
      let lastError = null;

      // Try each candidate seat until one succeeds
      for (const seatId of candidates) {
        try {
          await partyVoice.takeMic(String(roomId), seatId);
          targetSeat = seatId;
          break; // success — stop trying
        } catch (err) {
          const status = err?.status ?? err?.response?.status;
          const body = err?.response?.data ?? err?.responseData ?? {};
          const isOccupied =
            status === 409 ||
            String(body?.status).toUpperCase() === "OCCUPIED" ||
            String(body?.message).toLowerCase().includes("occupied") ||
            String(err?.message).toLowerCase().includes("occupied");

          if (isOccupied) {
            // Mark this seat as taken locally so UI updates immediately
            setSeats((prev) =>
              prev.map((s) =>
                s.id === seatId && !s.user
                  ? { ...s, user: { id: null, name: "…", active: false, muted: false } }
                  : s
              )
            );
            lastError = err;
            continue; // try next seat
          }
          // Non-409 error — stop and surface it
          throw err;
        }
      }

      if (targetSeat === null) {
        Alert.alert("No seats available", "All microphone seats are currently full. Please try again.");
        setVoiceConnecting(false);
        return;
      }

      onMicRef.current = true;
      mySeatNumberRef.current = targetSeat;
      setOnMic(true);
      setMySeatNumber(targetSeat);
      setIsMicMuted(false);
      setVoiceListenStatus("ready");
      if (isSpeakerMuted) {
        agoraVoice.toggleRemoteMute(true);
      }

      const localUser = await getUser();
      const localUserId = await getAppUserId().catch(() => null);
      const localAvatar =
        resolveProfileAvatarUri(localUser) ??
        localUser?.avatarUrl ??
        localUser?.avatar ??
        null;
      const localName = localUser?.name ?? localUser?.username ?? "User";
      setSeats((prev) =>
        prev.map((seat) => {
          if (seat.id !== targetSeat) return seat;
          const existing = seat.user ?? {};
          return {
            ...seat,
            user: {
              ...existing,
              id: existing.id ?? localUserId,
              name:
                existing.name && existing.name !== "Guest"
                  ? existing.name
                  : (localName ?? existing.name ?? "User"),
              username: existing.username ?? localUser?.username ?? localName,
              avatar: existing.avatar ?? localAvatar,
              hasNewUserFrame: Boolean(localUser?.hasNewUserFrame),
              newUserFrameUrl: localUser?.newUserFrameUrl ?? null,
              active: true,
              muted: false,
            },
          };
        })
      );

      const state = await getRoomState(String(roomId));
      const nextSeats = await enrichSeatsWithMyProfile(
        parseSeats(state?.seats, state),
        targetSeat
      );
      setSeats(
        reconcileSeatAssignments(nextSeats, {
          onlineUsers,
          myUserId: localUserId ?? myUserId,
          mySeatNumber: targetSeat,
        })
      );
      setOnlineCount(state?.onlineCount ?? onlineCount);
    } catch (err) {
      const msg = err?.message ?? "Could not start voice.";
      if (msg.toLowerCase().includes("auth token") || msg.toLowerCase().includes("authentication token")) {
        Alert.alert("Login required", "Please log in again to use voice chat.");
      } else if (msg.includes("permission")) {
        Alert.alert("Microphone required", "Please allow microphone access to speak in the room.");
      } else {
        Alert.alert("Take mic failed", msg);
      }
    } finally {
      setVoiceConnecting(false);
    }
  };

  const handleToggleSpeaker = () => {
    const nextMuted = !isSpeakerMuted;
    setIsSpeakerMuted(nextMuted);
    agoraVoice.toggleRemoteMute(nextMuted);
  };

  const handleToggleMic = async () => {
    if (!roomId || !onMic || !mySeatNumber || voiceConnecting) return;

    const nextMuted = !isMicMuted;
    setVoiceConnecting(true);
    try {
      await partyVoice.toggleMicMute(String(roomId), mySeatNumber, nextMuted);
      setIsMicMuted(nextMuted);
    } catch (err) {
      Alert.alert("Mic mute failed", err?.message ?? "Please try again.");
    } finally {
      setVoiceConnecting(false);
    }
  };

  const [shareTab, setShareTab] = useState("Recently");
  const scrollRef = useRef(null);
  const messageCountRef = useRef(0);
  // Total historical message count on the server at the moment this session
  // entered the room — the chat catch-up sync below uses this so it only ever
  // re-syncs messages sent DURING this session, never replays pre-entry history.
  const sessionMessageBaselineRef = useRef(0);

  const shareTabs = ["Recently", "Friends", "Followers", "Room Followers"];

  const sharePlatforms = [
    { label: "Moment",    bg: "#7c4dff", icon: "🪐" },
    { label: "Facebook",  bg: "#1877f2", icon: "f" },
    { label: "Instagram", bg: "#e1306c", icon: "📸" },
    { label: "WhatsApp",  bg: "#25d366", icon: "💬" },
  ];

  const handleReportRoomSubmit = async (reason) => {
    try {
      await reportUser(hostId, reason);
      setShowReportModal(false);
      Alert.alert("Reported", "This room has been reported. Thank you.");
    } catch (e) {
      throw new Error(e?.message || "Could not submit report. Please try again.");
    }
  };

  const moreMenuItems = [
    {
      icon: <MessageCircle size={22} color="#a78bfa" />,
      label: "Feedback",
      onPress: () => {
        setShowMoreMenu(false);
        Alert.alert("Feedback", "Thank you for your feedback!");
      },
    },
    {
      icon: <AlertCircle size={22} color="#a78bfa" />,
      label: "Report",
      onPress: () => {
        setShowMoreMenu(false);
        if (!hostId) {
          Alert.alert("Report", "Could not identify room host.");
          return;
        }
        setShowReportModal(true);
      },
    },
    ...(!isHostSelf
      ? [{
          icon: <Ban size={22} color="#a78bfa" />,
          label: "Block",
          onPress: handleBlockHost,
        }]
      : []),
    {
      icon: <Crown size={22} color="#a78bfa" />,
      label: "Room Premium",
      onPress: () => {
        setShowMoreMenu(false);
        Alert.alert("Room Premium", "Upgrade to Room Premium!");
      },
    },
    {
      icon: <Sparkles size={22} color="#a78bfa" />,
      label: "Effect Settings",
      onPress: () => {
        setShowMoreMenu(false);
        Alert.alert("Effect Settings", "Effect settings coming soon.");
      },
    },
  ];

  const handleOpenChatTab = () => {
    router.push("/(tabs)/chat");
  };

  const handleOpenPartyChat = () => {
    setShowChatInput(true);
  };

  const handleOpenMediaPicker = () => {
    setShowChatInput(true);
    setShowEmojiPicker(true);
  };

  const appendOutgoingMessage = async (text, extra = {}) => {
    const user = await getUser();
    const localMsg = createLocalChatMessage({
      text,
      user: user?.name ?? user?.username ?? user?.nickname ?? "You",
      avatar: user?.avatarUrl ?? user?.profilePicUrl ?? user?.avatar ?? null,
      extra: { level: user?.level ?? 1, ...extra },
    });
    setMessages((prev) => [...prev, localMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return localMsg;
  };

  const sendPickerMessage = async (content) => {
    const text = String(content ?? "").trim();
    if (!text || !roomId) return;
    await appendOutgoingMessage(text);
    try {
      await wsService.sendRoomMessage(String(roomId), text);
    } catch (err) {
      Alert.alert("Send failed", err?.message || "WebSocket not connected.");
    }
  };

  const handleEmojiPick = (emoji) => {
    setShowChatInput(true);
    setInputText((prev) => prev + emoji);
  };

  const handleStickerPick = (sticker) => {
    setShowChatInput(true);
    if (sticker.image) {
      sendPickerMessage(sticker.image);
      setShowEmojiPicker(false);
    } else if (sticker.emoji) {
      setInputText((prev) => prev + sticker.emoji);
    }
  };

  const handleGifPick = (gif) => {
    setShowChatInput(true);
    sendPickerMessage(gif.url);
    setShowEmojiPicker(false);
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !roomId) return;

    setInputText("");
    setTaggedUser(null);
    setShowChatInput(false);
    Keyboard.dismiss();
    await appendOutgoingMessage(text);

    try {
      await wsService.sendRoomMessage(String(roomId), text);
    } catch (err) {
      Alert.alert("Send failed", err?.message || "WebSocket not connected.");
    }
  };

  // Build a deduplicated list of all people currently in the room
  // (mic seat users + audience), excluding the current user.
  const roomMembersList = useMemo(() => {
    const seatUsers = seats
      .filter((s) => s.user && s.user.id != null)
      .map((s) => ({
        id: String(s.user.id),
        name: s.user.name ?? s.user.username ?? "User",
        username: s.user.username ?? s.user.name ?? "User",
        avatar: s.user.avatar ?? s.user.avatarUrl ?? null,
        onMic: true,
      }));
    const audienceUsers = onlineUsers
      .filter((u) => u.id != null)
      .map((u) => ({
        id: String(u.id),
        name: u.name ?? u.username ?? "User",
        username: u.username ?? u.name ?? "User",
        avatar: u.avatar ?? u.avatarUrl ?? null,
        onMic: false,
      }));
    const seen = new Set();
    return [...seatUsers, ...audienceUsers].filter((u) => {
      if (seen.has(u.id) || String(u.id) === String(myUserId)) return false;
      seen.add(u.id);
      return true;
    });
  }, [seats, onlineUsers, myUserId]);

  const handleTagUser = (member) => {
    setTaggedUser(member);
    const mention = `@${member.username ?? member.name} `;
    // Replace any existing leading @mention or prepend fresh one
    setInputText((prev) => {
      const stripped = prev.replace(/^@\S+\s*/, "");
      return mention + stripped;
    });
    setShowTagPicker(false);
    setShowChatInput(true);
  };

  const openGiftPurchase = (gift) => {
    setPurchaseGift(gift);
  };

  const handleBuyGift = async () => {
    if (!purchaseGift || buyingGiftRef.current || catalogLoading) return;
    const giftCode = String(purchaseGift.giftCode ?? purchaseGift.id ?? "");
    if (!giftCode) {
      Alert.alert("Purchase failed", "This gift is missing a code.");
      return;
    }

    if (purchaseGift.vipLocked) {
      Alert.alert("VIP gift", "Only VIP users can buy this gift.");
      return;
    }

    const price = Math.max(0, Number(purchaseGift.price ?? 0));
    if (price > 0 && walletDiamonds < price) {
      Alert.alert(
        "Not enough diamonds",
        `You need 💎 ${formatGiftPrice(price)} but only have 💎 ${formatGiftPrice(walletDiamonds)}. Recharge to continue.`
      );
      return;
    }

    buyingGiftRef.current = true;
    setCatalogLoading(true);
    try {
      const result = await buyGiftToBackpack({
        giftCode,
        quantity: 1,
      });
      if (result?.wallet) {
        applyWalletFromSources({ walletData: result.wallet });
      } else {
        await refreshWalletBalance();
      }

      let inventory = await loadGiftInventory();
      if (!findInventoryGift(inventory, purchaseGift)) {
        const boughtRow = parseBuyResultInventory(result, purchaseGift, 1);
        inventory = adjustInventoryQty(
          inventory,
          boughtRow ?? purchaseGift,
          boughtRow?.qty ?? 1
        );
      }

      setBackpackGifts(inventory);
      const boughtEntry = findInventoryGift(inventory, purchaseGift);
      if (boughtEntry) setSelectedGift(boughtEntry);
      setCatalogRefreshKey((key) => key + 1);
      const bought = purchaseGift;
      setPurchaseGift(null);
      setBackpackMainTab("Backpack");
      setBackpackSubTab("Gift");
      Alert.alert(
        "Purchased",
        `${bought.emoji} ${bought.name} was added to your backpack.`
      );
    } catch (err) {
      Alert.alert("Purchase failed", err?.message || "Could not buy this gift.");
    } finally {
      buyingGiftRef.current = false;
      setCatalogLoading(false);
    }
  };

  const handleSendBackpackGift = async () => {
    if (!selectedGift) {
      Alert.alert("Select a gift", "Choose a gift from your backpack first.");
      return;
    }

    const owned = findInventoryGift(backpackGifts, selectedGift);
    const qty = Math.max(1, Number(giftQty) || 1);

    const ownedQty = Math.max(0, Number(owned?.qty ?? 0));
    const hasBackpackStock = ownedQty >= qty;
    const totalCost = Math.max(0, Number(selectedGift.price ?? 0)) * qty;

    if (!hasBackpackStock && totalCost > 0 && walletDiamonds < totalCost) {
      Alert.alert(
        "Not enough diamonds",
        `You need 💎 ${formatGiftPrice(totalCost)} but only have 💎 ${formatGiftPrice(walletDiamonds)}.`
      );
      return;
    }

    const receiverId = giftReceiverId ?? hostId;
    if (!receiverId) {
      Alert.alert(
        "Select a person",
        "Tap the name next to ❤️ to choose who receives this gift."
      );
      openGiftReceiverPicker();
      return;
    }

    try {
      const user = await getUser();
      const senderName = user?.name ?? user?.username ?? user?.nickname ?? "You";
      const senderAvatar = user?.avatarUrl ?? user?.profilePicUrl ?? user?.avatar ?? null;
      const giftText = `sent ${selectedGift.emoji} ${selectedGift.name} ×${qty}`;

      const result = await sendPartyRoomGift({
        roomId,
        gift: owned ?? selectedGift,
        receiverId,
        quantity: qty,
        senderName,
        backpackQty: ownedQty,
      });

      const optimisticInventory = hasBackpackStock
        ? adjustInventoryQty(backpackGifts, owned ?? selectedGift, -qty)
        : backpackGifts;

      let inventory = await loadGiftInventory();
      inventory = reconcileInventory(inventory, optimisticInventory, {
        preferLowerQty: hasBackpackStock,
      });
      setBackpackGifts(inventory);

      const remaining = findInventoryGift(inventory, selectedGift);
      setSelectedGift(remaining?.qty > 0 ? remaining : null);
      await refreshWalletBalance();

      revealGiftAnimation(result, selectedGift);

      const localMsg = createLocalChatMessage({
        text: giftText,
        user: senderName,
        avatar: senderAvatar,
        extra: {
          diamonds: Number(selectedGift.price ?? 0) * qty,
          isGift: true,
          pending: false,
        },
      });

      setMessages((prev) => [...prev, localMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      if (roomId) {
        try {
          wsService.sendRoomMessage(String(roomId), giftText);
        } catch {
          // Chat message already added locally.
        }
      }

      setSelectedGift(null);
      setGiftQty(1);
    } catch (err) {
      Alert.alert("Send failed", err?.message || "Could not send gift.");
    }
  };

  const displayRandomGifts = giftCatalog.random;
  const displayGiftItems = giftCatalog.gift;
  const displayPkGifts = giftCatalog.pk;
  const displaySpecialGifts = giftCatalog.special;
  const displayVipGifts = giftCatalog.vip;
  const displayActivityEvents = Object.keys(giftCatalog.activityByEvent);
  const displayActivityGifts = giftCatalog.activityByEvent[activityEvent] ?? [];
  const displayRelationshipVideos = giftCatalog.relationship.map((gift) => ({
    ...gift,
    videoUrl: gift.videoUrl,
    uri: gift.videoUrl,
  }));
  const selectedGiftRecipient = useMemo(() => {
    if (!giftReceiverId) return null;
    const found = giftRecipientOptions.find(
      (person) => String(person.id) === String(giftReceiverId)
    );
    if (found) return found;
    return {
      id: String(giftReceiverId),
      name: isSameUser(giftReceiverId, hostId) ? (roomInfo?.name ?? "Host") : "User",
      avatar: isSameUser(giftReceiverId, hostId) ? (roomInfo?.profileImageUrl ?? null) : null,
      subtitle: isSameUser(giftReceiverId, hostId) ? "Host" : null,
    };
  }, [giftReceiverId, giftRecipientOptions, hostId, roomInfo]);

  const giftReceiverName = selectedGiftRecipient?.name ?? "Select person";
  const giftSendBarBottom = Math.max(22, idleBottom + 6);

  const renderGiftRecipientAvatar = (person, sizeStyle = styles.bpSendAvatar) => {
    if (person?.avatar) {
      return <Image source={{ uri: person.avatar }} style={sizeStyle} />;
    }
    return (
      <View style={[sizeStyle, styles.chatAvatarPlaceholder]}>
        <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>
          {person?.name?.[0]?.toUpperCase() ?? "?"}
        </Text>
      </View>
    );
  };

  const trySelectGiftRecipientFromUser = (userLike) => {
    const userId = resolveRecipientUserId(userLike);
    if (!userId || isSameUser(userId, myUserId)) return false;
    giftReceiverTouchedRef.current = true;
    setGiftReceiverId(userId);
    return true;
  };

  const resolveRoomUserAvatarSource = (userLike) => {
    const source = resolveProfileAvatarSource({
      avatarId: userLike?.avatarId,
      avatar: userLike?.avatar,
      avatarUrl: userLike?.avatarUrl,
      profilePicUrl: userLike?.profilePicUrl,
      profileImageUrl: userLike?.profileImageUrl,
      profileImage: userLike?.profileImage,
    });
    if (!source) return null;
    return source?.uri ? resolveImageSource(source.uri) : source;
  };

  const closeProfilePopup = () => {
    setProfilePopupUser(null);
    setProfilePopupAvatarSource(null);
    setProfilePopupLoading(false);
    setProfilePopupFollowing(false);
    setProfileFollowLoading(false);
  };

  const openUserProfile = async (userLike) => {
    const userId = resolveRecipientUserId(userLike);
    if (!userId) {
      Alert.alert("Profile unavailable", "User information is not available yet.");
      return;
    }

    const lockedAvatarSource = resolveRoomUserAvatarSource(userLike);
    const initial = {
      id: userId,
      name: userLike?.name ?? "User",
      username: userLike?.username ?? userLike?.name,
    };
    setProfilePopupAvatarSource(lockedAvatarSource);
    setProfilePopupUser(initial);
    setProfilePopupLoading(true);
    setProfilePopupFollowing(false);

    try {
      if (!isSameUser(userId, myUserId)) {
        const status = await loadRelationshipStatus(userId).catch(() => ({ following: false }));
        setProfilePopupFollowing(Boolean(status?.following));
      }

      if (!isSameUser(userId, myUserId)) {
        try {
          const detail = await loadUserDetail(userId);
          setProfilePopupUser((prev) => ({
            ...(prev ?? initial),
            id: userId,
            name: detail?.name ?? detail?.displayName ?? prev?.name ?? initial.name,
            username: detail?.username ?? detail?.handle ?? prev?.username ?? initial.username,
          }));
          if (!lockedAvatarSource) {
            setProfilePopupAvatarSource(resolveRoomUserAvatarSource(detail));
          }
        } catch {
          // keep initial profile from room state
        }
      }
    } finally {
      setProfilePopupLoading(false);
    }
  };

  const handleProfileFollowToggle = async () => {
    const targetId = profilePopupUser?.id;
    if (!targetId || isSameUser(targetId, myUserId) || profileFollowLoading) return;

    setProfileFollowLoading(true);
    try {
      if (profilePopupFollowing) {
        await unfollowUser(targetId);
        setProfilePopupFollowing(false);
      } else {
        await followUser(targetId);
        setProfilePopupFollowing(true);
      }
    } catch (err) {
      Alert.alert(
        profilePopupFollowing ? "Unfollow failed" : "Follow failed",
        err?.message || "Please try again."
      );
    } finally {
      setProfileFollowLoading(false);
    }
  };

  const handleUserAvatarPress = (userLike) => {
    if (!userLike) return;
    openUserProfile(userLike);
  };

  const handleSeatPress = async (seat) => {
    if (seat?.user) {
      handleUserAvatarPress(seat.user);
      return;
    }
    if (!seat?.locked) {
      let micGranted = false;
      try {
        if (Platform.OS === "android") {
          micGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
        } else {
          const { status } = await Audio.getPermissionsAsync();
          micGranted = status === "granted";
        }
      } catch {
        micGranted = false;
      }

      if (micGranted) {
        setSeatActionSheet({ seatId: seat.id });
      } else {
        setMicPermWarning(seat.id);
      }
    }
  };

  const handleTakeSeat = async (targetSeatId) => {
    if (!roomId || voiceConnecting || seatActionLoading) return;
    setSeatActionLoading(true);
    setSeatActionSheet(null);
    try {
      // Leave current seat first if already on mic
      if (onMic && mySeatNumber) {
        await partyVoice.leaveMic(String(roomId), mySeatNumber).catch(() => {});
        onMicRef.current = false;
        mySeatNumberRef.current = null;
        setOnMic(false);
        setMySeatNumber(null);
      }
      setVoiceConnecting(true);
      await partyVoice.takeMic(String(roomId), targetSeatId);
      onMicRef.current = true;
      mySeatNumberRef.current = targetSeatId;
      setOnMic(true);
      setMySeatNumber(targetSeatId);
      setIsMicMuted(false);
      setVoiceListenStatus("ready");
      const freshState = await getRoomState(String(roomId));
      const freshSeats = freshState?.seats ? parseSeats(freshState.seats, freshState) : seats;
      const enriched = await enrichSeatsWithMyProfile(freshSeats, targetSeatId);
      setSeats(reconcileSeatAssignments(enriched, { onlineUsers, myUserId, mySeatNumber: targetSeatId }));
    } catch (err) {
      Alert.alert("Take seat failed", err?.message || "Could not take that seat. Please try again.");
    } finally {
      setSeatActionLoading(false);
      setVoiceConnecting(false);
    }
  };

  const handleLockSeat = async (targetSeatId) => {
    if (!roomId || seatActionLoading) return;
    setSeatActionLoading(true);
    setSeatActionSheet(null);
    try {
      await lockSeat(String(roomId), targetSeatId);
      // Optimistically lock the seat in local state; WS will confirm
      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === targetSeatId ? { ...seat, locked: true, user: null } : seat
        )
      );
    } catch (err) {
      Alert.alert("Lock seat failed", err?.message || "Could not lock that seat. Please try again.");
    } finally {
      setSeatActionLoading(false);
    }
  };

  const handleOnlineUserPress = (user) => {
    handleUserAvatarPress(user);
  };

  const renderRoomUserAvatar = (
    user,
    imageStyle,
    placeholderStyle,
    initialStyle,
    frameConfig = SEAT_FRAME_CONFIG
  ) => {
    const resolvedStyle = Array.isArray(imageStyle) ? imageStyle[0] : imageStyle;
    const size = resolvedStyle?.width ?? resolvedStyle?.height ?? 48;
    // Merge in fetched frame data so WebSocket seat resets don't lose it.
    const userId = user?.id != null ? String(user.id) : null;
    const fetched = userId ? (userFrameData[userId] ?? {}) : {};
    const userWithFrame = user
      ? { ...user, hasNewUserFrame: fetched.hasNewUserFrame ?? user.hasNewUserFrame, newUserFrameUrl: fetched.newUserFrameUrl ?? user.newUserFrameUrl }
      : user;
    const imageSource = resolveRoomUserAvatarSource(userWithFrame);
    // Mic seats show the same circular VIP profile-frame ring used everywhere
    // else in the app — the entry frame (a wide horizontal banner asset) is
    // only for the one-time "entered the room" moment, not a permanent seat
    // decoration. Self uses the already-fetched myVipAssets; other seats use
    // the seat's own ui-assets fetch (fetched.vipProfileFrameUrl) — the
    // backend embeds this only when that user's own XP clears the threshold.
    const isSelf = userId != null && myUserId != null && userId === String(myUserId);
    const selfVipProfileFrame = isSelf && myVipAssets.unlocked ? myVipAssets.profileFrame : null;
    const otherUserVipProfileFrame =
      !isSelf && fetched.vipProfileFrameUrl ? { uri: fetched.vipProfileFrameUrl } : null;
    const isVipProfileFrame = Boolean(selfVipProfileFrame || otherUserVipProfileFrame);
    const frameSource = selfVipProfileFrame ?? otherUserVipProfileFrame ?? resolveNewUserFrameSource(userWithFrame);
    const hasFrame = Boolean(frameSource);
    const activeFrameConfig = isVipProfileFrame ? VIP_PROFILE_FRAME_LAYOUT : frameConfig;

    return (
      <ProfileAvatarWithFrame
        user={userWithFrame}
        avatarSource={imageSource}
        frameSource={frameSource}
        size={typeof size === "number" ? size : 48}
        frameScale={hasFrame ? activeFrameConfig.frameScale : NEW_USER_FRAME_LAYOUT.frameScale}
        frameResizeMode={hasFrame ? activeFrameConfig.frameResizeMode : "contain"}
        frameOffsetX={hasFrame ? activeFrameConfig.frameOffsetX : 0}
        frameOffsetY={hasFrame ? activeFrameConfig.frameOffsetY : 0}
        frameBleed={hasFrame ? activeFrameConfig.frameBleed : 0}
        avatarBoost={hasFrame ? activeFrameConfig.avatarBoost : NEW_USER_FRAME_LAYOUT.avatarBoost}
        avatarOffsetY={hasFrame ? activeFrameConfig.avatarOffsetY : NEW_USER_FRAME_LAYOUT.avatarOffsetY}
        avatarStyle={imageStyle}
        placeholderStyle={placeholderStyle}
        initialStyle={initialStyle}
        placeholderInitial={userWithFrame?.name?.[0]?.toUpperCase() ?? "?"}
      />
    );
  };

  const openGiftReceiverPicker = () => {
    setShowGiftReceiverPicker(true);
  };

  const selectGiftRecipient = (id) => {
    giftReceiverTouchedRef.current = true;
    setGiftReceiverId(String(id));
    setShowGiftReceiverPicker(false);
  };

  const renderGiftRecipientPickerOverlay = () => {
    if (!showGiftReceiverPicker) return null;

    return (
      <View style={styles.giftReceiverInlineOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.giftReceiverInlineBackdrop}
          activeOpacity={1}
          onPress={() => setShowGiftReceiverPicker(false)}
        />
        <View style={styles.giftReceiverSheet}>
          <View style={styles.shareHandle} />
          <Text style={styles.giftReceiverTitle}>Send gift to</Text>
          <Text style={styles.giftReceiverSubtitle}>
            Choose who receives your gift
          </Text>
          {giftRecipientOptions.length === 0 ? (
            <View style={styles.giftRecipientEmpty}>
              <Text style={styles.giftRecipientEmptyText}>
                No one else is in the room yet. Invite friends to join, then pick
                them here.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.giftRecipientList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {giftRecipientOptions.map((person) => {
                const selected = String(giftReceiverId) === String(person.id);
                return (
                  <TouchableOpacity
                    key={person.id}
                    style={[
                      styles.giftRecipientRow,
                      selected && styles.giftRecipientRowActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => selectGiftRecipient(person.id)}
                  >
                    {renderGiftRecipientAvatar(person, styles.giftRecipientAvatar)}
                    <View style={styles.giftRecipientInfo}>
                      <Text style={styles.giftRecipientName} numberOfLines={1}>
                        {person.name}
                      </Text>
                      {person.subtitle ? (
                        <Text style={styles.giftRecipientMeta} numberOfLines={1}>
                          {person.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {selected ? (
                      <Text style={styles.giftRecipientCheck}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    );
  };

  const renderGiftSendBar = () => (
    <View style={[styles.bpSendBar, { paddingBottom: giftSendBarBottom }]}>
      {renderGiftRecipientAvatar(selectedGiftRecipient)}
      <TouchableOpacity
        style={styles.bpSendRecipient}
        activeOpacity={0.8}
        onPress={openGiftReceiverPicker}
      >
        <Text style={styles.bpSendHeart}>❤️ </Text>
        <Text style={styles.bpSendName} numberOfLines={1}>
          {giftReceiverName}
        </Text>
        <Text style={styles.bpSendChev}> ▼</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.bpSendQtyBtn}
        activeOpacity={0.8}
        onPress={() => setGiftQty((q) => (q < 99 ? q + 1 : 1))}
      >
        <Text style={styles.bpSendQtyText}>{giftQty} ▼</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.bpSendBtn}
        activeOpacity={0.8}
        onPress={handleSendBackpackGift}
      >
        <Text style={styles.bpSendBtnText}>Send</Text>
      </TouchableOpacity>
    </View>
  );

  const formatListenTime = (seconds) => {
    if (seconds < 3600) {
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      return `${m}:${s}`;
    }
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 3600 % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── VIDEO PLAYER MODAL ── */}
      <Modal
        visible={showVideoModal}
        transparent={false}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { setShowVideoModal(false); setCurrentVideo(null); }}
      >
        <View style={styles.videoPlayerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="black" />

          {/* Header */}
          <View style={styles.videoHeader}>
            <TouchableOpacity
              style={styles.videoCloseBtn}
              onPress={() => { setShowVideoModal(false); setCurrentVideo(null); }}
            >
              <Text style={styles.videoCloseBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.videoHeaderTitle} numberOfLines={1}>
              {currentVideo?.name ?? ""}
            </Text>
            <View style={{ width: 42 }} />
          </View>

          {/* Video */}
          <View style={styles.videoWrapper}>
            <VideoView
              player={videoPlayer}
              style={styles.videoPlayer}
              nativeControls
              allowsFullscreen
              contentFit="contain"
            />
          </View>
        </View>
      </Modal>

      {/* ── GIFT PURCHASE MODAL ── */}
      <Modal
        visible={Boolean(purchaseGift)}
        transparent
        animationType="fade"
        onRequestClose={() => setPurchaseGift(null)}
      >
        <TouchableOpacity
          style={styles.giftPurchaseOverlay}
          activeOpacity={1}
          onPress={() => setPurchaseGift(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.giftPurchaseBox}>
            {purchaseGift && (() => {
              const purchasePrice = Math.max(0, Number(purchaseGift.price ?? 0));
              const canAfford = purchasePrice <= 0 || walletDiamonds >= purchasePrice;
              return (
              <>
                <LinearGradient colors={["#2a0d50", "#4a1d80"]} style={styles.giftPurchaseEmojiWrap}>
                  <Text style={styles.giftPurchaseEmoji}>{purchaseGift.emoji}</Text>
                </LinearGradient>
                <Text style={styles.giftPurchaseName}>{purchaseGift.name}</Text>
                <Text style={styles.giftPurchasePrice}>
                  💎 {formatGiftPrice(purchasePrice)}
                </Text>
                <Text style={styles.giftPurchaseBalance}>
                  Your balance: 💎 {formatGiftPrice(walletDiamonds)}
                </Text>
                {!canAfford ? (
                  <Text style={styles.giftPurchaseWarning}>
                    Not enough diamonds to buy this gift.
                  </Text>
                ) : null}
                <View style={styles.giftPurchaseActions}>
                  <TouchableOpacity
                    style={styles.giftPurchaseCloseBtn}
                    activeOpacity={0.85}
                    onPress={() => setPurchaseGift(null)}
                  >
                    <Text style={styles.giftPurchaseCloseText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.giftPurchaseBuyBtn, (!canAfford || catalogLoading) && styles.giftPurchaseBuyBtnDisabled]}
                    activeOpacity={0.85}
                    disabled={!canAfford || catalogLoading}
                    onPress={handleBuyGift}
                  >
                    <LinearGradient
                      colors={canAfford && !catalogLoading ? ["#7c4dff", "#4a6cf7"] : ["#4a4a5a", "#3a3a4a"]}
                      style={styles.giftPurchaseBuyGrad}
                    >
                      <Text style={styles.giftPurchaseBuyText}>
                        {catalogLoading ? "Buying..." : "Buy"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── GIFT SEND POPUP ── */}
      <Modal visible={Boolean(giftPopup)} transparent animationType="fade">
        <View style={styles.giftPopupOverlay} pointerEvents="none">
          <View style={styles.giftPopupCard}>
            {giftPopup?.gift?.imageUrl ? (
              <ExpoImage
                source={resolveImageSource(giftPopup.gift.imageUrl)}
                style={styles.giftPopupImage}
                contentFit="contain"
              />
            ) : (
              <Text style={styles.giftPopupEmoji}>{giftPopup?.gift?.emoji}</Text>
            )}
            <Text style={styles.giftPopupTitle}>Gift Sent!</Text>
            <Text style={styles.giftPopupSub}>
              {giftPopup?.gift?.name} ×{giftPopup?.qty}
            </Text>
          </View>
        </View>
      </Modal>

      {/* ── BACKPACK MODAL ── */}
      <Modal
        visible={showBackpack}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBackpack(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowBackpack(false)}
        >
        <View style={styles.backpackBox} onStartShouldSetResponder={() => true}>
            <View style={{ height: H * 0.82 }}>
            {/* Handle */}
            <View style={styles.shareHandle} />

            {/* Promo banner */}
            <LinearGradient
              colors={["#3b0f6e", "#7c4dff", "#5c1fa8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bpBanner}
            >
              <Text style={styles.bpBannerGift}>🎁</Text>
              <Text style={styles.bpBannerText}>Get newbie bonus, recharge for free lottery.</Text>
              <TouchableOpacity style={styles.bpBannerArrow} activeOpacity={0.8}>
                <Text style={styles.bpBannerArrowText}>›</Text>
              </TouchableOpacity>
              <View style={styles.bpPkBadge}>
                <Text style={styles.bpPkBadgeText}>🏆 Room PK Challenge</Text>
              </View>
            </LinearGradient>

            {/* Currency row */}
            <View style={styles.bpCurrencyRow}>
              <TouchableOpacity style={styles.bpCurrencyItem} activeOpacity={0.8}>
                <Text style={styles.bpDiamondIcon}>💎</Text>
                <Text style={styles.bpCurrencyVal}>{walletDiamonds.toLocaleString()}</Text>
                <Text style={styles.bpCurrencyChev}> ›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bpCurrencyItem} activeOpacity={0.8}>
                <Text style={styles.bpCoinIcon}>🪙</Text>
                <Text style={styles.bpCurrencyVal}>0</Text>
                <Text style={styles.bpCurrencyChev}> ›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bpGetListBtn} activeOpacity={0.8}>
                <Text style={styles.bpGetListText}>Get on the list</Text>
              </TouchableOpacity>
            </View>

            {/* Main tabs */}
            {catalogLoading && (
              <ActivityIndicator color="#a78bfa" style={{ marginVertical: 8 }} />
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.bpMainTabScroll}
              contentContainerStyle={styles.bpMainTabContent}
            >
              {["Backpack", "Gift", "Activity", "Relationship", "PK", "Special", "VIP", "Rank"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.bpMainTabItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setBackpackMainTab(tab);
                    setSelectedGift(null);
                    if (tab !== "Rank") {
                      setCatalogRefreshKey((key) => key + 1);
                    }
                  }}
                >
                  <Text style={[styles.bpMainTabText, backpackMainTab === tab && styles.bpMainTabTextActive]}>
                    {tab}
                  </Text>
                  {backpackMainTab === tab && <View style={styles.bpMainTabUnderline} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── GIFT TAB ── */}
            {backpackMainTab === "Gift" && (
              <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  {/* Random gifts row */}
                  <View style={styles.bpRandomRow}>
                    <LinearGradient
                      colors={["#4a1080", "#7c4dff"]}
                      style={styles.bpRandomBox}
                    >
                      <Text style={styles.bpRandomBoxEmoji}>🎲</Text>
                      <Text style={styles.bpRandomBoxLabel}>Random{"\n"}gifts</Text>
                    </LinearGradient>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                      {displayRandomGifts.map((orb) => (
                        <TouchableOpacity
                          key={orb.id}
                          style={styles.bpOrbWrap}
                          activeOpacity={0.8}
                          onPress={() => openGiftPurchase(orb)}
                        >
                          <LinearGradient colors={["#2a1060", "#5c2daf"]} style={styles.bpOrbCircle}>
                            <Text style={styles.bpOrbEmoji}>{orb.emoji}</Text>
                          </LinearGradient>
                          <Text style={styles.bpOrbPrice}>💎 {formatGiftPrice(orb.price)}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Event banner */}
                  <LinearGradient
                    colors={["#1a0a2e", "#2d1060", "#1a0a2e"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.bpEventBanner}
                  >
                    <Text style={styles.bpEventIcon}>✨</Text>
                    <Text style={styles.bpEventText}>2026 TukTuk Carnival</Text>
                    <View style={styles.bpEventArrow}>
                      <Text style={styles.bpEventArrowText}>›</Text>
                    </View>
                  </LinearGradient>

                  {/* Gift grid */}
                  <View style={styles.bpGiftGrid}>
                    {displayGiftItems.map((gift) => (
                      <TouchableOpacity
                        key={gift.id}
                        style={styles.bpGiftCard}
                        activeOpacity={0.8}
                        onPress={() => openGiftPurchase(gift)}
                      >
                        {gift.hot && (
                          <View style={styles.bpHotBadge}>
                            <Text style={styles.bpHotText}>HOT</Text>
                          </View>
                        )}
                        <View style={styles.bpGiftSendBtn}>
                          <Text style={{ fontSize: 9 }}>🎁</Text>
                        </View>
                        <LinearGradient colors={["#2a0d50", "#4a1d80"]} style={styles.bpGiftEmojiWrap}>
                          <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpGiftPriceText}>💎 {formatGiftPrice(gift.price)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ── BACKPACK TAB ── */}
            {backpackMainTab === "Backpack" && (
              <View style={{ flex: 1 }}>
                <View style={styles.bpSubTabRow}>
                  {["Gift", "Property", "Ring", "Resource"].map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      style={[styles.bpSubTabItem, backpackSubTab === sub && styles.bpSubTabItemActive]}
                      activeOpacity={0.8}
                      onPress={() => setBackpackSubTab(sub)}
                    >
                      <Text style={[styles.bpSubTabText, backpackSubTab === sub && styles.bpSubTabTextActive]}>
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {backpackSubTab === "Gift" && backpackGifts.length > 0 ? (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                    <View style={styles.bpGiftGrid}>
                      {backpackGifts.map((gift) => (
                        <TouchableOpacity
                          key={gift.id}
                          style={[
                            styles.bpGiftCard,
                            giftsMatch(selectedGift, gift) && styles.bpGiftCardSelected,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => setSelectedGift(gift)}
                        >
                          <View style={styles.bpGiftQtyBadge}>
                            <Text style={styles.bpGiftQtyBadgeText}>×{gift.qty}</Text>
                          </View>
                          <LinearGradient colors={["#2a0d50", "#4a1d80"]} style={styles.bpGiftEmojiWrap}>
                            <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                          </LinearGradient>
                          <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                          <View style={styles.bpGiftPriceRow}>
                            <Text style={styles.bpGiftPriceText}>💎 {formatGiftPrice(gift.price)}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <View style={styles.bpEmptyState}>
                    <Text style={styles.bpEmptyEmoji}>🎒</Text>
                    <Text style={styles.bpEmptyText}>
                      {backpackSubTab === "Gift"
                        ? "Your backpack is empty. Buy gifts from the Gift tab."
                        : "Your backpack is empty."}
                    </Text>
                  </View>
                )}
                {backpackSubTab === "Gift" && backpackGifts.length > 0 && renderGiftSendBar()}
              </View>
            )}

            {/* ── ACTIVITY TAB ── */}
            {backpackMainTab === "Activity" && (
              <View style={{ flex: 1 }}>
                {/* Event sub-tabs */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.bpActEventScroll}
                  contentContainerStyle={styles.bpActEventContent}
                >
                  {displayActivityEvents.map((ev) => (
                    <TouchableOpacity
                      key={ev}
                      style={[styles.bpActEventTab, activityEvent === ev && styles.bpActEventTabActive]}
                      activeOpacity={0.8}
                      onPress={() => { setActivityEvent(ev); setSelectedGift(null); }}
                    >
                      <Text style={[styles.bpActEventText, activityEvent === ev && styles.bpActEventTextActive]}>
                        {ev}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Gift grid */}
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.bpGiftGrid}>
                    {(displayActivityGifts).map((gift) => (
                      <TouchableOpacity
                        key={gift.id}
                        style={styles.bpGiftCard}
                        activeOpacity={0.8}
                        onPress={() => openGiftPurchase(gift)}
                      >
                        <View style={styles.bpGiftSendBtn}>
                          <Text style={{ fontSize: 9 }}>🎁</Text>
                        </View>
                        <LinearGradient colors={["#2a0d50", "#4a1d80"]} style={styles.bpGiftEmojiWrap}>
                          <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpGiftPriceText}>💎 {formatGiftPrice(gift.price)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ── RELATIONSHIP TAB ── */}
            {backpackMainTab === "Relationship" && (
              <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.bpGiftGrid}>
                    {displayRelationshipVideos.length === 0 && !catalogLoading ? (
                      <Text style={styles.bpEmptyText}>No relationship videos available.</Text>
                    ) : null}
                    {displayRelationshipVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={video.id}
                        style={[styles.bpGiftCard, selectedGift?.id === video.id && styles.bpGiftCardSelected]}
                        activeOpacity={0.85}
                        onPress={() => {
                          setSelectedGift(video);
                          setCurrentVideo(video);
                          setShowVideoModal(true);
                        }}
                      >
                        <View style={styles.bpVideoThumb}>
                          {video.imageUrl ? (
                            <ExpoImage
                              source={resolveImageSource(video.imageUrl)}
                              style={styles.bpVideoThumbImage}
                              contentFit="cover"
                            />
                          ) : (
                            <LinearGradient
                              colors={["#4a1080", "#7c4dff", "#2d1060"]}
                              style={StyleSheet.absoluteFillObject}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            />
                          )}
                          <View style={styles.bpVideoNumBadge}>
                            <Text style={styles.bpVideoNumText}>{idx + 1}</Text>
                          </View>
                          <View style={styles.bpVideoPlayCircle}>
                            <Play size={22} color="white" fill="white" />
                          </View>
                        </View>

                        <Text style={styles.bpGiftName} numberOfLines={1}>{video.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpVideoTagText}>🎬 Free video</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Send bar */}
                <View style={[styles.bpSendBar, { paddingBottom: giftSendBarBottom }]}>
                  {renderGiftRecipientAvatar(selectedGiftRecipient)}
                  <TouchableOpacity
                    style={styles.bpSendRecipient}
                    activeOpacity={0.8}
                    onPress={openGiftReceiverPicker}
                  >
                    <Text style={styles.bpSendHeart}>❤️ </Text>
                    <Text style={styles.bpSendName} numberOfLines={1}>
                      {giftReceiverName}
                    </Text>
                    <Text style={styles.bpSendChev}> ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bpSendQtyBtn}
                    activeOpacity={0.8}
                    onPress={() => setGiftQty((q) => (q < 99 ? q + 1 : 1))}
                  >
                    <Text style={styles.bpSendQtyText}>{giftQty} ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bpSendBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (currentVideo) {
                        setShowVideoModal(true);
                      } else {
                        Alert.alert("Select a video", "Tap any video to play it.");
                      }
                    }}
                  >
                    <Text style={styles.bpSendBtnText}>Play</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── PK TAB ── */}
            {backpackMainTab === "PK" && (
              <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.bpGiftGrid}>
                    {displayPkGifts.map((gift) => (
                      <TouchableOpacity
                        key={gift.id}
                        style={styles.bpGiftCard}
                        activeOpacity={0.8}
                        onPress={() => openGiftPurchase(gift)}
                      >
                        {gift.hot && (
                          <View style={styles.bpHotBadge}>
                            <Text style={styles.bpHotText}>HOT</Text>
                          </View>
                        )}
                        <View style={styles.bpGiftSendBtn}>
                          <Text style={{ fontSize: 9 }}>🎁</Text>
                        </View>
                        <LinearGradient colors={["#2a0d50", "#4a1d80"]} style={styles.bpGiftEmojiWrap}>
                          <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpGiftPriceText}>💎 {formatGiftPrice(gift.price)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ── SPECIAL TAB ── */}
            {backpackMainTab === "Special" && (
              <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.bpGiftGrid}>
                    {displaySpecialGifts.map((gift) => (
                      <TouchableOpacity
                        key={gift.id}
                        style={styles.bpGiftCard}
                        activeOpacity={0.8}
                        onPress={() => openGiftPurchase(gift)}
                      >
                        {gift.isNew && (
                          <View style={styles.bpNewBadge}>
                            <Text style={styles.bpNewBadgeText}>NEW</Text>
                          </View>
                        )}
                        <View style={styles.bpGiftSendBtn}>
                          <Text style={{ fontSize: 9 }}>🎁</Text>
                        </View>
                        <LinearGradient colors={["#1a0a3e", "#6a1590"]} style={styles.bpGiftEmojiWrap}>
                          <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpGiftPriceText}>💎 {formatGiftPrice(gift.price)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ── VIP TAB ── */}
            {backpackMainTab === "VIP" && (
              <View style={{ flex: 1 }}>
                <View style={styles.bpVipBanner}>
                  <LinearGradient
                    colors={["#3d1a00", "#8b5e00", "#3d1a00"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.bpVipBannerGrad}
                  >
                    <Text style={styles.bpVipBannerIcon}>👑</Text>
                    <Text style={styles.bpVipBannerText}>Exclusive VIP Gifts — Upgrade to unlock</Text>
                  </LinearGradient>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.bpGiftGrid}>
                    {displayVipGifts.map((gift) => (
                      <TouchableOpacity
                        key={gift.id}
                        style={styles.bpGiftCard}
                        activeOpacity={0.85}
                        onPress={() => Alert.alert("VIP Exclusive 👑", "Upgrade to VIP to unlock and send this gift.")}
                      >
                        <LinearGradient colors={["#2a1800", "#5c3a00"]} style={styles.bpGiftEmojiWrap}>
                          <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpVipPriceText}>💎 {formatGiftPrice(gift.price)}</Text>
                        </View>
                        {/* Lock overlay */}
                        <View style={styles.bpVipLockOverlay}>
                          <View style={styles.bpVipLockCircle}>
                            <Text style={styles.bpVipLockEmoji}>🔒</Text>
                          </View>
                          <View style={styles.bpVipTag}>
                            <Text style={styles.bpVipTagText}>VIP</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <View style={styles.bpVipUpgradeBar}>
                  <LinearGradient
                    colors={["#3d1a00", "#b8860b"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.bpVipUpgradeGrad}
                  >
                    <Text style={styles.bpVipUpgradeText}>👑  Upgrade to VIP to unlock all gifts</Text>
                    <TouchableOpacity style={styles.bpVipUpgradeBtn} activeOpacity={0.8}>
                      <Text style={styles.bpVipUpgradeBtnText}>Upgrade</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* ── OTHER TABS EMPTY STATE ── */}
            {!["Gift", "Backpack", "Activity", "Relationship", "PK", "Special", "VIP"].includes(backpackMainTab) && (
              <View style={styles.bpEmptyState}>
                <Text style={styles.bpEmptyEmoji}>✨</Text>
                <Text style={styles.bpEmptyText}>Coming soon</Text>
              </View>
            )}
            </View>
            {renderGiftRecipientPickerOverlay()}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── GIFT / LISTEN REWARDS MODAL ── */}
      <Modal
        visible={showGiftPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGiftPanel(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowGiftPanel(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.giftPanelBox}>
            {/* Handle */}
            <View style={styles.shareHandle} />

            {/* Header banner */}
            <View style={styles.giftBannerRow}>
              <View style={styles.giftBannerText}>
                <Text style={styles.giftBannerTitle}>Listen Rewards</Text>
                <Text style={styles.giftBannerSub}>Daily refresh</Text>
              </View>
              <Text style={styles.giftBannerEmoji}>🎁</Text>
            </View>

            {/* Reward cards */}
            <View style={styles.giftCardsRow}>
              {rewardStates.map((reward, i) => {
                const remaining = Math.max(0, LISTEN_THRESHOLDS[i] - listenSeconds);
                const isReady = reward.rewardImg != null && !reward.claimed;
                const isClaimed = reward.claimed;
                const img = reward.rewardImg ?? LISTEN_LOCKED_IMGS[i];

                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.giftCard, isReady && styles.giftCardReady]}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isReady) {
                        setRewardStates((prev) =>
                          prev.map((r, idx) => idx === i ? { ...r, claimed: true } : r)
                        );
                        Alert.alert("🎁 Reward Claimed!", "You received a gift! Check your backpack.");
                      } else if (!isClaimed) {
                        Alert.alert("Keep Listening", `Unlock in ${formatListenTime(remaining)}`);
                      }
                    }}
                  >
                    <View style={styles.giftCardImgWrap}>
                      <Image source={img} style={styles.giftCardImg} resizeMode="contain" />
                      {!isReady && !isClaimed && (
                        <View style={styles.giftCardLockOverlay}>
                          <Text style={styles.giftCardLockIcon}>🔒</Text>
                        </View>
                      )}
                      {isClaimed && (
                        <View style={styles.giftCardLockOverlay}>
                          <Text style={styles.giftCardLockIcon}>✓</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.giftCardLabel}>{LISTEN_THRESHOLD_LABELS[i]}</Text>

                    <View style={[styles.giftCardBtn, isReady && styles.giftCardBtnActive, isClaimed && styles.giftCardBtnClaimed]}>
                      <Text style={[styles.giftCardBtnText, (isReady || isClaimed) && styles.giftCardBtnTextActive]}>
                        {isClaimed ? "Claimed ✓" : isReady ? "Claim!" : formatListenTime(remaining)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <TreasureBoxModal
        visible={showTreasureBox}
        onClose={() => setShowTreasureBox(false)}
        treasureState={treasureState}
        onSelectChest={selectChest}
      />

      <RoomUserProfilePopup
        visible={Boolean(profilePopupUser || profilePopupLoading)}
        user={profilePopupUser}
        avatarSource={profilePopupAvatarSource}
        frameSource={
          isSameUser(profilePopupUser?.id, myUserId) && myVipAssets.unlocked
            ? myVipAssets.profileFrame
            : userFrameData[String(profilePopupUser?.id)]?.vipProfileFrameUrl ?? null
        }
        frameLayout={
          (isSameUser(profilePopupUser?.id, myUserId) && myVipAssets.unlocked) ||
          userFrameData[String(profilePopupUser?.id)]?.vipProfileFrameUrl
            ? VIP_PROFILE_FRAME_LAYOUT
            : null
        }
        logoSource={
          isSameUser(profilePopupUser?.id, myUserId) && myVipAssets.unlocked
            ? myVipAssets.logo
            : null
        }
        loading={profilePopupLoading}
        isFollowing={profilePopupFollowing}
        followLoading={profileFollowLoading}
        isSelf={isSameUser(profilePopupUser?.id, myUserId)}
        onClose={closeProfilePopup}
        onFollowToggle={handleProfileFollowToggle}
      />

      {/* ── EMOJI PICKER MODAL ── */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={styles.emojiBox} onStartShouldSetResponder={() => true}>
            <View style={styles.shareHandle} />

            <View style={styles.emojiBoxBody}>
            <View style={styles.mediaSectionRow}>
              {MEDIA_SECTIONS.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.mediaSectionTab,
                    mediaSection === section.id && styles.mediaSectionTabActive,
                  ]}
                  onPress={() => setMediaSection(section.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.mediaSectionTabText,
                      mediaSection === section.id && styles.mediaSectionTabTextActive,
                    ]}
                  >
                    {section.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {mediaSection === "emoji" && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mediaSubTabScroll}
                contentContainerStyle={styles.mediaSubTabContent}
              >
                {emojiCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.mediaSubTabItem,
                      emojiTab === cat.id && styles.mediaSubTabItemActive,
                    ]}
                    onPress={() => setEmojiTab(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.mediaSubTabIcon}>{cat.tab}</Text>
                    <Text
                      style={[
                        styles.mediaSubTabLabel,
                        emojiTab === cat.id && styles.mediaSubTabLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {mediaSection === "stickers" && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mediaSubTabScroll}
                contentContainerStyle={styles.mediaSubTabContent}
              >
                {stickerPacks.map((pack) => (
                  <TouchableOpacity
                    key={pack.id}
                    style={[
                      styles.mediaSubTabItem,
                      stickerTab === pack.id && styles.mediaSubTabItemActive,
                    ]}
                    onPress={() => setStickerTab(pack.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.mediaSubTabIcon}>{pack.tab}</Text>
                    <Text
                      style={[
                        styles.mediaSubTabLabel,
                        stickerTab === pack.id && styles.mediaSubTabLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {pack.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {mediaSection === "gif" && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mediaSubTabScroll}
                contentContainerStyle={styles.mediaSubTabContent}
              >
                {gifCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.mediaSubTabItem,
                      gifTab === cat.id && styles.mediaSubTabItemActive,
                    ]}
                    onPress={() => setGifTab(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.mediaSubTabIcon}>{cat.tab}</Text>
                    <Text
                      style={[
                        styles.mediaSubTabLabel,
                        gifTab === cat.id && styles.mediaSubTabLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.emojiGrid}
              contentContainerStyle={styles.emojiGridContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {mediaSection === "emoji" && (
                <View style={styles.emojiGridInner}>
                  {emojiCategories
                    .find((c) => c.id === emojiTab)
                    ?.emojis.map((emoji, i) => (
                      <TouchableOpacity
                        key={`${emoji}-${i}`}
                        style={styles.emojiCell}
                        activeOpacity={0.7}
                        onPress={() => handleEmojiPick(emoji)}
                      >
                        <Text style={styles.emojiCellText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}

              {mediaSection === "stickers" && (
                <View style={styles.stickerGridInner}>
                  {stickerPacks
                    .find((p) => p.id === stickerTab)
                    ?.stickers.map((sticker) => (
                      <TouchableOpacity
                        key={sticker.id}
                        style={styles.stickerCell}
                        activeOpacity={0.7}
                        onPress={() => handleStickerPick(sticker)}
                      >
                        {sticker.image ? (
                          <Image
                            source={{ uri: sticker.image }}
                            style={styles.stickerCellImg}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={styles.stickerCellEmoji}>{sticker.emoji}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                </View>
              )}

              {mediaSection === "gif" && (
                <View style={styles.gifGridInner}>
                  {gifCategories
                    .find((c) => c.id === gifTab)
                    ?.gifs.map((gif) => (
                      <TouchableOpacity
                        key={gif.id}
                        style={styles.gifCell}
                        activeOpacity={0.7}
                        onPress={() => handleGifPick(gif)}
                      >
                        <Image
                          source={{ uri: gif.url }}
                          style={styles.gifCellImg}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── PLAY CENTER MODAL ── */}
      <Modal
        visible={showPlayCenter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlayCenter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlayCenter(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.playCenterBox}>
            <Text style={styles.playCenterTitle}>Play center</Text>
            <View style={styles.playCenterRow}>
              {/* Music */}
              <TouchableOpacity
                style={styles.playCenterItem}
                activeOpacity={0.75}
                onPress={() => {
                  setShowPlayCenter(false);
                  Alert.alert("Music", "Music player coming soon!");
                }}
              >
                <View style={styles.playCenterIconWrap}>
                  <Text style={styles.playCenterEmoji}>🎵</Text>
                </View>
                <Text style={styles.playCenterLabel}>Music</Text>
              </TouchableOpacity>

              {/* Lucky bag */}
              <TouchableOpacity
                style={styles.playCenterItem}
                activeOpacity={0.75}
                onPress={() => {
                  setShowPlayCenter(false);
                  Alert.alert("Lucky Bag", "Lucky bag coming soon!");
                }}
              >
                <View style={styles.playCenterIconWrap}>
                  <Text style={styles.playCenterEmoji}>💰</Text>
                </View>
                <Text style={styles.playCenterLabel}>Lucky bag</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── POWER MODAL ── */}
      <Modal
        visible={showPowerMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPowerMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPowerMenu(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.powerBox}>
            <Text style={styles.playCenterTitle}>Leave room?</Text>
            <View style={styles.playCenterRow}>
              {/* Keep */}
              <TouchableOpacity
                style={styles.playCenterItem}
                activeOpacity={0.75}
                onPress={() => setShowPowerMenu(false)}
              >
                <View style={styles.playCenterIconWrap}>
                  <Minimize2 size={28} color="#a78bfa" />
                </View>
                <Text style={styles.playCenterLabel}>Keep</Text>
              </TouchableOpacity>

              {/* Exit */}
              <TouchableOpacity
                style={styles.playCenterItem}
                activeOpacity={0.75}
                onPress={handleExitRoom}
              >
                <View style={[styles.playCenterIconWrap, styles.powerExitIconWrap]}>
                  <Power size={28} color="#ff6b6b" />
                </View>
                <Text style={[styles.playCenterLabel, { color: "#ff6b6b" }]}>Exit</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── SHARE MODAL ── */}
      <Modal
        visible={showShareMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareMenu(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowShareMenu(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.shareBox, { paddingBottom: Math.max(30, safeBottom + 16) }]}>
            {/* Handle bar */}
            <View style={styles.shareHandle} />

            <Text style={styles.shareTitle}>Invite your friends</Text>

            {/* Platform icons */}
            <View style={styles.sharePlatformRow}>
              {sharePlatforms.map((p) => (
                <TouchableOpacity key={p.label} style={styles.sharePlatformItem} activeOpacity={0.8}>
                  <View style={[styles.sharePlatformIcon, { backgroundColor: p.bg }]}>
                    {typeof p.icon === "string"
                      ? <Text style={styles.sharePlatformEmoji}>{p.icon}</Text>
                      : p.icon}
                  </View>
                  <Text style={styles.sharePlatformLabel}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tabs */}
            <View style={styles.shareTabRow}>
              {shareTabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.shareTabItem}
                  onPress={() => setShareTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.shareTabText, shareTab === tab && styles.shareTabTextActive]}>
                    {tab}
                  </Text>
                  {shareTab === tab && <View style={styles.shareTabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.shareCancelBtn}
              activeOpacity={0.8}
              onPress={() => setShowShareMenu(false)}
            >
              <Text style={styles.shareCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── SEAT ACTION POPUP (centered) ── */}
      <Modal
        visible={Boolean(seatActionSheet)}
        transparent
        animationType="fade"
        onRequestClose={() => setSeatActionSheet(null)}
      >
        <TouchableOpacity
          style={styles.seatActionOverlay}
          activeOpacity={1}
          onPress={() => setSeatActionSheet(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.seatActionCard}>
            {/* Header */}
            <View style={styles.seatActionHeader}>
              <Text style={styles.seatActionHeaderEmoji}>🎙️</Text>
              <Text style={styles.seatActionHeaderTitle}>Seat {seatActionSheet?.seatId}</Text>
              <Text style={styles.seatActionHeaderSub}>What would you like to do?</Text>
            </View>

            {/* Divider */}
            <View style={styles.seatActionDivider} />

            {/* Take a Seat */}
            <TouchableOpacity
              style={styles.seatActionBtn}
              activeOpacity={0.8}
              disabled={seatActionLoading}
              onPress={() => handleTakeSeat(seatActionSheet?.seatId)}
            >
              <LinearGradient
                colors={["#7c4dff", "#a855f7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.seatActionBtnGradient}
              >
                {seatActionLoading
                  ? <ActivityIndicator color="white" />
                  : <>
                      <Text style={styles.seatActionBtnIcon}>🎤</Text>
                      <Text style={styles.seatActionBtnText}>Take a Seat</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.seatActionCancelBtn}
              activeOpacity={0.8}
              onPress={() => setSeatActionSheet(null)}
            >
              <Text style={styles.seatActionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── MIC PERMISSION WARNING ── */}
      <Modal
        visible={micPermWarning !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMicPermWarning(null)}
      >
        <TouchableOpacity
          style={styles.seatActionOverlay}
          activeOpacity={1}
          onPress={() => setMicPermWarning(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.micPermCard}>
            {/* ── Illustrated header area ── */}
            <LinearGradient
              colors={["#2a0f5e", "#4a1fa8", "#3b1580"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.micPermIllustration}
            >
              {/* Decorative glow blobs */}
              <View style={styles.micPermBlob1} />
              <View style={styles.micPermBlob2} />

              {/* Main illustration — mic inside a phone-shaped card */}
              <View style={styles.micPermPhoneCard}>
                <View style={styles.micPermPhoneBar1} />
                <View style={styles.micPermPhoneBar2} />
                {/* Mic icon inside the card */}
                <View style={styles.micPermMicCircle}>
                  <Mic size={22} color="#7c4dff" strokeWidth={2} />
                </View>
                <View style={styles.micPermPhoneBar3} />
              </View>

              {/* Small floating badge */}
              <View style={styles.micPermBadge}>
                <View style={styles.micPermBadgeDot} />
                <View style={styles.micPermBadgeLine} />
              </View>
            </LinearGradient>

            {/* ── Body text ── */}
            <View style={styles.micPermBody}>
              <Text style={styles.micPermMsg}>
                Please enable microphone access to use functions such as voice verification and calling.
              </Text>
            </View>

            {/* ── Buttons ── */}
            <View style={styles.micPermBtnRow}>
              <TouchableOpacity
                style={styles.micPermCancelBtn}
                activeOpacity={0.7}
                onPress={() => setMicPermWarning(null)}
              >
                <Text style={styles.micPermCancelText}>Cancel</Text>
              </TouchableOpacity>

              <View style={styles.micPermBtnDivider} />

              <TouchableOpacity
                style={styles.micPermOkBtn}
                activeOpacity={0.7}
                onPress={() => setMicPermWarning(null)}
              >
                <Text style={styles.micPermOkText}>Ok</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── WELCOME MESSAGE EDIT MODAL ── */}
      <Modal
        visible={showWelcomeEdit}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWelcomeEdit(false)}
      >
        <TouchableOpacity
          style={styles.welcomeEditOverlay}
          activeOpacity={1}
          onPress={() => setShowWelcomeEdit(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.welcomeEditBox}>
            <View style={styles.shareHandle} />
            <Text style={styles.welcomeEditTitle}>Edit Welcome Message</Text>
            <TextInput
              style={styles.welcomeEditInput}
              value={welcomeDraft}
              onChangeText={setWelcomeDraft}
              placeholder="Type a welcome message..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              multiline
              maxLength={120}
              autoFocus
            />
            <Text style={styles.welcomeEditCount}>{welcomeDraft.length}/120</Text>
            <View style={styles.welcomeEditActions}>
              <TouchableOpacity
                style={styles.welcomeEditCancel}
                activeOpacity={0.8}
                onPress={() => setShowWelcomeEdit(false)}
              >
                <Text style={styles.welcomeEditCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.welcomeEditSave}
                activeOpacity={0.8}
                onPress={() => {
                  if (welcomeDraft.trim()) setWelcomeMessage(welcomeDraft.trim());
                  setShowWelcomeEdit(false);
                }}
              >
                <Text style={styles.welcomeEditSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── MORE MENU MODAL ── */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={styles.moreMenuBox}>
            {moreMenuItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.moreMenuItem,
                  i < moreMenuItems.length - 1 && styles.moreMenuItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={item.onPress}
              >
                <View style={styles.moreMenuIcon}>{item.icon}</View>
                <Text style={styles.moreMenuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── REPORT ROOM MODAL ── */}
      <ReportReasonModal
        visible={showReportModal}
        title="Report Room"
        targetLabel="this room"
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportRoomSubmit}
      />

      {roomLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#a78bfa" />
          <Text style={styles.loadingText}>Joining room...</Text>
        </View>
      )}

      {/* ── BACKGROUND ── */}
      <Image
        source={{
          uri:
            roomInfo?.profileImageUrl ??
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        }}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={styles.bgOverlay} />

      <View style={{ flex: 1, position: "relative" }}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          {/* Room info + follow button */}
          <View style={styles.ownerSection}>
            {roomInfo?.profileImageUrl ? (
              <Image
                source={{ uri: roomInfo.profileImageUrl }}
                style={styles.ownerAvatar}
              />
            ) : hostUserLike ? (
              renderRoomUserAvatar(
                hostUserLike,
                styles.ownerAvatar,
                [styles.ownerAvatar, styles.ownerAvatarPlaceholder],
                styles.ownerInitial
              )
            ) : (
              <Image
                source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
                style={styles.ownerAvatar}
              />
            )}
            <View style={styles.ownerTextCol}>
              <Text style={styles.ownerName} numberOfLines={1} ellipsizeMode="tail">
                {roomInfo?.name ?? "Voice Room"}
              </Text>
              <Text style={styles.ownerId} numberOfLines={1} ellipsizeMode="middle">
                ID:{roomId ?? "—"}
              </Text>
            </View>
            {!isHostSelf && (
              <TouchableOpacity
                style={[styles.plusBtn, isFollowing && styles.plusBtnFollowing]}
                onPress={handleFollowToggle}
                disabled={followLoading}
                activeOpacity={0.8}
              >
                {followLoading
                  ? <ActivityIndicator size="small" color="white" />
                  : <Plus size={20} color="white" />
                }
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowShareMenu(true)}>
              <Share2 size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowMoreMenu(true)}>
              <MoreVertical size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowPowerMenu(true)}>
              <Power size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
 
        {/* ── ONLINE USERS ROW ── */}
        <View style={styles.badgesRow}>
          <View style={styles.trophyBadge}>
            <Text style={styles.trophyText}>👥 {onlineCount}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.audienceScroll}
            contentContainerStyle={styles.audienceScrollContent}
          >
            {onlineUsers.slice(0, 6).map((user, index) => (
              <TouchableOpacity
                key={user.id ?? `user-${index}`}
                style={styles.audienceItem}
                activeOpacity={0.85}
                onPress={() => handleOnlineUserPress(user)}
              >
                {renderRoomUserAvatar(
                  user,
                  [styles.audienceAvatar, index > 0 && styles.audienceAvatarOverlap],
                  [
                    styles.audienceAvatar,
                    styles.audienceAvatarPlaceholder,
                    index > 0 && styles.audienceAvatarOverlap,
                  ],
                  styles.audienceInitial
                )}
                <View style={styles.micStatusDot}>
                  {user.muted ? (
                    <MicOff size={9} color="#f87171" />
                  ) : user.isSpeaking ? (
                    <Mic size={9} color="#4ade80" />
                  ) : (
                    <Mic size={9} color="rgba(255,255,255,0.5)" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {onlineCount > 6 && (
            <View style={styles.audienceCount}>
              <Text style={styles.audienceCountText}>+{onlineCount - 6}</Text>
            </View>
          )}
        </View>

        {/* ── MIC SEATS GRID ── */}
        <View style={styles.seatsGrid}>
          {seats.map((seat) => (
            <TouchableOpacity
              key={seat.id}
              style={styles.seatItem}
              activeOpacity={0.8}
              onPress={() => handleSeatPress(seat)}
              disabled={seat.locked && !seat.user}
            >
              {seat.user ? (
                <View style={styles.seatUserWrap}>
                  {/* Speaking ring always shown — overlays avatar and frame */}
                  <SpeakingRing active={speakingUserIds.has(String(seat.user.id))} />
                  {renderRoomUserAvatar(
                    seat.user,
                    styles.seatAvatar,
                    [
                      styles.seatEmpty,
                      styles.seatAvatarPlaceholder,
                      seat.user.active && styles.seatActiveBorder,
                    ],
                    styles.seatInitial
                  )}
                  <View style={styles.seatMicIcon}>
                    {seat.user.muted ? (
                      <MicOff size={12} color="#f87171" />
                    ) : (
                      <Mic size={12} color={seat.user.active ? "#4ade80" : "rgba(255,255,255,0.8)"} />
                    )}
                  </View>
                </View>
              ) : seat.locked ? (
                <View style={styles.seatEmpty}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              ) : (
                <View style={styles.seatEmpty}>
                  <Mic size={18} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <Text style={styles.seatNum}>{seat.id}</Text>
              {seat.user && (
                <Text style={styles.seatName} numberOfLines={1}>
                  {seat.user.name}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CHAT + RIGHT PANEL ── */}
        <View style={[styles.chatArea, { paddingBottom: 52 + safeBottom }]}>
          <View style={styles.chatLeft}>
            <ScrollView
              ref={scrollRef}
              style={styles.chatScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.chatScrollContent}
            >
              {/* ── PINNED ROOM MESSAGES ── */}
              {/* Card 1 — rules */}
              <View style={styles.pinnedRulesCard}>
                <Text style={styles.pinnedRulesText}>
                  Welcome to TukTuk! Please respect each other and chat in a decent manner.
                </Text>
              </View>

              {/* Card 2 — host welcome (editable by host) */}
              <View style={styles.pinnedWelcomeCard}>
                <Text style={styles.pinnedWelcomeText} numberOfLines={3}>
                  {welcomeMessage}
                </Text>
                {isHostSelf && (
                  <TouchableOpacity
                    style={styles.pinnedEditBtn}
                    activeOpacity={0.8}
                    onPress={() => { setWelcomeDraft(welcomeMessage); setShowWelcomeEdit(true); }}
                  >
                    <Text style={styles.pinnedEditBtnText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Card 3 — share prompt */}
              <View style={styles.pinnedShareCard}>
                <Text style={styles.pinnedShareText}>Share your room to others!</Text>
                <TouchableOpacity
                  style={styles.pinnedShareBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowShareMenu(true)}
                >
                  <Text style={styles.pinnedShareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>

              {messages.map((msg) => {
                if (msg.system) {
                  return (
                    <View key={msg.id} style={styles.systemMsg}>
                      <Text style={styles.systemMsgText}>{msg.text}</Text>
                    </View>
                  );
                }

                // The message's own user/avatar fields are a snapshot from when it
                // was sent — resolve the sender's CURRENT name/avatar instead, so a
                // later username/avatar change is reflected on old messages too.
                const senderName = resolveChatSenderName(msg.userId, msg.user);
                const senderAvatar = resolveChatSenderAvatar(msg.userId) ?? msg.avatar;
                // VIP chat cosmetics — the chat-bubble background frame and
                // corner logo are only known for the logged-in user's own
                // messages (myVipAssets), but the avatar ring itself is also
                // shown for other senders when the backend embeds
                // vipProfileFrameUrl on their message (their own XP >= threshold).
                const isSenderSelf =
                  msg.userId != null && myUserId != null && String(msg.userId) === String(myUserId);
                const isSenderVip = isSenderSelf && myVipAssets.unlocked;
                const otherSenderVipProfileFrame =
                  !isSenderSelf && msg.vipProfileFrameUrl ? { uri: msg.vipProfileFrameUrl } : null;
                const senderProfileFrame = isSenderVip ? myVipAssets.profileFrame : otherSenderVipProfileFrame;
                // Trimmed whole-image chat frame for this sender's tier (keyed
                // by tier number, not by URL — the URL can vary once the real
                // API is wired up). Falls back to the raw remote asset (old
                // behavior) for any tier without a trimmed image yet.
                const vipChatFrameAsset =
                  isSenderVip ? VIP_CHAT_FRAME_FITTED_BY_TIER[myVipAssets.tier] : null;
                // Re-wrapped as a bare {uri} (dropping the asset's known
                // width/height) so resizeMode="stretch" fills the bubble's
                // actual box exactly — with the width/height metadata local
                // require()'d images carry, Fabric's Android image view
                // partially preserves aspect ratio even under "stretch",
                // rendering oversized and clipped. A plain uri (like the
                // remote chatFrame fallback below already used) has no
                // intrinsic size to preserve, so it stretches correctly.
                const vipChatFrameSource = vipChatFrameAsset
                  ? { uri: Image.resolveAssetSource(vipChatFrameAsset.source).uri }
                  : null;
                // The image is taller than the bubble by topFrac+bottomFrac
                // (as fractions of the bubble's own height) and shifted up
                // by topFrac, so the border rail still lines up exactly
                // with the bubble's edges while the crown/gem art bleeds
                // above/below instead of being cropped off.
                const vipChatFrameStyle = vipChatFrameAsset
                  ? {
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${-vipChatFrameAsset.topFrac * 100}%`,
                      bottom: `${-vipChatFrameAsset.bottomFrac * 100}%`,
                    }
                  : null;

                return (
                  <View key={msg.id} style={styles.chatMsg}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() =>
                        handleUserAvatarPress({ id: msg.userId, name: senderName, avatar: senderAvatar })
                      }
                    >
                      {senderAvatar ? (
                        senderProfileFrame ? (
                          <ProfileAvatarWithFrame
                            avatarSource={resolveRoomUserAvatarSource({ avatar: senderAvatar })}
                            frameSource={senderProfileFrame}
                            size={32}
                            avatarStyle={styles.chatAvatar}
                            frameScale={VIP_PROFILE_FRAME_LAYOUT.frameScale}
                            frameResizeMode={VIP_PROFILE_FRAME_LAYOUT.frameResizeMode}
                            frameOffsetX={VIP_PROFILE_FRAME_LAYOUT.frameOffsetX}
                            frameOffsetY={VIP_PROFILE_FRAME_LAYOUT.frameOffsetY}
                            frameBleed={VIP_PROFILE_FRAME_LAYOUT.frameBleed}
                            avatarBoost={VIP_PROFILE_FRAME_LAYOUT.avatarBoost}
                            avatarOffsetY={VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY}
                          />
                        ) : (
                          <Image
                            source={resolveRoomUserAvatarSource({ avatar: senderAvatar })}
                            style={styles.chatAvatar}
                          />
                        )
                      ) : (
                        <View style={[styles.chatAvatar, styles.chatAvatarPlaceholder]}>
                          <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                            {senderName?.[0]?.toUpperCase() ?? "?"}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={[styles.chatBubble, vipChatFrameSource && styles.chatBubbleVipPadding]}>
                      {vipChatFrameSource ? (
                        <Image
                          source={vipChatFrameSource}
                          style={vipChatFrameStyle}
                          resizeMode="stretch"
                          pointerEvents="none"
                        />
                      ) : (
                        isSenderVip && (myVipAssets.chatFrame || myVipAssets.logo) && (
                          <Image
                            source={{ uri: myVipAssets.chatFrame || myVipAssets.logo }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="stretch"
                            pointerEvents="none"
                          />
                        )
                      )}
                      <View style={styles.chatMeta}>
                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={() =>
                            handleUserAvatarPress({ id: msg.userId, name: senderName, avatar: senderAvatar })
                          }
                        >
                          <Text style={styles.chatUser}>{senderName}</Text>
                        </TouchableOpacity>
                        <View style={styles.lvBadge}>
                          <Text style={styles.lvText}>Lv.{msg.level}</Text>
                        </View>
                        {msg.userId != null && (userFrameData[String(msg.userId)]?.hasNewUserFrame ?? false) && (
                          <Image
                            source={NEW_START_BADGE}
                            style={styles.newStartBadge}
                            resizeMode="contain"
                          />
                        )}
                        {msg.coins > 0 && <Text style={styles.chatCoin}>🪙 {msg.coins}</Text>}
                        {msg.diamonds > 0 && <Text style={styles.chatDiamond}>💎 {msg.diamonds}</Text>}
                      </View>
                      {isChatMediaUrl(msg.text) ? (
                        <Image
                          source={{ uri: msg.text.trim() }}
                          style={styles.chatMediaImg}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={[styles.chatText, msg.isGift && styles.chatGiftText]}>
                          {msg.text}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Right panel */}
          <View style={styles.chatRight}>
            <TouchableOpacity
              style={styles.treasureBoxBtn}
              activeOpacity={0.85}
              onPress={() => setShowTreasureBox(true)}
            >
              <ExpoImage
                source={TREASURE_BOX_GIF}
                style={styles.treasureBoxGif}
                contentFit="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.rightIconBtn} onPress={() => setShowGiftPanel(true)}>
              <Text style={styles.rightIconEmoji}>🎁</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rightIconBtn}
              onPress={handleOpenChatTab}
            >
              <MessageSquare size={22} color="white" />
              {chatUnreadCount > 0 && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>
                    {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.takeMicBtn}
              onPress={handleTakeMic}
              disabled={voiceConnecting}
            >
              {voiceConnecting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text style={styles.takeMicEmoji}>🎤</Text>
                  <Text style={styles.takeMicText}>{onMic ? "Leave Mic" : "Take Mic"}</Text>
                </>
              )}
            </TouchableOpacity>
            {onMic ? (
              <TouchableOpacity
                style={styles.micMuteBtn}
                onPress={handleToggleMic}
                disabled={voiceConnecting}
              >
                {isMicMuted ? (
                  <MicOff size={20} color="#ff6b6b" />
                ) : (
                  <Mic size={20} color="white" />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {(voiceListenStatus !== "idle" || voiceDiagnostics?.joined) && (
          <Text style={styles.voiceDebugText} numberOfLines={2}>
            Audio: {voiceListenStatus}
            {voiceDiagnostics?.joined ? " · connected" : ""}
            {voiceDiagnostics?.remoteSpeakerCount > 0
              ? ` · ${voiceDiagnostics.remoteSpeakerCount} speaking`
              : voiceDiagnostics?.joined
                ? " · waiting for speakers"
                : ""}
            {isSpeakerMuted ? " · speaker off" : ""}
          </Text>
        )}

        {/* ── BOTTOM DOCK: buttons above chat input ── */}
        <View
          style={[
            styles.bottomDock,
            {
              bottom: keyboardHeight > 0 ? keyboardHeight : safeBottom,
              paddingBottom: keyboardHeight > 0 ? 4 : 0,
            },
          ]}
        >
          {/* Input row — shown above bottom bar when chat is open */}
          {showChatInput && (
            <View style={styles.inputRow}>
              {/* @ Tag button */}
              <TouchableOpacity
                style={styles.tagBtn}
                onPress={() => setShowTagPicker((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.tagBtnText}>@</Text>
              </TouchableOpacity>

              <View style={styles.inputWrapper}>
                {taggedUser && (
                  <View style={styles.tagChip}>
                    <Text style={styles.tagChipText} numberOfLines={1}>
                      @{taggedUser.username ?? taggedUser.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setTaggedUser(null);
                        setInputText((prev) => prev.replace(/^@\S+\s*/, ""));
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.tagChipClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TextInput
                  style={[styles.input, taggedUser && { paddingLeft: 8 }]}
                  placeholder="Say something..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={inputText}
                  onChangeText={(val) => {
                    setInputText(val);
                    if (taggedUser && !val.startsWith("@")) setTaggedUser(null);
                  }}
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                  autoFocus
                />
              </View>

              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tag Picker — member list (above input row) */}
          {showTagPicker && showChatInput && (
            <View style={styles.tagPickerContainer}>
              <View style={styles.tagPickerHeader}>
                <Text style={styles.tagPickerTitle}>Tag someone</Text>
                <TouchableOpacity onPress={() => setShowTagPicker(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.tagPickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              {roomMembersList.length === 0 ? (
                <Text style={styles.tagPickerEmpty}>No one else is in the room</Text>
              ) : (
                <ScrollView
                  style={styles.tagPickerList}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={false}
                >
                  {roomMembersList.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.tagPickerItem}
                      activeOpacity={0.75}
                      onPress={() => handleTagUser(member)}
                    >
                      {member.avatar ? (
                        <ExpoImage
                          source={{ uri: member.avatar }}
                          style={styles.tagPickerAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.tagPickerAvatar, styles.tagPickerAvatarFallback]}>
                          <Text style={styles.tagPickerAvatarInitial}>
                            {(member.name ?? "?")[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.tagPickerUserInfo}>
                        <Text style={styles.tagPickerName} numberOfLines={1}>
                          {member.name}
                        </Text>
                        {member.username && member.username !== member.name && (
                          <Text style={styles.tagPickerUsername} numberOfLines={1}>
                            @{member.username}
                          </Text>
                        )}
                      </View>
                      {member.onMic && (
                        <View style={styles.tagPickerMicBadge}>
                          <Text style={styles.tagPickerMicText}>🎤</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Bottom icon bar — always visible */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.bottomIconBtn}
              onPress={handleToggleSpeaker}
            >
              {isSpeakerMuted ? (
                <VolumeX size={20} color="white" />
              ) : (
                <Volume2 size={20} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIconBtn} onPress={handleOpenMediaPicker}>
              <Smile size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIconBtn} onPress={handleOpenPartyChat}>
              <MessageSquare size={20} color={showChatInput ? "#4dc8ff" : "white"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bottomIconBtn, styles.giftShortcutHighlight]}
              onPress={() => setShowBackpack(true)}
            >
              <Text style={styles.giftShortcutEmoji}>💰</Text>
              <Text style={styles.giftShortcutLabel}>Recharge{"\n"}Bonus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIconBtn} onPress={() => setShowPlayCenter(true)}>
              <LayoutGrid size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0a2e" },
  bgImage: { position: "absolute", width: "100%", height: "100%" },
  bgOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(30,10,60,0.72)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  ownerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  ownerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#a78bfa",
  },
  ownerAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerInitial: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  ownerTextCol: {
    gap: 2,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  ownerName: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  ownerId: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    flexShrink: 1,
  },
  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#392257ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  plusBtnFollowing: {
    backgroundColor: "rgba(124,77,255,0.3)",
    borderColor: "rgba(167,139,250,0.6)",
    shadowOpacity: 0.2,
  },  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: "rgba(15,7,32,0.85)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "600",
  },
  audienceScroll: { flex: 1, minWidth: 0 },
  audienceScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
  },
  audienceItem: { position: "relative" },
  audienceAvatarOverlap: { marginLeft: -8 },
  micStatusDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(15,7,32,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    zIndex: 10,
    elevation: 10,
  },
  audienceAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  audienceInitial: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  audienceAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1a0a2e",
  },
  audienceCount: {
    minWidth: 32,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginLeft: 4,
    flexShrink: 0,
  },
  audienceCountText: { color: "white", fontSize: 11, fontWeight: "700" },
  headerRight: { flexDirection: "row", gap: 6, flexShrink: 0 },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 10,
    overflow: "visible",
  },
  trophyBadge: {
    backgroundColor: "rgba(255,215,0,0.2)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.4)",
  },
  trophyText: { color: "#ffd700", fontSize: 12, fontWeight: "700" },
  badgeDot: { color: "rgba(255,255,255,0.3)", fontSize: 16 },
  badgeEmoji: { fontSize: 20 },
  seatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  seatItem: { width: SEAT_SIZE, alignItems: "center", gap: 4, overflow: "visible" },
  seatUserWrap: {
    position: "relative",
    width: SEAT_SIZE - 4,
    height: SEAT_SIZE - 4,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  activeRing: {
    position: "absolute",
    width: SEAT_SIZE - 2,
    height: SEAT_SIZE - 2,
    borderRadius: (SEAT_SIZE - 2) / 2,
    borderWidth: 3,
    borderColor: "#4ade80",
    backgroundColor: "transparent",
  },
  seatAvatar: {
    width: SEAT_SIZE - 10,
    height: SEAT_SIZE - 10,
    borderRadius: (SEAT_SIZE - 10) / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    zIndex: 1,
  },
  seatAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.45)",
    zIndex: 1,
  },
  seatActiveBorder: {
    borderColor: "#4ade80",
    borderWidth: 2,
  },
  seatInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  seatMicIcon: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(15,7,32,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
  },
  rankBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ffd700",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: "#000", fontSize: 9, fontWeight: "800" },
  seatEmpty: {
    width: SEAT_SIZE - 4,
    height: SEAT_SIZE - 4,
    borderRadius: (SEAT_SIZE - 4) / 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: { fontSize: 16 },
  seatNum: { color: "rgba(255,255,255,0.5)", fontSize: 10 },
  seatName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    textAlign: "center",
    maxWidth: SEAT_SIZE,
  },
  chatArea: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    minHeight: 0,
  },
  chatLeft: { flex: 1, minHeight: 0 },
  chatScroll: { flex: 1 },
  chatScrollContent: {
    gap: 8,
    paddingTop: 4,
    paddingBottom: 12,
  },
  systemMsg: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  systemMsgText: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  chatMsg: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#7c4dff",
  },
  chatAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBubble: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    padding: 8,
    flex: 1,
    overflow: "hidden",
  },
  // Extra clearance so message text doesn't sit flush against the VIP chat
  // frame image's border art — without this, text can visually touch/cross
  // the border instead of sitting inside it. overflow:visible (instead of
  // chatBubble's default "hidden") lets the frame's crown/gem art bleed
  // above/below the bubble instead of being clipped — see vipChatFrameStyle.
  chatBubbleVipPadding: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    overflow: "visible",
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
    flexWrap: "wrap",
  },
  chatUser: { color: "#b44dff", fontSize: 12, fontWeight: "700" },
  lvBadge: {
    backgroundColor: "#f5a623",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  lvText: { color: "white", fontSize: 10, fontWeight: "700" },
  newStartBadge: { width: 52, height: 24, marginLeft: 2 },
  chatCoin: { fontSize: 11, color: "#ffd700" },
  chatDiamond: { fontSize: 11, color: "#4dc8ff" },
  chatText: { color: "white", fontSize: 13 },
  chatGiftText: { color: "#f9a8d4", fontWeight: "700" },
  chatRight: { width: 60, alignItems: "center", gap: 10, justifyContent: "flex-end" },
  luckyStarBox: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
    padding: 6,
    width: 58,
  },
  luckyStarEmoji: { fontSize: 22 },
  luckyStarLabel: {
    color: "#ffd700",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  luckyProgress: {
    backgroundColor: "#8b0000",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
  },
  luckyProgressText: { color: "white", fontSize: 9, fontWeight: "700" },
  rightIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  treasureBoxBtn: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -6,
  },
  treasureBoxGif: {
    width: 72,
    height: 72,
  },
  rightIconEmoji: { fontSize: 22 },
  rightBannerBtn: {
    width: 44,
    height: 60,
    borderRadius: 10,
    backgroundColor:" rgba(61, 52, 88, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightBannerText: { fontSize: 26 },
  chatBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#4dc8ff",
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  chatBadgeText: { color: "white", fontSize: 9, fontWeight: "800" },
  giftBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#ff4ea3",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  giftBadgeText: { color: "white", fontSize: 10, fontWeight: "700" },
  takeMicBtn: {
    alignItems: "center",
    backgroundColor: "#16131eb3",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 6,
    width: 54,
  },
  takeMicEmoji: { fontSize: 20 },
  takeMicText: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },
  micMuteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  voiceDebugText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  bottomDock: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#110720",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  bottomIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftRow: { flex: 1, flexDirection: "row", gap: 8, justifyContent: "center" },
  giftShortcut: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftShortcutHighlight: {
    backgroundColor: "rgba(255,255,255,0.1)",
    width: 52,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 2,
  },
  giftShortcutEmoji: { fontSize: 14 },
  giftShortcutLabel: {
    color: "#ffd700",
    fontSize: 7,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 4,
    paddingTop: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    height: 34,
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 6,
    paddingVertical: 0,
    color: "white",
    fontSize: 14,
    borderWidth: 0,
  },
  sendBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 18,
    height: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: { color: "white", fontWeight: "700", fontSize: 13 },

  // Tag / @mention styles
  tagBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(124,77,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  tagBtnText: {
    color: "#b39dff",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 20,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    height: 36,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.4)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
    maxWidth: 110,
  },
  tagChipText: {
    color: "#d8c8ff",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  tagChipClose: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginLeft: 4,
    fontWeight: "700",
  },
  tagPickerContainer: {
    backgroundColor: "rgba(30,10,60,0.97)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.35)",
    maxHeight: 260,
    paddingBottom: 8,
  },
  tagPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  tagPickerTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  tagPickerClose: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "700",
  },
  tagPickerEmpty: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 13,
  },
  tagPickerList: {
    paddingHorizontal: 8,
  },
  tagPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 10,
  },
  tagPickerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  tagPickerAvatarFallback: {
    backgroundColor: "rgba(124,77,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  tagPickerAvatarInitial: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  tagPickerUserInfo: {
    flex: 1,
  },
  tagPickerName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  tagPickerUsername: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 1,
  },
  tagPickerMicBadge: {
    backgroundColor: "rgba(77,200,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagPickerMicText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: 12,
  },
  moreMenuBox: {
    backgroundColor: "#1a0a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    minWidth: 200,
    overflow: "hidden",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  moreMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 14,
  },
  moreMenuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
  },
  moreMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124,77,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreMenuLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Share modal ──
  shareOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  shareBox: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 20,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  shareHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(167,139,250,0.4)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  shareTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  sharePlatformRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  sharePlatformItem: { alignItems: "center", gap: 6 },
  sharePlatformIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  sharePlatformEmoji: { fontSize: 26 },
  sharePlatformLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "500",
  },
  shareTabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
    marginBottom: 8,
  },
  shareTabItem: { paddingVertical: 8, paddingHorizontal: 10, alignItems: "center" },
  shareTabText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" },
  shareTabTextActive: { color: "white" },
  shareTabUnderline: {
    height: 2,
    width: "100%",
    backgroundColor: "#7c4dff",
    borderRadius: 2,
    marginTop: 4,
  },
  shareBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  shareBtnText: { color: "white", fontSize: 14, fontWeight: "700" },
  shareCancelBtn: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
  },
  shareCancelText: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "600" },

  // ── Power modal ──
  powerBox: {
    backgroundColor: "#1a0a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingVertical: 18,
    paddingHorizontal: 20,
    minWidth: 220,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  powerOption: {
    alignItems: "center",
    gap: 14,
  },
  powerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#7c4dff",
    alignItems: "center",
    justifyContent: "center",
    // profile-style purple glow shadow
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 24,
    elevation: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  powerLabel: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  powerOverlay: {
    flex: 1,
    backgroundColor: "rgba(13,6,24,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Play center modal ──
  playCenterBox: {
    backgroundColor: "#1a0a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingVertical: 18,
    paddingHorizontal: 20,
    minWidth: 220,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  playCenterTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  playCenterRow: {
    flexDirection: "row",
    gap: 24,
  },
  playCenterItem: {
    alignItems: "center",
    gap: 8,
  },
  playCenterIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(124,77,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  playCenterEmoji: { fontSize: 28 },
  playCenterLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  powerExitIconWrap: {
    backgroundColor: "rgba(255,107,107,0.15)",
    borderColor: "rgba(255,107,107,0.3)",
  },

  // ── Gift / Listen Rewards panel ──
  giftPanelBox: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  giftBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(124,77,255,0.2)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  giftBannerText: { gap: 4 },
  giftBannerTitle: {
    color: "#c4b5fd",
    fontSize: 22,
    fontWeight: "800",
    fontStyle: "italic",
  },
  giftBannerSub: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "600",
    fontStyle: "italic",
  },
  giftBannerEmoji: { fontSize: 52 },
  giftCardsRow: {
    flexDirection: "row",
    gap: 12,
  },
  giftCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  giftCardImgWrap: {
    position: "relative",
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  giftCardImg: {
    width: 64,
    height: 64,
  },
  giftCardLockOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  giftCardLockIcon: {
    fontSize: 20,
  },
  giftCardLabel: {
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: "700",
  },
  giftCardReady: {
    borderColor: "#a78bfa",
    backgroundColor: "rgba(124,77,255,0.18)",
  },
  giftCardBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(124,77,255,0.15)",
  },
  giftCardBtnActive: {
    backgroundColor: "rgba(124,77,255,0.45)",
    borderColor: "#a78bfa",
  },
  giftCardBtnClaimed: {
    backgroundColor: "rgba(74,222,128,0.2)",
    borderColor: "#4ade80",
  },
  giftCardBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  giftCardBtnTextActive: {
    color: "white",
  },

  // ── Emoji / Stickers / GIF picker ──
  emojiBox: {
    height: H * 0.52,
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  emojiBoxBody: {
    flex: 1,
    minHeight: 0,
  },
  mediaSectionRow: {
    flexDirection: "row",
    backgroundColor: "rgba(124,77,255,0.12)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 10,
    gap: 4,
    flexShrink: 0,
  },
  mediaSectionTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  mediaSectionTabActive: {
    backgroundColor: "rgba(124,77,255,0.45)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.45)",
  },
  mediaSectionTabText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "700",
  },
  mediaSectionTabTextActive: {
    color: "white",
  },
  mediaSubTabScroll: {
    height: 50,
    maxHeight: 50,
    marginBottom: 8,
    flexShrink: 0,
    flexGrow: 0,
  },
  mediaSubTabContent: {
    gap: 8,
    paddingHorizontal: 2,
    alignItems: "center",
  },
  mediaSubTabItem: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.12)",
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  mediaSubTabItemActive: {
    backgroundColor: "rgba(124,77,255,0.35)",
    borderColor: "rgba(167,139,250,0.5)",
  },
  mediaSubTabIcon: { fontSize: 20, lineHeight: 22 },
  mediaSubTabLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 7,
    fontWeight: "600",
    marginTop: 1,
    textAlign: "center",
    maxWidth: 42,
  },
  mediaSubTabLabelActive: {
    color: "#e9d5ff",
  },
  emojiGrid: {
    flex: 1,
  },
  emojiGridContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  emojiGridInner: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 12,
  },
  emojiCell: {
    width: "12.5%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiCellText: { fontSize: 24 },
  stickerGridInner: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 12,
  },
  stickerCell: {
    width: "25%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  stickerCellEmoji: { fontSize: 44 },
  stickerCellImg: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  gifGridInner: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 12,
    gap: 8,
  },
  gifCell: {
    width: (W - 48) / 3,
    height: (W - 48) / 3,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
  },
  gifCellImg: {
    width: "100%",
    height: "100%",
  },
  chatMediaImg: {
    width: 140,
    height: 140,
    borderRadius: 10,
    marginTop: 4,
  },

  // ── Backpack modal ──
  backpackBox: {
    position: "relative",
    backgroundColor: "#0f0720",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 14,
  },
  bpBanner: {
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  bpBannerGift: { fontSize: 30 },
  bpBannerText: { flex: 1, color: "white", fontSize: 13, fontWeight: "700" },
  bpBannerArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  bpBannerArrowText: { color: "white", fontSize: 18, fontWeight: "700", lineHeight: 22 },
  bpPkBadge: {
    position: "absolute",
    top: 6,
    right: 50,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  bpPkBadgeText: { color: "#c4b5fd", fontSize: 10, fontWeight: "700" },
  bpCurrencyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 10,
  },
  bpCurrencyItem: { flexDirection: "row", alignItems: "center" },
  bpDiamondIcon: { fontSize: 20 },
  bpCoinIcon: { fontSize: 20 },
  bpCurrencyVal: { color: "white", fontSize: 15, fontWeight: "700", marginLeft: 5 },
  bpCurrencyChev: { color: "#a78bfa", fontSize: 15, fontWeight: "700" },
  bpGetListBtn: {
    marginLeft: "auto",
    backgroundColor: "rgba(124,77,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  bpGetListText: { color: "#c4b5fd", fontSize: 12, fontWeight: "600" },
  bpMainTabScroll: { borderBottomWidth: 1, borderBottomColor: "rgba(167,139,250,0.15)", flexGrow: 0, flexShrink: 0 },
  bpMainTabContent: { paddingHorizontal: 12, gap: 2 },
  bpMainTabItem: { paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  bpMainTabText: { color: "rgba(255,255,255,0.4)", fontSize: 15, fontWeight: "600" },
  bpMainTabTextActive: { color: "white" },
  bpMainTabUnderline: {
    height: 2,
    width: "80%",
    backgroundColor: "#a78bfa",
    borderRadius: 2,
    marginTop: 4,
  },
  bpScrollArea: { flex: 1 },

  // Random gifts
  bpRandomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 12,
    gap: 10,
  },
  bpRandomBox: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  bpRandomBoxEmoji: { fontSize: 26 },
  bpRandomBoxLabel: { color: "white", fontSize: 10, fontWeight: "700", textAlign: "center", marginTop: 3 },
  bpOrbWrap: { alignItems: "center", marginRight: 10, gap: 5 },
  bpOrbCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  bpOrbEmoji: { fontSize: 28 },
  bpOrbPrice: { color: "#c4b5fd", fontSize: 10, fontWeight: "700" },

  // Event banner
  bpEventBanner: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  bpEventIcon: { fontSize: 22 },
  bpEventText: { flex: 1, color: "white", fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  bpEventArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(167,139,250,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  bpEventArrowText: { color: "#a78bfa", fontSize: 18, fontWeight: "700", lineHeight: 22 },

  // Gift grid
  bpGiftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  bpGiftCard: {
    width: GIFT_CARD_W,
    backgroundColor: "rgba(124,77,255,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 5,
    position: "relative",
    overflow: "hidden",
  },
  bpGiftCardSelected: {
    borderColor: "#a78bfa",
    backgroundColor: "rgba(124,77,255,0.28)",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  bpGiftQtyBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 2,
    backgroundColor: "#7c4dff",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bpGiftQtyBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
  },
  bpHotBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "#ff4ea3",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  bpHotText: { color: "white", fontSize: 8, fontWeight: "800" },
  bpGiftSendBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(124,77,255,0.5)",
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bpGiftEmojiWrap: {
    width: GIFT_CARD_W - 20,
    height: GIFT_CARD_W - 20,
    borderRadius: (GIFT_CARD_W - 20) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bpGiftEmoji: { fontSize: 32 },
  bpGiftName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 2,
  },
  bpGiftPriceRow: { flexDirection: "row", alignItems: "center" },
  bpGiftPriceText: { color: "#c4b5fd", fontSize: 10, fontWeight: "700" },

  // Send bar
  bpSendBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.15)",
    backgroundColor: "#0f0720",
    gap: 10,
  },
  bpSendAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#7c4dff",
  },
  bpSendRecipient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  bpSendHeart: { fontSize: 13 },
  bpSendName: { color: "white", fontSize: 13, fontWeight: "600", flex: 1 },
  bpSendChev: { color: "#a78bfa", fontSize: 12 },
  bpSendQtyBtn: {
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  bpSendQtyText: { color: "white", fontSize: 13, fontWeight: "700" },
  bpSendBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  bpSendBtnText: { color: "white", fontSize: 15, fontWeight: "700" },

  giftReceiverOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  giftReceiverInlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 40,
    elevation: 40,
  },
  giftReceiverInlineBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  giftReceiverSheet: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    maxHeight: H * 0.55,
    zIndex: 41,
    elevation: 41,
  },
  giftRecipientEmpty: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  giftRecipientEmptyText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  giftReceiverTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  giftReceiverSubtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  giftRecipientList: {
    maxHeight: H * 0.38,
  },
  giftRecipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: "rgba(124,77,255,0.08)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  giftRecipientRowActive: {
    backgroundColor: "rgba(124,77,255,0.22)",
    borderColor: "rgba(167,139,250,0.45)",
  },
  giftRecipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#7c4dff",
  },
  giftRecipientInfo: { flex: 1, minWidth: 0 },
  giftRecipientName: { color: "white", fontSize: 15, fontWeight: "600" },
  giftRecipientMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  giftRecipientCheck: {
    color: "#a78bfa",
    fontSize: 18,
    fontWeight: "700",
  },

  // Backpack sub-tabs & empty
  bpSubTabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bpSubTabItem: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  bpSubTabItemActive: {
    backgroundColor: "rgba(124,77,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  bpSubTabText: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600" },
  bpSubTabTextActive: { color: "white" },
  bpEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  bpEmptyEmoji: { fontSize: 48 },

  // Activity event sub-tabs
  bpActEventScroll: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
    flexGrow: 0,
  },
  bpActEventContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  bpActEventTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  bpActEventTabActive: {
    backgroundColor: "rgba(124,77,255,0.35)",
    borderColor: "#a78bfa",
  },
  bpActEventText: { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" },
  bpActEventTextActive: { color: "white" },

  // ── Intimacy video thumbnail cards ──
  bpVideoThumb: {
    width: GIFT_CARD_W - 8,
    height: GIFT_CARD_W - 8,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a0d50",
    position: "relative",
  },
  bpVideoThumbImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  bpEmptyText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 24,
    width: "100%",
  },
  bpVideoNumBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bpVideoNumText: { color: "white", fontSize: 10, fontWeight: "800" },
  bpVideoPlayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
  },
  bpVideoShimmerWrap: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bpVideoShimmerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    letterSpacing: 3,
  },
  bpVideoTagText: { color: "#a78bfa", fontSize: 10, fontWeight: "600" },

  // ── Full-screen video player ──
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  videoHeaderTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  videoCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  videoCloseBtnText: { color: "white", fontSize: 20, fontWeight: "700" },
  videoWrapper: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlayer: {
    width: "100%",
    height: "75%",
  },

  // ── Special tab ──
  bpNewBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "#00c853",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    zIndex: 2,
  },
  bpNewBadgeText: { color: "white", fontSize: 8, fontWeight: "800" },

  // ── VIP tab ──
  bpVipBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  bpVipBannerGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  bpVipBannerIcon: { fontSize: 18 },
  bpVipBannerText: { flex: 1, color: "#ffd700", fontSize: 12, fontWeight: "700" },

  bpVipLockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bpVipLockCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(184,134,11,0.35)",
    borderWidth: 1.5,
    borderColor: "#b8860b",
    alignItems: "center",
    justifyContent: "center",
  },
  bpVipLockEmoji: { fontSize: 16 },
  bpVipTag: {
    backgroundColor: "#b8860b",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bpVipTagText: { color: "#fff8e1", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  bpVipPriceText: { color: "#ffd700", fontSize: 10, fontWeight: "700" },

  bpVipUpgradeBar: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    overflow: "hidden",
  },
  bpVipUpgradeGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  bpVipUpgradeText: { flex: 1, color: "#fff8e1", fontSize: 13, fontWeight: "700" },
  bpVipUpgradeBtn: {
    backgroundColor: "#fff8e1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  bpVipUpgradeBtnText: { color: "#7c4000", fontSize: 13, fontWeight: "800" },

  giftPurchaseOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  giftPurchaseBox: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#1a0a2e",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: "center",
  },
  giftPurchaseEmojiWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  giftPurchaseEmoji: { fontSize: 44 },
  giftPurchaseName: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  giftPurchasePrice: {
    color: "#c4b5fd",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  giftPurchaseBalance: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginBottom: 8,
  },
  giftPurchaseWarning: {
    color: "#f87171",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  giftPurchaseActions: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  giftPurchaseCloseBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    paddingVertical: 13,
    alignItems: "center",
  },
  giftPurchaseCloseText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "700",
  },
  giftPurchaseBuyBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  giftPurchaseBuyBtnDisabled: {
    opacity: 0.75,
  },
  giftPurchaseBuyGrad: {
    paddingVertical: 13,
    alignItems: "center",
  },
  giftPurchaseBuyText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  giftPopupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftPopupCard: {
    backgroundColor: "rgba(26,10,46,0.95)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.45)",
    paddingHorizontal: 36,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#ff4ea3",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  giftPopupEmoji: { fontSize: 64, marginBottom: 10 },
  giftPopupImage: { width: 96, height: 96, marginBottom: 10 },
  giftPopupTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  giftPopupSub: {
    color: "#f9a8d4",
    fontSize: 15,
    fontWeight: "700",
  },

  // ── Seat action popup (centered) ──
  seatActionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  seatActionCard: {
    width: "100%",
    backgroundColor: "#1e1035",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 16,
  },
  seatActionHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  seatActionHeaderEmoji: {
    fontSize: 38,
    marginBottom: 8,
  },
  seatActionHeaderTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  seatActionHeaderSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },
  seatActionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 18,
  },
  seatActionBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  seatActionBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 10,
  },
  seatActionBtnIcon: { fontSize: 20 },
  seatActionBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  seatActionCancelBtn: {
    marginTop: 4,
    paddingVertical: 13,
    alignItems: "center",
  },
  seatActionCancelText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Mic permission warning card ──
  micPermCard: {
    width: "82%",
    backgroundColor: "#12082b",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  // Top illustrated gradient section
  micPermIllustration: {
    width: "100%",
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Decorative background blobs
  micPermBlob1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(124,77,255,0.25)",
    top: -20,
    left: -30,
  },
  micPermBlob2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(168,85,247,0.2)",
    bottom: -10,
    right: -10,
  },
  // Phone-shaped card in the illustration
  micPermPhoneCard: {
    width: 110,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(168,85,247,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "flex-start",
    gap: 7,
  },
  micPermPhoneBar1: {
    width: "80%",
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(168,85,247,0.6)",
  },
  micPermPhoneBar2: {
    width: "55%",
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(168,85,247,0.35)",
  },
  micPermMicCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.5)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 2,
  },
  micPermPhoneBar3: {
    width: "65%",
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(168,85,247,0.35)",
  },
  // Small floating badge bottom-right of illustration
  micPermBadge: {
    position: "absolute",
    bottom: 22,
    right: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.4)",
    padding: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  micPermBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#a855f7",
  },
  micPermBadgeLine: {
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(168,85,247,0.5)",
  },
  // Text body section
  micPermBody: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
  },
  micPermMsg: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  // Button row
  micPermBtnRow: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  micPermCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  micPermCancelText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 15,
    fontWeight: "600",
  },
  micPermBtnDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  micPermOkBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  micPermOkText: {
    color: "#a855f7",
    fontSize: 15,
    fontWeight: "700",
  },

  // ── Pinned room message cards ──
  pinnedRulesCard: {
    backgroundColor: "#0e7c7b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 2,
  },
  pinnedRulesText: {
    color: "#e0ffff",
    fontSize: 12,
    lineHeight: 18,
  },
  pinnedWelcomeCard: {
    backgroundColor: "rgba(30,18,55,0.85)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  pinnedWelcomeText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  pinnedEditBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  pinnedEditBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  pinnedShareCard: {
    backgroundColor: "rgba(30,18,55,0.85)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  pinnedShareText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  pinnedShareBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  pinnedShareBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Welcome message edit modal ──
  welcomeEditOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  welcomeEditBox: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  welcomeEditTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  welcomeEditInput: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    color: "white",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 90,
    textAlignVertical: "top",
  },
  welcomeEditCount: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 16,
  },
  welcomeEditActions: {
    flexDirection: "row",
    gap: 12,
  },
  welcomeEditCancel: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  welcomeEditCancelText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "600",
  },
  welcomeEditSave: {
    flex: 1,
    backgroundColor: "#7c4dff",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  welcomeEditSaveText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});
