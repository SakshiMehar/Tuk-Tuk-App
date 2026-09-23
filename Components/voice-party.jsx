import { Audio } from "expo-av";
import * as Clipboard from "expo-clipboard";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  AlertCircle,
  Ban,
  BadgeCheck,
  Crown,
  LayoutGrid,
  MessageCircle,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  MoreVertical,
  Play,
  Plus,
  Power,
  Share2,
  Smile,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  X
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  DeviceEventEmitter,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { refreshTokenCache } from "../src/api/axios";
import {
  followRoom,
  getClaimedSeats,
  getRoomChatMessages,
  getRoomState,
  getRoomUserCount,
  postRoomHeartbeat,
  postSeatHeartbeat,
  unfollowRoom
} from "../src/api/partyApi";
import { reportUser } from "../src/api/postApi";
import { getUserUiAssets } from "../src/api/uiAssetsApi";
import { getUserProfile } from "../src/api/userApi";
import { getRoomShareUrl } from "../src/config/env";
import { NEW_USER_FRAME_LAYOUT } from "../src/constants/newUserFrameLayout";
import {
  VIP_CHAT_FRAME_FITTED_BY_TIER,
  VIP_PROFILE_FRAME_LAYOUT,
  VIP_TIER1_FALLBACK_ASSETS,
  VIP_TIER_THRESHOLDS,
  resolveVipTierFromAssetUrl,
} from "../src/constants/vip";
import {
  MEDIA_SECTIONS,
  emojiCategories,
  gifCategories,
  isChatMediaUrl,
  stickerPacks,
} from "../src/data/voicePartyMediaPicker";
import { useKeyboardInset } from "../src/hooks/useKeyboardInset";
import { useTreasureBoxProgress } from "../src/hooks/useTreasureBoxProgress";
import { useWalletBalance } from "../src/hooks/useWalletBalance";
import * as agoraVoice from "../src/services/agoraVoiceService";
import { loadConversations } from "../src/services/chatService";
import { fetchUserDecorations } from "../src/services/decorationsService";
import {
  adjustInventoryQty,
  buyGiftToBackpack,
  claimRewardToBackpack,
  findInventoryGift,
  giftsMatch,
  loadGiftCatalog,
  loadGiftInventory,
  loadListenRewardStatus,
  loadPartyGiftCatalog,
  normalizeGiftAnimation,
  parseBuyResultInventory,
  reconcileInventory,
  sendPartyRoomGift,
  syncListenRewardProgress,
} from "../src/services/giftCatalogService";
import { loadUserDetail } from "../src/services/nearbyService";
import { syncNewUserFrameForSession } from "../src/services/newUserFrameService";
import {
  createLocalChatMessage,
  enterRandomPartySession,
  enterRoomSession,
  exitRoomSession,
  fetchRoomAnnouncement,
  loadFollowingRooms,
  normalizeChatMessage,
  normalizeChatMessages,
  parseOnlineUsers,
  parseSeats,
  roomStateFromPayload,
  saveRoomAnnouncement,
  upsertChatMessage,
} from "../src/services/partyService";
import * as partyVoice from "../src/services/partyVoiceService";
import { loadPublicProfile } from "../src/services/publicProfileService";
import {
  blockUser,
  followUser,
  isSameUser,
  loadRelationshipStatus,
  unfollowUser,
} from "../src/services/relationshipService";
import { useMyCountryFlag } from "../src/services/userCountryService";
import { syncUserLevelForSession } from "../src/services/userLevelService";
import {
  getPkBattleRole,
  isPkBattleLive,
  isPkBattlePending,
  loadActivePkBattle,
  normalizePkBattle,
  respondPkBattle,
  startPkBattle,
} from "../src/services/pkBattleService";
import { loadMyVipAssets } from "../src/services/vipService";
import { wsService } from "../src/services/websocket";
import { getUser } from "../src/store/authStore";
import { applyWalletFromSources, refreshWalletBalance } from "../src/store/walletStore";
import { openUserChat } from "../src/utils/chatNavigation";
import { resolveLocalLevelBadge } from "../src/utils/levelBadge";
import { resolveNewUserFrameSource } from "../src/utils/newUserFrame";
import { resolveProfileAvatarSource, resolveProfileAvatarUri } from "../src/utils/profileAvatar";
import { ms, s, useResponsive, vs } from "../src/utils/responsive";
import { getAppUserId } from "../src/utils/sessionUser";
import { resolveImageSource, resolveVideoSource } from "../src/utils/videoSource";
import { extractVipProfileFrameUrl } from "../src/utils/vipProfileFrame";
import PkAcceptTeamModal from "./PkAcceptTeamModal";
import PkBattleModal from "./PkBattleModal";
import PkLiveBanner from "./PkLiveBanner";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";
import ReportReasonModal from "./ReportReasonModal";
import RoomUserProfilePopup from "./RoomUserProfilePopup";
import TopGiftingRanking from "./TopGiftingRanking";
import TreasureBoxModal from "./TreasureBoxModal";
import DiamondRechargeModal from "./DiamondRechargeModal";

const { width: W, height: H } = Dimensions.get("window");
// Keep W/H live — on foldables or edge-to-edge layout shifts, refresh the values
Dimensions.addEventListener("change", ({ window }) => {
  // StyleSheet values are computed once, but absolute-positioned bg covers
  // are replaced with "100%" via StyleSheet below, so this is only needed
  // for any future dynamic usage.
});

const TREASURE_BOX_GIF = require("../assets/Gift/tresurebox.gif");
const NEW_START_BADGE = require("../assets/Batches/newstart-batch.png");
const VERIFIED_BADGE = require("../assets/Batches/verified-batch.png");
const ROOM_HEADER_BG = require("../assets/images/roomHeaderBg.png");

// Same per-tier VIP "logo" crest used as the VIP badge everywhere else it
// appears (UserProfileView, VipCenterPanel's tier carousel) — used here to
// show a VIP badge next to OTHER senders' names in chat, since only the
// tier-baked-into-the-URL is known for them (msg.vipProfileFrameUrl /
// userFrameData[userId].vipProfileFrameUrl), not their full asset bundle.
const VIP_LOGO_BY_TIER = Object.fromEntries(
  VIP_TIER_THRESHOLDS.map(({ tier, assets }) => [tier, assets?.logo ?? null]),
);

// These S3 icons are 1280x720 canvases with the actual glyph confined to a small
// centered region (huge transparent margin baked into the file), so rendering them
// with plain resizeMode="contain" scales the whole padded canvas, not just the
// glyph, and they look tiny no matter how big the Image style box is. Each one is
// "cropped" at render time instead: the Image is drawn oversized (scaled up from
// its native 1280x720) and shifted with negative left/top so only the glyph's own
// region lands inside a same-sized, overflow:hidden wrapper — see *_CROP below,
// values derived from each icon's actual alpha bounding box.
const RECHARGE_BONUS_ICON = "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/gift+box1.png";
const GIFT_PANEL_ICON = "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/gift+box2.png";
const MIC_ICON = "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/mic.png";
const CHAT_ICON = "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/chat.png";

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
          existing.name && existing.name !== "Guest"
            ? existing.name
            : (name ?? existing.name ?? "User"),
        username: existing.username ?? username,
        // Always use local profile data for avatar fields on own seat.
        avatarId: user?.avatarId ?? existing.avatarId ?? null,
        avatar: resolvedAvatarUri ?? existing.avatar ?? null,
        avatarUrl: user?.avatarUrl ?? existing.avatarUrl ?? null,
        profilePicUrl: user?.profilePicUrl ?? existing.profilePicUrl ?? null,
        profileImageUrl:
          user?.profileImageUrl ?? existing.profileImageUrl ?? null,
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

// Presence (participants/onlineUsers) and seats are computed from separate
// backend sources that aren't updated atomically, so a single broadcast can
// carry a fresh seats map alongside a momentarily-stale presence list that's
// simply missing a still-seated user. Requiring the mismatch to repeat across
// consecutive updates (via staleSeatTracker) before clearing a seat avoids
// wiping a connected user's avatar for other clients on a one-off glitch,
// while still cleaning up genuine ghost seats after they persist.
const STALE_SEAT_MISS_THRESHOLD = 2;

const reconcileSeatAssignments = (
  parsedSeats,
  {
    onlineUsers = null,
    myUserId = null,
    mySeatNumber = null,
    staleSeatTracker = null,
  } = {},
) => {
  const next = parsedSeats.map((seat) => ({
    ...seat,
    user: seat.user ? { ...seat.user } : null,
  }));

  const onlineIds =
    Array.isArray(onlineUsers) && onlineUsers.length > 0
      ? new Set(
        onlineUsers
          .map((u) => (u?.id != null ? String(u.id) : null))
          .filter(Boolean),
      )
      : null;

  // If room presence is known, clear seats for users who already left.
  if (onlineIds) {
    for (let i = 0; i < next.length; i += 1) {
      const userId = next[i]?.user?.id != null ? String(next[i].user.id) : null;
      if (!userId) continue;
      if (onlineIds.has(userId)) {
        staleSeatTracker?.delete(userId);
        continue;
      }
      if (!staleSeatTracker) {
        next[i] = { ...next[i], user: null };
        continue;
      }
      const misses = (staleSeatTracker.get(userId) ?? 0) + 1;
      if (misses >= STALE_SEAT_MISS_THRESHOLD) {
        next[i] = { ...next[i], user: null };
        staleSeatTracker.delete(userId);
      } else {
        staleSeatTracker.set(userId, misses);
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

const micSeats = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  user: null,
  locked: false,
}));

const SEAT_SIZE = (W - 32 - 40) / 5;
const GIFT_CARD_W = (W - 32) / 4 - 6;

const formatGiftPrice = (price) => Number(price ?? 0).toLocaleString();

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
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.5, { duration: CYCLE }),
        ),
        -1,
      );
      o1.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 0 }),
          withTiming(0, { duration: CYCLE }),
        ),
        -1,
      );
      s2.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1.5, { duration: CYCLE }),
          ),
          -1,
        ),
      );
      o2.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(0.9, { duration: 0 }),
            withTiming(0, { duration: CYCLE }),
          ),
          -1,
        ),
      );
      s3.value = withDelay(
        1000,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1.5, { duration: CYCLE }),
          ),
          -1,
        ),
      );
      o3.value = withDelay(
        1000,
        withRepeat(
          withSequence(
            withTiming(0.9, { duration: 0 }),
            withTiming(0, { duration: CYCLE }),
          ),
          -1,
        ),
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

const resolveEntryFrameLayout = (frameUrl, user) => {
  const tierFromUrl = resolveVipTierFromAssetUrl(frameUrl);
  const tier = tierFromUrl ?? user?.vipTier ?? user?.tier ?? 1;

  if (tier === 1) {
    return {
      tier: 1,
      heightFrac: 0.48, // 108px for 225px width (VIP 1 has 1536x1024 canvas with transparent margins)
      bannerW: 225,
      avatarCenterX: 0.148,
      avatarCenterY: 0.492,
      avatarSizeFrac: 0.142,
      shiftX: 5.8,
      shiftY: -0.8,
      textLeftFrac: 0.22,
      textWidthFrac: 0.58,
      textTopFrac: 0.32,
      textHeightFrac: 0.16,
    };
  }

  if (tier === 3) {
    return {
      tier: 3,
      heightFrac: 0.35,
      bannerW: 245,
      avatarCenterX: 0.160,
      avatarCenterY: 0.468,
      avatarSizeFrac: 0.150,
      shiftX: 4.8,
      shiftY: -0.6,
      textLeftFrac: 0.25,
      textWidthFrac: 0.50,
      textTopFrac: 0.31,
      textHeightFrac: 0.24,
    };
  }

  if (tier === 8) {
    return {
      tier: 8,
      heightFrac: 0.417,
      bannerW: 245,
      avatarCenterX: 0.155,
      avatarCenterY: 0.478,
      avatarSizeFrac: 0.150,
      shiftX: 4.8,
      shiftY: -0.6,
      textLeftFrac: 0.25,
      textWidthFrac: 0.50,
      textTopFrac: 0.31,
      textHeightFrac: 0.24,
    };
  }

  // Tiers 2, 4, 5, 6, 7 (standard tight banner aspect ratio ~3.75:1, e.g. VIP 6 on ngrok)
  return {
    tier,
    heightFrac: 0.267,
    bannerW: 250,
    avatarCenterX: 0.200,
    avatarCenterY: 0.535,
    avatarSizeFrac: 0.138,
    shiftX: 1.5,
    shiftY: -0.6,
    textLeftFrac: 0.32,
    textWidthFrac: 0.38,
    textTopFrac: 0.38,
    textHeightFrac: 0.26,
  };
};

const UserEntryBanner = ({ user, countryFlag = null, onComplete }) => {
  const { W: SW } = useResponsive();
  const translateX = useSharedValue(-SW - 30);

  useEffect(() => {
    // Smooth glide from left to right (7.5s) once per entry, then auto-dismiss
    translateX.value = withTiming(
      SW + 30,
      { duration: 7500 },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      },
    );
  }, [SW, onComplete, translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Dynamic banner image URL resolution with safe fallback
  const frameUrl =
    user?.entryFrameUrl ||
    user?.newUserFrameUrl ||
    user?.bannerUrl ||
    user?.bannerImageUrl ||
    user?.frameUrl ||
    user?.entryFrame ||
    user?.banner ||
    user?.entry_frame_url ||
    user?.banner_url ||
    VIP_TIER1_FALLBACK_ASSETS.entryFrame;
  const hasFrame = Boolean(frameUrl);

  const userName =
    user?.name ||
    user?.username ||
    user?.nickname ||
    user?.displayName ||
    "User";

  const userAvatarUrl =
    user?.avatar ||
    user?.profileImageUrl ||
    user?.avatarUrl ||
    user?.profilePicUrl ||
    user?.profilePic ||
    user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c4dff&color=fff`;

  const layout = resolveEntryFrameLayout(frameUrl, user);
  const BANNER_W = Math.min(layout.bannerW, Math.round(SW * 0.56));
  const BANNER_H = Math.round(BANNER_W * layout.heightFrac);

  // Precise ring hole coordinates inside the frame scaled proportionally per tier artwork
  const avatarSize = Math.round(BANNER_W * layout.avatarSizeFrac);
  const avatarLeft = Math.round(BANNER_W * layout.avatarCenterX - avatarSize / 2) + layout.shiftX;
  const avatarTop = Math.round(BANNER_H * layout.avatarCenterY - avatarSize / 2) + layout.shiftY - 2;

  // Precise middle banner text region between ring and VIP crest
  const textLeft = Math.round(BANNER_W * layout.textLeftFrac);
  const textWidth = Math.round(BANNER_W * layout.textWidthFrac);
  const textTop = Math.round(BANNER_H * layout.textTopFrac);
  const textHeight = Math.round(BANNER_H * layout.textHeightFrac);

  return (
    <Animated.View
      style={[
        styles.entryBannerContainer,
        {
          width: BANNER_W,
          height: BANNER_H,
          alignSelf: "center",
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      {hasFrame ? (
        <>
          <Image
            source={{ uri: frameUrl }}
            style={[styles.entryBannerBg, { width: BANNER_W, height: BANNER_H }]}
            resizeMode="stretch"
          />
          {/* Pixel-locked avatar spot inside the left ring circle */}
          <View
            style={[
              styles.entryBannerFramedAvatarWrap,
              {
                left: avatarLeft,
                top: avatarTop,
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
          >
            <Image
              source={{ uri: userAvatarUrl }}
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              }}
              resizeMode="cover"
            />
          </View>
          {/* Centered name text inside banner section */}
          <View
            style={[
              styles.entryBannerFramedTextWrap,
              {
                left: textLeft,
                width: textWidth,
                top: textTop,
                height: textHeight,
              },
            ]}
          >
            <Text style={styles.entryBannerName} numberOfLines={1}>
              {userName}
              {!!countryFlag && ` ${countryFlag}`}
            </Text>
          </View>
        </>
      ) : (
        <View
          style={[
            styles.entryBannerContent,
            styles.entryBannerBgDefault,
            { width: BANNER_W, height: BANNER_H },
          ]}
        >
          <Image
            source={{ uri: userAvatarUrl }}
            style={styles.entryBannerAvatar}
            resizeMode="cover"
          />
          <View style={styles.entryBannerTextContainer}>
            <Text style={styles.entryBannerName} numberOfLines={1}>
              {userName}
              {!!countryFlag && ` ${countryFlag}`}
            </Text>
            <Text style={styles.entryBannerJoined}>joined the room</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const RoomActivityEventBanner = ({ event, onDismiss, onClap }) => {
  const { W: SW } = useResponsive();
  const translateX = useSharedValue(-SW * 0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!event) return;
    opacity.value = withTiming(1, { duration: 220 });
    translateX.value = withSpring(0, { damping: 14, stiffness: 140 });

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 240 });
      translateX.value = withTiming(-SW * 0.9, { duration: 240 }, (finished) => {
        if (finished && onDismiss) {
          runOnJS(onDismiss)();
        }
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [event, SW, onDismiss, opacity, translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  if (!event) return null;

  const user = event.user || {};
  const userName = user.name || user.username || "User";
  const avatarUri =
    user.avatar ||
    user.profileImageUrl ||
    user.avatarUrl ||
    user.profilePicUrl ||
    (user.id
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c4dff&color=fff`
      : null);

  let actionText = "entered the room";
  let actionColor = "#ffd54f"; // warm gold for enter
  let iconEmoji = "👏";

  if (event.type === "exit" || event.type === "leave") {
    actionText = "left the room";
    actionColor = "#cbd5e1"; // light slate for leave
    iconEmoji = "👋";
  } else if (event.type === "seat" || event.type === "seated") {
    actionText = event.seatId ? `seated on mic ${event.seatId}` : "seated";
    actionColor = "#4ade80"; // green for seated
    iconEmoji = "🎙️";
  }

  return (
    <Animated.View style={[styles.activityBannerContainer, animStyle]}>
      <LinearGradient
        colors={["rgba(26, 12, 54, 0.94)", "rgba(44, 18, 88, 0.90)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.activityBannerGradient}
      >
        {/* Left: Avatar DP */}
        <View style={styles.activityBannerAvatarWrap}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.activityBannerAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.activityBannerAvatar, styles.activityBannerAvatarFallback]}>
              <Text style={styles.activityBannerAvatarInitial}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Middle: Name & Action text */}
        <View style={styles.activityBannerTextCol}>
          <Text style={styles.activityBannerName} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={[styles.activityBannerAction, { color: actionColor }]} numberOfLines={1}>
            {actionText}
          </Text>
        </View>

        {/* Right: Quick interaction button (clapping / wave) */}
        <TouchableOpacity
          style={styles.activityBannerClapBtn}
          activeOpacity={0.7}
          onPress={() => onClap && onClap(event)}
        >
          <LinearGradient
            colors={["#8b5cf6", "#6d28d9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activityBannerClapGrad}
          >
            <Text style={styles.activityBannerClapText}>{iconEmoji}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

export const resolveGiftVisual = (giftOrPayload, catalog = null) => {
  if (!giftOrPayload) return { image: null, emoji: "🎁", name: "Gift" };

  const name = String(giftOrPayload?.name || giftOrPayload?.giftName || "Gift");
  let emoji = giftOrPayload?.emoji || giftOrPayload?.gift?.emoji || null;
  const explicitUrl =
    giftOrPayload?.imageUrl || giftOrPayload?.image || giftOrPayload?.videoUrl;

  const code = String(
    giftOrPayload?.giftCode ||
    giftOrPayload?.giftId ||
    giftOrPayload?.id ||
    giftOrPayload?.code ||
    "",
  )
    .toLowerCase()
    .trim();
  const lowerName = String(name).toLowerCase().trim();

  // If emoji is not provided directly, match in catalog
  if (!emoji && catalog) {
    const allCatalogItems = [
      ...(catalog.gift || []),
      ...(catalog.random || []),
      ...(catalog.activity || []),
      ...(catalog.special || []),
      ...(catalog.vip || []),
      ...(catalog.pk || []),
      ...(catalog.relationship || []),
    ];

    const match = allCatalogItems.find((item) => {
      const itemCode = String(
        item?.giftCode || item?.id || item?.code || "",
      )
        .toLowerCase()
        .trim();
      const itemName = String(item?.name || "")
        .toLowerCase()
        .trim();
      return (
        (code &&
          (itemCode === code ||
            itemCode === `gift-${code}` ||
            code === `gift-${itemCode}`)) ||
        (lowerName &&
          (itemName === lowerName ||
            lowerName.includes(itemName) ||
            itemName.includes(lowerName)))
      );
    });

    if (match?.emoji) {
      emoji = match.emoji;
    }
  }

  // Derive contextual emoji based on gift name if still missing
  if (!emoji || emoji === "🎁") {
    if (
      lowerName.includes("fire") ||
      lowerName.includes("flame") ||
      lowerName.includes("stadium")
    )
      emoji = "🔥";
    else if (
      lowerName.includes("flower") ||
      lowerName.includes("rose") ||
      lowerName.includes("blossom") ||
      lowerName.includes("tulip") ||
      lowerName.includes("bouquet")
    )
      emoji = "🌸";
    else if (
      lowerName.includes("heart") ||
      lowerName.includes("love") ||
      lowerName.includes("romance")
    )
      emoji = "💖";
    else if (
      lowerName.includes("kiss") ||
      lowerName.includes("lip")
    )
      emoji = "💋";
    else if (
      lowerName.includes("diamond") ||
      lowerName.includes("gem") ||
      lowerName.includes("crystal") ||
      lowerName.includes("ring") ||
      lowerName.includes("gold")
    )
      emoji = "💎";
    else if (
      lowerName.includes("rocket") ||
      lowerName.includes("space") ||
      lowerName.includes("galaxy")
    )
      emoji = "🚀";
    else if (
      lowerName.includes("car") ||
      lowerName.includes("ferrari") ||
      lowerName.includes("lambo") ||
      lowerName.includes("racing") ||
      lowerName.includes("sports")
    )
      emoji = "🏎️";
    else if (
      lowerName.includes("crown") ||
      lowerName.includes("king") ||
      lowerName.includes("queen") ||
      lowerName.includes("tiara")
    )
      emoji = "👑";
    else if (
      lowerName.includes("random") ||
      lowerName.includes("orb") ||
      lowerName.includes("magic") ||
      lowerName.includes("lucky")
    )
      emoji = "🔮";
    else if (
      lowerName.includes("lion") ||
      lowerName.includes("tiger") ||
      lowerName.includes("dragon")
    )
      emoji = "🦁";
    else if (
      lowerName.includes("castle") ||
      lowerName.includes("palace") ||
      lowerName.includes("mansion")
    )
      emoji = "🏰";
    else if (
      lowerName.includes("star") ||
      lowerName.includes("sparkle")
    )
      emoji = "⭐";
    else if (
      lowerName.includes("trophy") ||
      lowerName.includes("cup") ||
      lowerName.includes("champion")
    )
      emoji = "🏆";
    else if (
      lowerName.includes("party") ||
      lowerName.includes("confetti") ||
      lowerName.includes("celebrate")
    )
      emoji = "🎉";
    else if (
      lowerName.includes("yacht") ||
      lowerName.includes("boat") ||
      lowerName.includes("ship")
    )
      emoji = "🛥️";
    else if (
      lowerName.includes("plane") ||
      lowerName.includes("jet") ||
      lowerName.includes("flight")
    )
      emoji = "✈️";
    else if (!emoji) emoji = "🎁";
  }

  const isRemoteImage =
    typeof explicitUrl === "string" && explicitUrl.startsWith("http");

  return {
    image: isRemoteImage ? resolveImageSource(explicitUrl) : null,
    emoji,
    name,
  };
};

const GiftAnimationItem = ({ gift, catalog, onComplete }) => {
  const { W: SW } = useResponsive();

  const translateX = useSharedValue(-SW * 0.9);
  const opacity = useSharedValue(0);
  const scaleAnim = useSharedValue(0.2);
  const pulseScale = useSharedValue(1);
  const badgeScale = useSharedValue(0);

  const visual = useMemo(
    () => resolveGiftVisual(gift, catalog),
    [gift, catalog],
  );

  const displayEmoji = useMemo(() => {
    const fromGift =
      typeof gift?.emoji === "string" ? gift.emoji.trim() : "";
    if (fromGift && fromGift !== "🎁") return fromGift;
    const fromVisual =
      typeof visual?.emoji === "string" ? visual.emoji.trim() : "";
    if (fromVisual && fromVisual !== "🎁") return fromVisual;
    return fromGift || fromVisual || "🎁";
  }, [gift?.emoji, visual?.emoji]);

  useEffect(() => {
    // 1. Entrance slide & pop
    opacity.value = withTiming(1, { duration: 220 });
    translateX.value = withSpring(0, { damping: 14, stiffness: 140 });
    scaleAnim.value = withSequence(
      withDelay(60, withSpring(1.25, { damping: 7, stiffness: 180 })),
      withSpring(1.0, { damping: 12, stiffness: 140 }),
    );

    // 2. Dynamic Big & Small pulsing scale animation
    pulseScale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 300 }),
          withTiming(0.92, { duration: 300 }),
          withTiming(1.1, { duration: 250 }),
          withTiming(1.0, { duration: 250 }),
        ),
        -1,
        true,
      ),
    );

    // 3. Multiplier badge pop
    badgeScale.value = withDelay(
      180,
      withSequence(
        withSpring(1.3, { damping: 6, stiffness: 190 }),
        withSpring(1.0, { damping: 12, stiffness: 120 }),
      ),
    );

    // 4. Display for 2 seconds then smoothly slide out and fade
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 240 });
      translateX.value = withTiming(-SW * 0.9, { duration: 240 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [SW, badgeScale, onComplete, opacity, pulseScale, scaleAnim, translateX]);

  const bannerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const giftEmojiAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleAnim.value * pulseScale.value },
    ],
  }));

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const senderName = gift.senderName || "User";
  const qty = Math.max(1, Number(gift.quantity || gift.qty || 1));
  const receiverText = gift.receiverName ? `to ${gift.receiverName}` : "in room";

  return (
    <Animated.View
      style={[styles.giftBannerCard, bannerAnimStyle]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          "rgba(26, 12, 54, 0.96)",
          "rgba(48, 18, 92, 0.92)",
          "rgba(76, 29, 149, 0.90)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.giftBannerGradient}
      >
        {/* Left: Sender Avatar */}
        <View style={styles.giftBannerAvatarWrap}>
          {gift.senderAvatar ? (
            <Image
              source={{ uri: gift.senderAvatar }}
              style={styles.giftBannerAvatar}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.giftBannerAvatar,
                styles.giftBannerAvatarFallback,
              ]}
            >
              <Text style={styles.giftBannerAvatarInitial}>
                {senderName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.giftBannerSparkleBadge}>
            <Text style={{ fontSize: 9, lineHeight: 10 }}>⭐</Text>
          </View>
        </View>

        {/* Center: Sender Name & Gift Text */}
        <View style={styles.giftBannerTextCol}>
          <Text style={styles.giftBannerSenderName} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={styles.giftBannerActionText} numberOfLines={1}>
            sent {visual.name || "gift"} {receiverText}
          </Text>
        </View>

        {/* Right: Pop Animated Gift Visual with Multiplier Badge */}
        <View style={styles.giftBannerVisualWrap}>
          <View style={styles.giftBannerGlowBackdrop} />
          <Animated.View
            style={[styles.giftBannerImageContainer, giftEmojiAnimStyle]}
          >
            {visual.image ? (
              <Image
                source={visual.image}
                style={styles.giftBannerImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.giftBannerEmojiMain}>
                {displayEmoji}
              </Text>
            )}
          </Animated.View>

          {/* Multiplier Badge */}
          <Animated.View
            style={[styles.giftBannerMultiplierBadge, badgeAnimStyle]}
          >
            <LinearGradient
              colors={["#FFE066", "#FFA500", "#FF4500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.giftBannerMultiplierGrad}
            >
              <Text style={styles.giftBannerMultiplierText}>×{qty}</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const FloatingGiftRiseItem = ({ gift, catalog, onComplete }) => {
  const { W: SW, H: SH } = useResponsive();

  const translateY = useSharedValue(SH * 0.82);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);
  const swayX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const initialX = useMemo(() => {
    return SW * 0.5 - s(30) + (Math.random() - 0.5) * s(120);
  }, [SW]);

  const visual = useMemo(
    () => resolveGiftVisual(gift, catalog),
    [gift, catalog],
  );

  const displayEmoji = useMemo(() => {
    const fromGift =
      typeof gift?.emoji === "string" ? gift.emoji.trim() : "";
    if (fromGift && fromGift !== "🎁") return fromGift;
    const fromVisual =
      typeof visual?.emoji === "string" ? visual.emoji.trim() : "";
    if (fromVisual && fromVisual !== "🎁") return fromVisual;
    return fromGift || fromVisual || "🎁";
  }, [gift?.emoji, visual?.emoji]);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 180 });

    scale.value = withSequence(
      withTiming(1.4, { duration: 300 }),
      withTiming(1.1, { duration: 350 }),
      withDelay(1100, withTiming(0.85, { duration: 650 })),
    );

    swayX.value = withRepeat(
      withSequence(
        withTiming(-s(16), { duration: 600 }),
        withTiming(s(16), { duration: 600 }),
      ),
      -1,
      true,
    );

    rotate.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 500 }),
        withTiming(14, { duration: 500 }),
      ),
      -1,
      true,
    );

    translateY.value = withTiming(
      -vs(140),
      { duration: 2700 },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      },
    );

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400 });
    }, 2250);

    return () => clearTimeout(timer);
  }, [SH, onComplete, opacity, rotate, scale, swayX, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: swayX.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.floatingGiftRiseWrap,
        { left: initialX },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <View style={styles.floatingGiftRiseGlow}>
        <Text style={styles.floatingGiftRiseEmoji}>{displayEmoji}</Text>
      </View>
    </Animated.View>
  );
};

export default function VoiceParty() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [recentEntries, setRecentEntries] = useState([]);
  const [canShowEntryBanner, setCanShowEntryBanner] = useState(false);
  const prevOnlineUsersRef = useRef([]);
  const prevSeatsRef = useRef([]);
  const hasInitializedPresenceRef = useRef(false);
  const hasInitializedSeatsRef = useRef(false);

  // ── Real-time Room Activity Event Toast (Enter / Leave / Seated) ──
  const [currentActivityEvent, setCurrentActivityEvent] = useState(null);
  const activityEventQueueRef = useRef([]);
  const isProcessingActivityRef = useRef(false);
  const recentActivityEventsMapRef = useRef(new Map());

  const processNextActivityEvent = useCallback(() => {
    if (isProcessingActivityRef.current || activityEventQueueRef.current.length === 0) return;
    const next = activityEventQueueRef.current.shift();
    if (!next) return;
    isProcessingActivityRef.current = true;
    setCurrentActivityEvent(next);
  }, []);

  const enqueueActivityEvent = useCallback(
    (event) => {
      if (!event || !event.user) return;
      const uId = String(event.user.id ?? event.user.userId ?? "");
      if (!uId) return;

      // Deduplicate events for the same user and type within 4s
      const dedupKey = `${event.type}-${uId}`;
      const now = Date.now();
      const lastTime = recentActivityEventsMapRef.current.get(dedupKey);
      if (lastTime && now - lastTime < 4000) {
        return;
      }
      recentActivityEventsMapRef.current.set(dedupKey, now);

      if (recentActivityEventsMapRef.current.size > 50) {
        for (const [k, t] of recentActivityEventsMapRef.current.entries()) {
          if (now - t > 10000) {
            recentActivityEventsMapRef.current.delete(k);
          }
        }
      }

      activityEventQueueRef.current.push(event);
      processNextActivityEvent();
    },
    [processNextActivityEvent],
  );

  const handleActivityDismiss = useCallback(() => {
    setCurrentActivityEvent(null);
    isProcessingActivityRef.current = false;
    setTimeout(() => {
      processNextActivityEvent();
    }, 150);
  }, [processNextActivityEvent]);

  const handleActivityClap = useCallback(
    async (event) => {
      if (!event?.user || !roomId) return;
      const targetUser = event.user;
      const targetName = targetUser.name || targetUser.username || "Friend";
      const greeting =
        event.type === "exit" || event.type === "leave"
          ? `@${targetName} Bye! 👋 See you soon!`
          : event.type === "seat" || event.type === "seated"
            ? `@${targetName} 🎙️ Welcome to the mic!`
            : `@${targetName} 👏 Welcome to the room!`;
      try {
        await appendOutgoingMessage(greeting);
        await wsService.sendRoomMessage(String(roomId), greeting);
      } catch {
        // safe fallback
      }
    },
    [roomId],
  );

  useEffect(() => {
    setCanShowEntryBanner(false);
    if (!roomLoading && roomId) {
      const timer = setTimeout(() => {
        setCanShowEntryBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [roomLoading, roomId]);

  // Track Real-Time Seated Events
  useEffect(() => {
    if (!seats || !Array.isArray(seats)) return;

    if (!hasInitializedSeatsRef.current) {
      prevSeatsRef.current = seats;
      hasInitializedSeatsRef.current = true;
      return;
    }

    const prevSeats = prevSeatsRef.current || [];
    seats.forEach((seat) => {
      const prevSeat = prevSeats.find((s) => s.id === seat.id);
      const currUser = seat.user;
      const prevUser = prevSeat?.user;

      const currId = currUser?.id != null ? String(currUser.id) : null;
      const prevId = prevUser?.id != null ? String(prevUser.id) : null;

      if (currId && currId !== prevId) {
        enqueueActivityEvent({
          id: `seat-${currId}-${seat.id}-${Date.now()}`,
          type: "seat",
          seatId: seat.id,
          user: currUser,
        });
      }
    });

    prevSeatsRef.current = seats;
  }, [seats, enqueueActivityEvent]);

  const handleEntryComplete = useCallback((entryKeyOrId) => {
    setRecentEntries((prev) =>
      prev.filter(
        (u) =>
          u._entryKey !== entryKeyOrId &&
          u.id !== entryKeyOrId &&
          u.userId !== entryKeyOrId,
      ),
    );
  }, []);
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
  // The logged-in user's own gamification level — same value shown on the
  // Profile tab's level badge, used for the room's mini profile popup.
  const [myLevel, setMyLevel] = useState(1);
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
  const [claimedRewardModal, setClaimedRewardModal] = useState(null);
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);

  const displayActiveUsers = useMemo(() => {
    const list = Array.isArray(onlineUsers) ? [...onlineUsers] : [];
    const seenIds = new Set(
      list.map((u) => String(u?.id ?? u?.userId ?? "")).filter(Boolean),
    );

    // Include seated users if not already in onlineUsers list
    (seats || []).forEach((seat) => {
      const u = seat?.user;
      const uId = u?.id != null ? String(u.id) : u?.userId != null ? String(u.userId) : null;
      if (u && uId && !seenIds.has(uId)) {
        seenIds.add(uId);
        list.push({
          ...u,
          id: uId,
          userId: uId,
          name: u.name || u.username || "User",
        });
      }
    });

    // Include local session user / self if not in list
    if (myUserId && !seenIds.has(String(myUserId)) && localSessionUser) {
      seenIds.add(String(myUserId));
      list.push({
        ...localSessionUser,
        id: String(myUserId),
        userId: String(myUserId),
        name: localSessionUser.name || localSessionUser.username || "You",
      });
    } else if (hostId && !seenIds.has(String(hostId)) && roomInfo) {
      seenIds.add(String(hostId));
      list.push({
        id: String(hostId),
        userId: String(hostId),
        name: roomInfo.name || "Host",
        avatar: roomInfo.profileImageUrl || null,
        profileImageUrl: roomInfo.profileImageUrl || null,
      });
    }

    return list;
  }, [onlineUsers, seats, myUserId, localSessionUser, hostId, roomInfo]);

  const isUserSeated = useCallback(
    (userId) => {
      if (!userId) return false;
      return (seats || []).some((s) => {
        const u = s?.user;
        if (!u) return false;
        return (
          String(u.id || u.userId) === String(userId) ||
          String(u.id) === String(userId) ||
          String(u.userId) === String(userId)
        );
      });
    },
    [seats],
  );

  const seatedUsersCount = (seats || []).filter((s) => s?.user).length;
  const exitedRef = useRef(false);
  const onMicRef = useRef(false);
  const mySeatNumberRef = useRef(null);
  // Tracks consecutive presence-list misses per userId (see reconcileSeatAssignments).
  const staleSeatTrackerRef = useRef(new Map());
  // Bumped every time a live ui-state broadcast applies a seats update, so a
  // REST getRoomState() snapshot in flight can detect it's been superseded
  // by fresher socket data and skip overwriting it.
  const seatSyncTokenRef = useRef(0);
  const buyingGiftRef = useRef(false);
  const roomIdRef = useRef(roomIdParam);
  const isNavigatingToInboxRef = useRef(false);
  const fetchedUiAssetIdsRef = useRef(new Set());
  const { keyboardHeight, safeBottom, idleBottom } = useKeyboardInset();
  const [showPlayCenter, setShowPlayCenter] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [listenSeconds, setListenSeconds] = useState(0);
  const listenSecondsRef = useRef(0);
  const syncedListenSecondsRef = useRef(0);
  const activeListenSyncPromiseRef = useRef(null);
  const currentUtcDateRef = useRef(new Date().toISOString().slice(0, 10));
  const claimingRewardTierRef = useRef(null);
  const [rewardStates, setRewardStates] = useState([
    { claimed: false, rewardImg: null },
    { claimed: false, rewardImg: null },
    { claimed: false, rewardImg: null },
  ]);
  const [showDiamondRecharge, setShowDiamondRecharge] = useState(false);
  const [rechargeInitialTab, setRechargeInitialTab] = useState("diamonds");
  const [showTreasureBox, setShowTreasureBox] = useState(false);
  const [showPkBattle, setShowPkBattle] = useState(false);
  const [showPkTeamAccept, setShowPkTeamAccept] = useState(false);
  const [activePkBattle, setActivePkBattle] = useState(null);
  const [pkBattleActionLoading, setPkBattleActionLoading] = useState(false);
  // Synchronous reentrancy guard — `pkBattleActionLoading` state only takes
  // effect on the next render, so a real double-tap (two touch events before
  // React re-renders) can slip two requests through the state check alone.
  // The double request is what actually produces the "conflicts with
  // existing data" 409: the first create/respond succeeds, the second hits
  // the battle the first just made.
  const pkBattleActionInFlightRef = useRef(false);
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
  const [activeGiftDisplays, setActiveGiftDisplays] = useState([]);
  const [activeRisingGifts, setActiveRisingGifts] = useState([]);
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
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Welcome everyone! Let's chat and have fun together!",
  );
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showWelcomeEdit, setShowWelcomeEdit] = useState(false);
  const [welcomeDraft, setWelcomeDraft] = useState("");

  const videoPlayer = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (!showVideoModal || !currentVideo) {
      videoPlayer.pause();
      return undefined;
    }

    let cancelled = false;
    const source = resolveVideoSource(
      currentVideo.videoUrl ?? currentVideo.uri,
    );
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

    return () => {
      cancelled = true;
    };
  }, [
    showVideoModal,
    currentVideo?.id,
    currentVideo?.videoUrl,
    currentVideo?.uri,
  ]);
  const [mediaSection, setMediaSection] = useState("emoji");
  const [emojiTab, setEmojiTab] = useState("smileys");
  const [stickerTab, setStickerTab] = useState("reactions");
  const [gifTab, setGifTab] = useState("trending");
  const [showChatInput, setShowChatInput] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [profilePopupUser, setProfilePopupUser] = useState(null);
  const [profilePopupAvatarSource, setProfilePopupAvatarSource] =
    useState(null);
  const [profilePopupLoading, setProfilePopupLoading] = useState(false);
  const [profilePopupFollowing, setProfilePopupFollowing] = useState(false);
  const [profileFollowLoading, setProfileFollowLoading] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const [localSessionUser, setLocalSessionUser] = useState(null);
  const myCountryFlag = useMyCountryFlag();
  const hostId = roomInfo?.hostId ?? null;
  const isHostSelf = isSameUser(hostId, myUserId);
  const { treasureState, selectChest } = useTreasureBoxProgress(
    !roomLoading && Boolean(roomId),
  );
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
    const sub = DeviceEventEmitter.addListener(
      "userProfileUpdated",
      (updatedUser) => {
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
                name:
                  updatedUser?.name ?? updatedUser?.username ?? seat.user.name,
              },
            };
          }),
        );
      },
    );
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
    const allIds = [
      ...new Set([...seatUserIds, ...audienceUserIds, ...chatSenderIds]),
    ];
    const pending = allIds.filter(
      (userId) => !fetchedUiAssetIdsRef.current.has(userId),
    );

    if (pending.length === 0) return;

    pending.forEach((userId) => {
      fetchedUiAssetIdsRef.current.add(userId);
      getUserUiAssets(userId)
        .then((response) => {
          const showFrame = Boolean(
            response?.showNewUserFrame ??
            response?.hasNewUserFrame ??
            response?.data?.showNewUserFrame ??
            response?.data?.hasNewUserFrame ??
            false,
          );
          const frameUrl =
            response?.newUserFrameUrl ??
            response?.frameUrl ??
            response?.data?.newUserFrameUrl ??
            response?.data?.frameUrl ??
            null;
          const vipProfileFrameUrl =
            extractVipProfileFrameUrl(response) ??
            extractVipProfileFrameUrl(response?.data);
          setUserFrameData((prev) => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              hasNewUserFrame: showFrame,
              newUserFrameUrl: frameUrl,
              vipProfileFrameUrl,
            },
          }));
        })
        .catch((err) => {
          if (__DEV__)
            console.warn(
              `[VoiceParty] ui-assets fetch failed userId=${userId}:`,
              err?.message ?? err,
            );
        });

      // Same decorations (badge + frame) API used on the profile screens —
      // backend-assigned per user, independent of VIP tier — so the same
      // "verified"/decoration badge shown there also appears below every
      // sender's name here, not just the logged-in user's own messages.
      fetchUserDecorations(userId)
        .then(({ badgeUrl, frameUrl: decorationFrameUrl }) => {
          setUserFrameData((prev) => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              decorationBadgeUrl: badgeUrl,
              decorationFrameUrl,
            },
          }));
        })
        .catch(() => { });
    });
  }, [seats, onlineUsers, messages]);

  const hostUserLike = useMemo(() => {
    const fromSeat = seats.find(
      (seat) =>
        seat.user && isSameUser(seat.user.id ?? seat.user.userId, hostId),
    )?.user;
    if (fromSeat) return fromSeat;

    const fromOnline = onlineUsers.find((user) =>
      isSameUser(user.id ?? user.userId, hostId),
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
      Promise.all([
        loadPartyGiftCatalog().catch(() => null),
        loadGiftCatalog("gift").catch(() => []),
      ]).then(([catalog, giftItems]) => {
        if (cancelled) return;
        const nextCatalog = catalog ?? {
          random: [],
          gift: [],
          activity: [],
          activityByEvent: {},
          relationship: [],
          pk: [],
          special: [],
          vip: [],
        };
        setGiftCatalog({
          ...nextCatalog,
          gift: giftItems.length ? giftItems : nextCatalog.gift,
        });
      }),
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

    return () => {
      cancelled = true;
    };
  }, [showBackpack, catalogRefreshKey]);

  const refreshListenRewardStatus = useCallback(
    async (isDateReset = false) => {
      try {
        const data = await loadListenRewardStatus();
        if (!data) return;

        const responseDate = data.date ? String(data.date) : null;
        if (responseDate) {
          currentUtcDateRef.current = responseDate;
        }

        if (typeof data.listenedSeconds === "number") {
          const srvSec = Math.max(0, data.listenedSeconds);
          if (isDateReset) {
            // On date reset, set local baseline to server's new-day listenedSeconds
            listenSecondsRef.current = srvSec;
            setListenSeconds(srvSec);
            syncedListenSecondsRef.current = srvSec;
          } else {
            // On normal load/mount, advance baselines if server value is higher
            if (srvSec > listenSecondsRef.current) {
              listenSecondsRef.current = srvSec;
              setListenSeconds(srvSec);
            }
            if (srvSec > syncedListenSecondsRef.current) {
              syncedListenSecondsRef.current = srvSec;
            }
          }
        }

        if (Array.isArray(data.tiers) && data.tiers.length > 0) {
          setRewardStates((prev) =>
            data.tiers.map((t, idx) => {
              const existing = isDateReset ? {} : (prev[idx] || {});
              const threshold = Number(
                t.thresholdSeconds ?? LISTEN_THRESHOLDS[idx] ?? 0,
              );
              const isUnlocked = Boolean(
                t.unlocked ?? (listenSecondsRef.current >= threshold),
              );
              const isClaimed = Boolean(t.claimed);
              let rewardImg = existing.rewardImg;
              if (t.reward?.imageUrl) {
                rewardImg = { uri: t.reward.imageUrl };
              }
              return {
                ...existing,
                tier: t.tier ?? (idx + 1),
                thresholdSeconds: threshold,
                label: t.label ?? LISTEN_THRESHOLD_LABELS[idx],
                claimed: isClaimed,
                claimedAt: t.claimedAt ?? null,
                unlocked: isUnlocked,
                reward: t.reward ?? existing.reward ?? null,
                rewardImg,
              };
            }),
          );
        }
      } catch (err) {
        console.warn(
          "[VoiceParty] Failed to load listen reward status:",
          err?.message ?? err,
        );
      }
    },
    [],
  );

  // Load Listen Reward status when Listen Rewards modal opens or room initializes
  useEffect(() => {
    let cancelled = false;
    refreshListenRewardStatus(false);
    return () => {
      cancelled = true;
    };
  }, [showGiftPanel, roomId, refreshListenRewardStatus]);

  const flushListenRewardProgress = useCallback(
    async (targetRoomId) => {
      const activeRoom = String(targetRoomId || roomIdRef.current || "");
      if (!activeRoom) return;

      // 1. Wait for any currently in-flight sync to complete
      while (activeListenSyncPromiseRef.current) {
        try {
          await activeListenSyncPromiseRef.current;
        } catch {
          // Failure handled inside the sync promise
        }
      }

      // 2. Sequentially drain remaining unsynced delta in chunks of at most 120s
      while (true) {
        const deltaSeconds =
          listenSecondsRef.current - syncedListenSecondsRef.current;
        if (deltaSeconds <= 0) break;

        const sendDelta = Math.min(deltaSeconds, 120);

        const syncPromise = (async () => {
          try {
            const res = await syncListenRewardProgress({
              roomId: activeRoom,
              deltaSeconds: sendDelta,
            });
            if (res && res.success !== false) {
              syncedListenSecondsRef.current += sendDelta;
              return true;
            }
            return false;
          } catch (err) {
            console.warn(
              "[VoiceParty] Failed to sync listen reward progress:",
              err?.message ?? err,
            );
            return false;
          }
        })();

        activeListenSyncPromiseRef.current = syncPromise;

        let success = false;
        try {
          success = await syncPromise;
        } finally {
          if (activeListenSyncPromiseRef.current === syncPromise) {
            activeListenSyncPromiseRef.current = null;
          }
        }

        // If a request fails, stop draining loop (keep remaining delta unsynced for future retry)
        if (!success) break;
      }
    },
    [],
  );

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
        (user) => user?.id && user.name?.trim()?.toLowerCase() === name,
      );
      if (fromOnline?.id) return String(fromOnline.id);

      return null;
    },
    [onlineUsers],
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
      const fromOnline = onlineUsers.find(
        (user) => user?.id != null && String(user.id) === idStr,
      );
      if (fromOnline?.avatar) return fromOnline.avatar;
      const fromSeat = seats.find(
        (seat) => seat?.user?.id != null && String(seat.user.id) === idStr,
      );
      if (fromSeat?.user?.avatar) return fromSeat.user.avatar;
      return userProfileCache[idStr]?.avatarUrl ?? null;
    },
    [onlineUsers, seats, userProfileCache],
  );

  const resolveChatSenderName = useCallback(
    (userId, fallbackName) => {
      if (userId == null) return fallbackName;
      const idStr = String(userId);
      const fromOnline = onlineUsers.find(
        (user) => user?.id != null && String(user.id) === idStr,
      );
      if (fromOnline?.name) return fromOnline.name;
      const fromSeat = seats.find(
        (seat) => seat?.user?.id != null && String(seat.user.id) === idStr,
      );
      if (fromSeat?.user?.name) return fromSeat.user.name;
      return userProfileCache[idStr]?.name ?? fallbackName;
    },
    [onlineUsers, seats, userProfileCache],
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

      const fromOnline = onlineUsers.find(
        (user) => user?.id != null && String(user.id) === idStr,
      );
      if (fromOnline) return;
      const fromSeat = seats.find(
        (seat) => seat?.user?.id != null && String(seat.user.id) === idStr,
      );
      if (fromSeat?.user) return;

      avatarLookupAttemptedRef.current.add(idStr);
      loadUserDetail(idStr)
        .then((detail) => {
          setUserProfileCache((prev) => ({
            ...prev,
            [idStr]: {
              avatarUrl: detail?.avatarUrl ?? null,
              name: detail?.name ?? null,
            },
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
    if (!showBackpack || giftReceiverTouchedRef.current || giftReceiverId)
      return;
    const preferred = giftRecipientOptions[0]?.id ?? null;
    if (preferred) setGiftReceiverId(preferred);
  }, [showBackpack, giftRecipientOptions, giftReceiverId]);

  useEffect(() => {
    getAppUserId()
      .then((id) => setMyUserId(id))
      .catch(() => setMyUserId(null));
  }, []);

  useEffect(() => {
    const targetRoomId = roomIdRef.current || roomId;
    if (!targetRoomId || isHostSelf) {
      setIsFollowing(false);
      return;
    }
    let cancelled = false;
    loadFollowingRooms()
      .then((rooms) => {
        if (cancelled) return;
        const list = Array.isArray(rooms) ? rooms : [];
        const isFollowed = list.some((r) => {
          const id = r?.id ?? r?.roomId;
          return id != null && String(id).toLowerCase() === String(targetRoomId).toLowerCase();
        });
        setIsFollowing(Boolean(isFollowed));
      })
      .catch(() => {
        if (!cancelled) setIsFollowing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, isHostSelf]);

  const handleFollowToggle = async () => {
    const targetRoomId = roomIdRef.current || roomId;
    if (!targetRoomId || isHostSelf) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowRoom(targetRoomId);
        setIsFollowing(false);
      } else {
        await followRoom(targetRoomId);
        setIsFollowing(true);
      }
    } catch (err) {
      const rawError =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "";
      const lowerMsg = String(rawError).toLowerCase();

      // If backend reports out-of-sync state, sync local state
      if (lowerMsg.includes("not following")) {
        setIsFollowing(false);
      } else if (lowerMsg.includes("already follow")) {
        setIsFollowing(true);
      } else {
        Alert.alert(
          isFollowing ? "Unfollow failed" : "Follow failed",
          typeof rawError === "string" ? rawError : "Please try again.",
        );
      }
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
        if (!cancelled && levelData?.level != null) setMyLevel(levelData.level);
        let loadedVip = null;
        try {
          loadedVip = await loadMyVipAssets(levelData?.xp?.totalXp);
          if (!cancelled && loadedVip) setMyVipAssets(loadedVip);
        } catch (e) {
        }
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
        if (session.room?.body) setWelcomeMessage(session.room.body);
        fetchRoomAnnouncement(session.roomId)
          .then((announcement) => {
            if (!cancelled && announcement) setWelcomeMessage(announcement);
          })
          .catch(() => { });
        onMicRef.current = false;
        mySeatNumberRef.current = null;
        setOnMic(false);
        setMySeatNumber(null);
        setSeats(
          reconcileSeatAssignments(session.seats, {
            onlineUsers: session.onlineUsers,
            myUserId,
            mySeatNumber: null,
            staleSeatTracker: staleSeatTrackerRef.current,
          }),
        );
        setOnlineUsers(session.onlineUsers);
        setOnlineCount(session.onlineCount);

        // Show entry toast banner immediately upon entering the room
        const localUser = await getUser();
        if (localUser && !cancelled) {
          const resolvedAvatar =
            resolveProfileAvatarUri(localUser) ??
            localUser?.profilePicUrl ??
            localUser?.avatarUrl;
          const selfEntryUser = {
            id: localUser.id || "my-id",
            name: localUser.name || localUser.username || "You",
            avatar: resolvedAvatar,
            entryFrameUrl:
              loadedVip?.entryFrame || localUser?.newUserFrameUrl,
            newUserFrameUrl: localUser?.newUserFrameUrl,
            profileFrameUrl:
              loadedVip?.profileFrame || localUser?.vipProfileFrameUrl,
          };

          // Immediately display real-time "entered the room" toast banner
          enqueueActivityEvent({
            id: `enter-self-${Date.now()}`,
            type: "enter",
            user: selfEntryUser,
          });

          // Also trigger VIP entry banner if equipped
          setRecentEntries((prev) => [...prev, selfEntryUser]);
        }

        // Chat is session-local: start with a clean screen on every entry
        // instead of replaying the room's persisted message history.
        sessionMessageBaselineRef.current = session.messages.length;
        setMessages([]);

        // Deferred reconcile — fetch a fresh room snapshot a few seconds after
        // entry so any ghost/stale seat users the backend cleaned up are removed.
        setTimeout(async () => {
          if (cancelled) return;
          const tokenAtRequest = seatSyncTokenRef.current;
          try {
            const freshState = await getRoomState(String(session.roomId));
            if (cancelled) return;
            // A live ui-state broadcast already superseded this REST snapshot
            // while it was in flight — applying it now would clobber fresher
            // socket-driven seat data with stale REST data.
            if (seatSyncTokenRef.current !== tokenAtRequest) return;
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
                staleSeatTracker: staleSeatTrackerRef.current,
              }),
            );
          } catch {
            // Non-critical — ignore failures
          }
        }, 5000);

        setVoiceListenStatus("connecting");
        setIsSpeakerMuted(false);
        agoraVoice.toggleRemoteMute(false);

        const connectRoomAudio = async (attempt = 1) => {
          if (partyVoice.getActiveRoomId() === String(session.roomId)) {
            if (!cancelled) {
              setVoiceListenStatus("ready");
              agoraVoice.toggleRemoteMute(false);
            }
            return;
          }
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
              `${msg}\n\nYou can still chat in the room. Tap Reconnect to try audio again, or Claim seat to speak.`,
              [
                {
                  text: "Reconnect",
                  onPress: async () => {
                    setVoiceListenStatus("connecting");
                    try {
                      await partyVoice.reconnectAsListener(
                        String(session.roomId),
                      );
                      setVoiceListenStatus("ready");
                      agoraVoice.toggleRemoteMute(false);
                      setIsSpeakerMuted(false);
                    } catch (retryErr) {
                      setVoiceListenStatus("failed");
                      Alert.alert(
                        "Reconnect failed",
                        retryErr?.message ?? "Could not reconnect room audio.",
                      );
                    }
                  },
                },
                { text: "OK", style: "cancel" },
              ],
            );
          }
        };

        await connectRoomAudio();
      } catch (err) {
        if (!cancelled) {
          Alert.alert(
            isRandomParty ? "Could not join party room" : "Could not join room",
            err?.message || "Please try again.",
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
      if (isNavigatingToInboxRef.current) {
        // User opened Inbox/Chat — keep room session & audio alive
        return;
      }
      if (activeRoomId && !exitedRef.current) {
        exitedRef.current = true;
        const cleanup = async () => {
          await flushListenRewardProgress(activeRoomId).catch(() => { });
          await partyVoice.teardownVoice().catch(() => { });
          await exitRoomSession(String(activeRoomId)).catch(() => { });
        };
        cleanup();
      } else {
        partyVoice.teardownVoice().catch(() => { });
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

  const autoOpenedFollowModalRef = useRef(false);

  useEffect(() => {
    autoOpenedFollowModalRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!roomLoading && roomId && !autoOpenedFollowModalRef.current && !isHostSelf) {
      autoOpenedFollowModalRef.current = true;
      const timer = setTimeout(() => {
        setShowFollowModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [roomLoading, roomId, isHostSelf]);

  useEffect(() => {
    messageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    loadConversations()
      .then((conversations) => {
        const unread = conversations.reduce(
          (sum, chat) => sum + (chat.unread || 0),
          0,
        );
        setChatUnreadCount(unread);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 150);
    return () => clearTimeout(timer);
  }, [roomId, messages.length]);

  const handleGiftAnimationComplete = useCallback((displayKey) => {
    setActiveGiftDisplays((prev) =>
      prev.filter((g) => (g._displayKey || g.id) !== displayKey),
    );
  }, []);

  const handleRisingGiftComplete = useCallback((riseKey) => {
    setActiveRisingGifts((prev) =>
      prev.filter((g) => (g._riseKey || g.id) !== riseKey),
    );
  }, []);

  const revealGiftAnimation = useCallback((payload, fallbackGift) => {
    const animated = normalizeGiftAnimation(payload, fallbackGift);
    const key = `gift-disp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const riseKey = `gift-rise-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setActiveGiftDisplays((prev) => {
      const next = [...prev, { ...animated, _displayKey: key }];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
    setActiveRisingGifts((prev) => {
      const next = [...prev, { ...animated, _riseKey: riseKey }];
      return next.length > 5 ? next.slice(next.length - 5) : next;
    });
  }, []);

  useEffect(() => {
    if (!roomId) return undefined;
    const activeRoomId = String(roomId);

    wsService
      .connect()
      .then(() => {
        wsService.joinRoom(activeRoomId);
      })
      .catch((err) => {
        console.error("[VoiceParty] WS connection error:", err?.message || err);
      });

    // Pull whatever PK card already exists for this room on entry — the
    // `pk` topic below only pushes *changes*, so a battle created before
    // this client joined (or missed while briefly disconnected) needs an
    // explicit fetch, not just a subscription.
    loadActivePkBattle(activeRoomId)
      .then((battle) => {
        console.log("[VoiceParty][PK] initial active battle ->", battle);
        setActivePkBattle(battle);
      })
      .catch(() => {
        // Non-critical — the `pk` topic or the fallback poll will catch it.
      });

    const appendChatMessage = (payload) => {
      setMessages((prev) => upsertChatMessage(prev, payload));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const unsubChat = wsService.onRoomChat(String(roomId), appendChatMessage);
    const unsubChatSummary = wsService.onRoomChatSummary(
      String(roomId),
      async (summary) => {
        const remoteCount = summary?.messageCount;
        const baseline = sessionMessageBaselineRef.current;
        if (
          remoteCount == null ||
          baseline + messageCountRef.current >= remoteCount
        )
          return;
        try {
          const data = await getRoomChatMessages(String(roomId));
          // Only keep messages sent since this session started — never replay
          // pre-entry history back onto the cleaned screen.
          setMessages(normalizeChatMessages(data).slice(baseline));
          setTimeout(
            () => scrollRef.current?.scrollToEnd({ animated: true }),
            100,
          );
        } catch {
          // logged in partyApi
        }
      },
    );
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

      // An empty `seats: {}` payload is ambiguous (partial/diff broadcast vs.
      // an intentional "room is now empty" signal) — parseSeats treats "no
      // entries" as a full reset to 15 empty seats, so require at least one
      // entry here rather than resetting every occupied seat on a guess.
      if (payload?.seats && Object.keys(payload.seats).length > 0) {
        seatSyncTokenRef.current += 1;
        const nextSeats = parseSeats(payload.seats, payload);
        if (mySeatNumber) {
          enrichSeatsWithMyProfile(nextSeats, mySeatNumber).then((enriched) =>
            setSeats(
              reconcileSeatAssignments(enriched, {
                onlineUsers: hasPresenceSnapshot ? users : null,
                myUserId,
                mySeatNumber,
                staleSeatTracker: staleSeatTrackerRef.current,
              }),
            ),
          );
        } else {
          setSeats(
            reconcileSeatAssignments(nextSeats, {
              onlineUsers: hasPresenceSnapshot ? users : null,
              myUserId,
              mySeatNumber,
              staleSeatTracker: staleSeatTrackerRef.current,
            }),
          );
        }
      }
    });
    const unsubSpeaking = wsService.onRoomSpeaking(
      String(roomId),
      (payload) => {
        const speakerId = payload.userId;
        if (!speakerId) return;
        const isSpeaking = Boolean(payload.isSpeaking);
        setOnlineUsers((prev) =>
          prev.map((u) => ({
            ...u,
            isSpeaking: u.id === speakerId ? isSpeaking : u.isSpeaking,
          })),
        );
        setSeats((prev) =>
          prev.map((seat) => {
            if (!seat.user || String(seat.user.id) !== String(speakerId))
              return seat;
            return { ...seat, user: { ...seat.user, active: isSpeaking } };
          }),
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
      },
    );
    const unsubGiftAnimation = wsService.onRoomGiftAnimation(
      String(roomId),
      (payload) => {
        const senderId =
          payload?.senderId ??
          payload?.userId ??
          payload?.fromUserId ??
          payload?.from;
        let matchedUser = null;
        if (senderId) {
          matchedUser =
            onlineUsers.find(
              (u) => String(u.id || u.userId) === String(senderId),
            ) ||
            seats.find(
              (s) =>
                s.user &&
                String(s.user.id || s.user.userId) === String(senderId),
            )?.user;
        }

        const senderName =
          payload?.senderName ??
          payload?.sender ??
          payload?.userName ??
          payload?.username ??
          payload?.user?.name ??
          payload?.fromUser?.name ??
          payload?.nickname ??
          matchedUser?.name ??
          matchedUser?.username ??
          "User";

        const senderAvatar =
          payload?.senderAvatar ??
          payload?.avatar ??
          payload?.user?.avatar ??
          payload?.profileImageUrl ??
          payload?.profilePicUrl ??
          matchedUser?.profileImageUrl ??
          matchedUser?.avatar ??
          null;

        const receiverId = payload?.receiverId ?? payload?.toUserId;
        let matchedReceiver = null;
        if (receiverId) {
          matchedReceiver =
            onlineUsers.find(
              (u) => String(u.id || u.userId) === String(receiverId),
            ) ||
            seats.find(
              (s) =>
                s.user &&
                String(s.user.id || s.user.userId) === String(receiverId),
            )?.user ||
            (isSameUser(receiverId, hostId)
              ? { name: roomInfo?.name ?? "Host" }
              : null);
        }

        const receiverName =
          payload?.receiverName ??
          payload?.receiver ??
          payload?.toUser?.name ??
          matchedReceiver?.name ??
          (isSameUser(receiverId, hostId) ? "Host" : null);

        const enrichedPayload = {
          ...payload,
          senderName,
          senderAvatar,
          receiverName,
        };

        revealGiftAnimation(enrichedPayload);
        const giftName =
          payload?.giftName ??
          payload?.name ??
          payload?.gift?.name ??
          "a gift";
        const qty = Math.max(1, Number(payload?.quantity ?? payload?.qty ?? 1));
        const giftText = `sent ${payload?.emoji ?? "🎁"} ${giftName}${qty > 1 ? ` ×${qty}` : ""}`;
        const normalized = normalizeChatMessage({
          id: payload?.id ?? `gift-ws-${Date.now()}`,
          message: `${senderName} ${giftText}`,
          senderName,
          avatar: senderAvatar,
          text: `${senderName} ${giftText}`,
          isGift: true,
        });
        if (!normalized.text) return;
        setMessages((prev) => {
          const exists = prev.some(
            (m) => String(m.id) === String(normalized.id),
          );
          if (exists) return prev;
          return [...prev, normalized];
        });
        setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: true }),
          100,
        );
      },
    );
    // The room's live PK card — pushed on create/accept/reject/score
    // change/finish. This is what lets the challenged opponent (and
    // everyone else in the room) see the battle without polling.
    const unsubPk = wsService.onRoomPk(String(roomId), (payload) => {
      console.log("[VoiceParty][PK] WS push ->", payload);
      setActivePkBattle(normalizePkBattle(payload));
    });

    const unsubNotifications = wsService.onRoomNotifications(
      String(roomId),
      (payload) => {
        if (!payload) return;
        const eventType = String(payload.eventType || payload.type || "").toUpperCase();
        const uId = payload.userId != null ? String(payload.userId) : null;
        const uName = payload.userName || payload.senderName || payload.name || "User";
        const uAvatar =
          payload.profileImage ||
          payload.avatar ||
          payload.avatarUrl ||
          payload.profilePicUrl ||
          null;

        switch (eventType) {
          case "USER_JOINED":
          case "JOIN":
          case "USER_ENTERED": {
            if (uId) {
              const joinedUser = {
                id: uId,
                userId: uId,
                name: uName,
                avatar: uAvatar,
                profileImageUrl: uAvatar,
                profilePicUrl: uAvatar,
              };

              // Only enqueue toast if not self (self entry toast is triggered on room enter)
              if (String(uId) !== String(myUserId)) {
                enqueueActivityEvent({
                  id: `ws-enter-${uId}-${Date.now()}`,
                  type: "enter",
                  user: joinedUser,
                });
              }

              setOnlineUsers((prev) => {
                const exists = prev.some((u) => String(u?.id ?? u?.userId) === uId);
                if (exists) return prev;
                return [...prev, joinedUser];
              });
              setOnlineCount((prev) => prev + 1);
            }
            break;
          }

          case "USER_LEFT":
          case "LEAVE":
          case "EXIT":
          case "USER_EXIT": {
            if (uId) {
              const leftUser = {
                id: uId,
                userId: uId,
                name: uName,
                avatar: uAvatar,
              };

              enqueueActivityEvent({
                id: `ws-exit-${uId}-${Date.now()}`,
                type: "exit",
                user: leftUser,
              });

              setOnlineUsers((prev) =>
                prev.filter((u) => String(u?.id ?? u?.userId) !== uId),
              );
              setOnlineCount((prev) => Math.max(0, prev - 1));

              // Clear seat if left user was seated
              setSeats((prev) =>
                prev.map((seat) => {
                  if (seat.user && String(seat.user.id ?? seat.user.userId) === uId) {
                    return { ...seat, user: null };
                  }
                  return seat;
                }),
              );
            }
            break;
          }

          case "CHAT_MESSAGE":
          case "CHAT": {
            const chatMsgText = payload.message || payload.text || payload.content || "";
            if (!chatMsgText) break;
            const normalized = normalizeChatMessage({
              id: payload.id ?? `ws-chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              message: chatMsgText,
              text: chatMsgText,
              senderName: uName,
              user: uName,
              userId: uId,
              avatar: uAvatar,
              createdAt: payload.timestamp || new Date().toISOString(),
            });
            setMessages((prev) => upsertChatMessage(prev, normalized));
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            break;
          }

          case "GIFT_SENT":
          case "GIFT": {
            const giftName = payload.giftName || payload.name || "a gift";
            const qty = Math.max(1, Number(payload.quantity || payload.qty || 1));
            const receiverName = payload.receiverName || payload.receiver || null;
            revealGiftAnimation(
              {
                ...payload,
                senderName: uName,
                senderAvatar: uAvatar,
                receiverName,
                giftName,
                quantity: qty,
              },
              {
                senderName: uName,
                senderAvatar: uAvatar,
                receiverName,
                name: giftName,
                quantity: qty,
              },
            );

            const giftChatText = `sent 🎁 ${giftName}${qty > 1 ? ` ×${qty}` : ""}`;
            const normalized = normalizeChatMessage({
              id: payload.id ?? `ws-gift-${Date.now()}`,
              message: `${uName} ${giftChatText}`,
              text: `${uName} ${giftChatText}`,
              senderName: uName,
              avatar: uAvatar,
              isGift: true,
            });
            setMessages((prev) => upsertChatMessage(prev, normalized));
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            break;
          }

          case "MIC_MUTED":
          case "MIC_UNMUTED": {
            const isMuted = eventType === "MIC_MUTED" || payload.isMuted === true;
            const targetSeatId = Number(payload.seatNumber || payload.seatId);
            setSeats((prev) =>
              prev.map((seat) => {
                const matches = targetSeatId
                  ? seat.id === targetSeatId
                  : uId && String(seat.user?.id ?? seat.user?.userId) === uId;
                if (!matches || !seat.user) return seat;
                return {
                  ...seat,
                  user: { ...seat.user, muted: isMuted },
                };
              }),
            );
            break;
          }

          case "SEAT_TAKEN":
          case "SEAT_CLAIMED": {
            const targetSeatId = Number(payload.seatNumber || payload.seatId);
            if (targetSeatId) {
              setSeats((prev) =>
                prev.map((seat) => {
                  if (seat.id === targetSeatId) {
                    return {
                      ...seat,
                      user: {
                        ...(seat.user || {}),
                        id: uId,
                        userId: uId,
                        name: uName,
                        avatar: uAvatar,
                        active: false,
                        muted: false,
                      },
                    };
                  }
                  return seat;
                }),
              );

              enqueueActivityEvent({
                id: `ws-seat-${uId}-${targetSeatId}-${Date.now()}`,
                type: "seat",
                seatId: targetSeatId,
                user: { id: uId, userId: uId, name: uName, avatar: uAvatar },
              });
            }
            break;
          }

          case "SEAT_RELEASED":
          case "SEAT_LEFT": {
            const targetSeatId = Number(payload.seatNumber || payload.seatId);
            setSeats((prev) =>
              prev.map((seat) => {
                const matches = targetSeatId
                  ? seat.id === targetSeatId
                  : uId && String(seat.user?.id ?? seat.user?.userId) === uId;
                if (matches) {
                  return { ...seat, user: null };
                }
                return seat;
              }),
            );
            break;
          }

          default:
            break;
        }
      },
    );

    // STOMP delivers no backlog to a resubscribing client, so any seat/chat
    // updates broadcast during a brief drop (backgrounding, network blip)
    // are otherwise lost until the user leaves and re-enters the room.
    // Re-pull a full snapshot as soon as the socket comes back.
    const unsubReconnect = wsService.onReconnect(() => {
      const tokenAtRequest = seatSyncTokenRef.current;
      getRoomState(String(roomId))
        .then((freshState) => {
          if (seatSyncTokenRef.current !== tokenAtRequest) return;
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
              staleSeatTracker: staleSeatTrackerRef.current,
            }),
          );
        })
        .catch(() => {
          // Non-critical — a later reconnect or user action will re-sync.
        });
      loadActivePkBattle(String(roomId))
        .then(setActivePkBattle)
        .catch(() => {
          // Non-critical — the `pk` topic or the fallback poll will catch it.
        });
    });
    return () => {
      unsubChat();
      unsubChatSummary();
      unsubUi();
      unsubSpeaking();
      unsubGiftAnimation();
      unsubPk();
      unsubNotifications();
      unsubReconnect();
      if (!isNavigatingToInboxRef.current) {
        wsService.leaveRoom(activeRoomId);
      }
    };
  }, [roomId, mySeatNumber, myUserId, revealGiftAnimation]);

  const handleToggleMusic = useCallback(async () => {
    if (isMusicPlaying) {
      agoraVoice.stopAudioForEveryone();
      setIsMusicPlaying(false);
    } else {
      let hasMicPermission = true;
      if (Platform.OS === 'android') {
        hasMicPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      }

      if (!hasMicPermission) {
        setMicPermWarning('music');
        return;
      }

      try {
        let DocumentPicker = null;
        try {
          DocumentPicker = require("expo-document-picker");
        } catch (e) {
          console.warn("[voice-party] expo-document-picker unavailable:", e?.message ?? e);
        }

        if (!DocumentPicker || typeof DocumentPicker.getDocumentAsync !== "function") {
          Alert.alert(
            "Music Feature Unavailable",
            "Audio file picker is not available on this build.",
          );
          return;
        }

        const result = await DocumentPicker.getDocumentAsync({
          type: "audio/*",
          copyToCacheDirectory: false,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          if (onMic && isMicMuted && roomId && mySeatNumber) {
            try {
              await partyVoice.toggleMicMute(String(roomId), mySeatNumber, false);
              setIsMicMuted(false);
            } catch (e) {
            }
          }

          const localUri = result.assets[0].uri;
          agoraVoice.playAudioForEveryone(localUri);
          setIsMusicPlaying(true);
        }
      } catch (err) {
        console.error("Audio selection error:", err);
      }
    }
  }, [isMusicPlaying, onMic, isMicMuted, roomId, mySeatNumber]);

  const handleExitRoom = useCallback(async () => {
    setShowPowerMenu(false);
    isNavigatingToInboxRef.current = false;
    if (!roomId || exitedRef.current) {
      router.back();
      return;
    }
    exitedRef.current = true;
    try {
      await flushListenRewardProgress(roomId);
    } catch {
      // Non-blocking for room exit
    }
    try {
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
  }, [roomId, router, flushListenRewardProgress]);

  const promptExitConfirmation = useCallback(() => {
    Alert.alert(
      "Leave Room?",
      "Are you sure you want to leave the room?",
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => {
            // Keep user in the room
          },
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => {
            handleExitRoom();
          },
        },
      ],
      { cancelable: true },
    );
  }, [handleExitRoom]);

  // Intercept Android hardware back button — close any open chat input /
  // pickers / modals in order; show confirmation popup before leaving room.
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
      if (showGiftReceiverPicker) {
        setShowGiftReceiverPicker(false);
        return true;
      }
      if (purchaseGift) {
        setPurchaseGift(null);
        return true;
      }
      if (showBackpack) {
        setShowBackpack(false);
        return true;
      }
      if (showGiftPanel) {
        setShowGiftPanel(false);
        return true;
      }
      if (showTreasureBox) {
        setShowTreasureBox(false);
        return true;
      }
      if (showPlayCenter) {
        setShowPlayCenter(false);
        return true;
      }
      if (showPowerMenu) {
        setShowPowerMenu(false);
        return true;
      }
      if (showFollowModal) {
        setShowFollowModal(false);
        return true;
      }
      if (showActiveUsersModal) {
        setShowActiveUsersModal(false);
        return true;
      }
      if (showMoreMenu) {
        setShowMoreMenu(false);
        return true;
      }
      if (showReportModal) {
        setShowReportModal(false);
        return true;
      }
      if (showVideoModal) {
        setShowVideoModal(false);
        setCurrentVideo(null);
        return true;
      }
      if (profilePopupUser || profilePopupLoading) {
        closeProfilePopup();
        return true;
      }
      if (seatActionSheet) {
        setSeatActionSheet(null);
        return true;
      }
      if (micPermWarning) {
        setMicPermWarning(null);
        return true;
      }
      if (showWelcomeEdit) {
        setShowWelcomeEdit(false);
        return true;
      }

      // No modal is open — prompt exit confirmation
      promptExitConfirmation();
      return true; // prevent default navigation
    });
    return () => sub.remove();
  }, [
    promptExitConfirmation,
    showChatInput,
    showEmojiPicker,
    showTagPicker,
    showGiftReceiverPicker,
    purchaseGift,
    showBackpack,
    showGiftPanel,
    showTreasureBox,
    showPlayCenter,
    showPowerMenu,
    showFollowModal,
    showActiveUsersModal,
    showMoreMenu,
    showReportModal,
    showVideoModal,
    profilePopupUser,
    profilePopupLoading,
    seatActionSheet,
    micPermWarning,
    showWelcomeEdit,
    closeProfilePopup,
  ]);

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
        }),
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

  // Room presence heartbeat — fires every 25 s for ANY user in the room
  // (seated or just listening), independent of the mic-seat heartbeat above.
  // Backend auto-expires the room session (and decrements the public count)
  // after 90 s without one, so this must run for the whole time the room
  // screen is open, not just while on a seat.
  useEffect(() => {
    if (!roomId) return;

    const ping = async () => {
      try {
        if (wsService.connected) {
          wsService.sendRoomHeartbeat(String(roomId));
        } else {
          await postRoomHeartbeat(String(roomId));
        }
      } catch {
        // Non-critical — backend will expire the session after the timeout automatically
      }
    };

    ping(); // send immediately on entry
    const interval = setInterval(ping, 25_000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Belt-and-braces poll for the room's PK card — the `pk` WS topic should
  // push every create/accept/reject/score/finish, but if the backend only
  // wires up the *later* events (not the initial create), the challenged
  // opponent would otherwise never learn a battle exists until they leave
  // and re-enter the room. Cheap enough to just poll while one might be
  // pending/live; stops once we know there's nothing to wait on.
  useEffect(() => {
    if (!roomId) return undefined;
    if (activePkBattle && activePkBattle.status !== "PENDING" && activePkBattle.status !== "LIVE") {
      return undefined;
    }

    const interval = setInterval(() => {
      loadActivePkBattle(String(roomId))
        .then((battle) => {
          console.log("[VoiceParty][PK] poll active battle ->", battle);
          setActivePkBattle(battle);
        })
        .catch(() => {
          // Non-critical — next tick or the WS push will catch it.
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [roomId, activePkBattle]);

  // Listen Rewards progress sync & UTC midnight reset check — every 30 s
  useEffect(() => {
    if (!roomId) return undefined;

    const interval = setInterval(async () => {
      if (exitedRef.current || !roomId) return;

      const nowUtc = new Date().toISOString().slice(0, 10);
      if (currentUtcDateRef.current && nowUtc !== currentUtcDateRef.current) {
        // 1. Flush any remaining unsynced seconds for the ending UTC day first
        await flushListenRewardProgress(roomId);
        // 2. Fetch new day's backend status and reset baselines/tiers
        await refreshListenRewardStatus(true);
      } else {
        // Normal 30s progress sync
        await flushListenRewardProgress(roomId);
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [roomId, flushListenRewardProgress, refreshListenRewardStatus]);

  // Room user-count badge — refresh from the public count endpoint.
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    const fetchUserCount = async () => {
      try {
        const count = await getRoomUserCount(String(roomId));
        if (cancelled) return;
        if (typeof count === "number") setOnlineCount(count);
      } catch (error) {
      }
    };

    fetchUserCount();
    const interval = setInterval(fetchUserCount, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [roomId]);

  const applySeatsAfterClaim = async (claimData, seatNumber) => {
    const claimedState = roomStateFromPayload(claimData);
    let nextState = claimedState;
    if (!claimedState?.seats) {
      nextState = await getRoomState(String(roomId));
    }
    const nextSeats = await enrichSeatsWithMyProfile(
      parseSeats(nextState?.seats, nextState),
      seatNumber,
    );
    setSeats(
      reconcileSeatAssignments(nextSeats, {
        onlineUsers,
        myUserId,
        mySeatNumber: seatNumber,
        staleSeatTracker: staleSeatTrackerRef.current,
      }),
    );
    if (typeof nextState?.onlineCount === "number") {
      setOnlineCount(nextState.onlineCount);
    }
  };

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
            staleSeatTracker: staleSeatTrackerRef.current,
          }),
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
        reconcileSeatAssignments(freshSeats, {
          onlineUsers,
          myUserId,
          mySeatNumber,
          staleSeatTracker: staleSeatTrackerRef.current,
        }),
      );

      const emptySeats = freshSeats
        .filter((s) => !s.user && !s.locked)
        .map((s) => s.id);

      // If we already hold a seat number, try that first
      const candidates = mySeatNumber
        ? [mySeatNumber, ...emptySeats.filter((id) => id !== mySeatNumber)]
        : emptySeats;

      if (candidates.length === 0) {
        Alert.alert(
          "No seats available",
          "All microphone seats are currently full.",
        );
        setVoiceConnecting(false);
        return;
      }

      let targetSeat = null;
      let claimData = null;

      // Try each candidate seat until one succeeds
      for (const seatId of candidates) {
        try {
          const taken = await partyVoice.takeMic(String(roomId), seatId);
          targetSeat = seatId;
          claimData = taken?.claimData ?? taken;
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
                  ? {
                    ...s,
                    user: {
                      id: null,
                      name: "…",
                      active: false,
                      muted: false,
                    },
                  }
                  : s,
              ),
            );
            continue; // try next seat
          }
          // Non-409 error — stop and surface it
          throw err;
        }
      }

      if (targetSeat === null) {
        Alert.alert(
          "No seats available",
          "All microphone seats are currently full. Please try again.",
        );
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
      await applySeatsAfterClaim(claimData, targetSeat);
    } catch (err) {
      const msg = err?.message ?? "Could not start voice.";
      if (
        msg.toLowerCase().includes("auth token") ||
        msg.toLowerCase().includes("authentication token")
      ) {
        Alert.alert("Login required", "Please log in again to use voice chat.");
      } else if (msg.includes("permission")) {
        Alert.alert(
          "Microphone required",
          "Please allow microphone access to speak in the room.",
        );
      } else {
        Alert.alert("Claim seat failed", msg);
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

  const handleShareToChatList = useCallback(() => {
    const activeRoomId = roomIdRef.current || roomId;
    if (!activeRoomId) return;
    isNavigatingToInboxRef.current = true;
    setShowShareMenu(false);
    router.push({
      pathname: "/(tabs)/chat",
      params: {
        fromRoom: "true",
        shareRoomId: String(activeRoomId),
        shareRoomTitle: String(roomInfo?.name || "Voice Party Room"),
      },
    });
  }, [roomId, roomInfo?.name, router]);

  const handleShareRoom = useCallback(async () => {
    const activeRoomId = roomIdRef.current || roomId;
    if (!activeRoomId) {
      Alert.alert(
        "Share Room",
        "Cannot share room because room ID is unavailable.",
      );
      return;
    }

    const deepLink = getRoomShareUrl(activeRoomId); // https://tuktuk.live/room/:id
    const roomTitle = roomInfo?.name?.trim()
      ? `"${roomInfo.name.trim()}"`
      : "voice party room";

    // The message contains the room invite link that opens the app directly,
    // plus a Play Store fallback for users who don't have the app installed.
    const shareMessage =
      `Join me in ${roomTitle} on Tuk-Tuk! 🎉\n` +
      `Room link: ${deepLink}\n` +
      `Don't have Tuk-Tuk? Download: https://play.google.com/store/apps/details?id=tuk.tuk.app`;

    try {
      await Share.share(
        Platform.select({
          ios: {
            message: shareMessage,
            url: deepLink,
          },
          default: {
            title: `Join ${roomInfo?.name ?? "Voice Room"} on Tuk-Tuk`,
            message: shareMessage,
          },
        }),
      );
    } catch (err) {
      if (err?.name !== "AbortError" && !err?.message?.includes("dismiss")) {
        console.warn("[VoiceParty] Native share failed:", err);
        Alert.alert("Share", "Could not open share options. Please try again.");
      }
    }
  }, [roomId, roomInfo?.name]);

  const handleCopyRoomLink = useCallback(async () => {
    const activeRoomId = roomIdRef.current || roomId;
    if (!activeRoomId) {
      Alert.alert(
        "Copy Link",
        "Cannot copy link because room ID is unavailable.",
      );
      return;
    }
    try {
      const deepLink = getRoomShareUrl(activeRoomId); // tuktuk://room/:id
      await Clipboard.setStringAsync(deepLink);
      Alert.alert("Copied", "Room link copied to clipboard!");
    } catch (err) {
      console.warn("[VoiceParty] Copy link failed:", err);
      Alert.alert("Copy Link", "Failed to copy room link.");
    }
  }, [roomId]);

  const [shareTab, setShareTab] = useState("Recently");
  const scrollRef = useRef(null);
  const messageCountRef = useRef(0);
  // Total historical message count on the server at the moment this session
  // entered the room — the chat catch-up sync below uses this so it only ever
  // re-syncs messages sent DURING this session, never replays pre-entry history.
  const sessionMessageBaselineRef = useRef(0);

  const shareTabs = ["Recently", "Friends", "Followers", "Room Followers"];

  const sharePlatforms = [
    { label: "Friends", bg: "#8b5cf6", icon: "💬", onPress: handleShareToChatList },
    { label: "Share", bg: "#7c4dff", icon: "🪐", onPress: handleShareRoom },
    { label: "Copy Link", bg: "#4f46e5", icon: "🔗", onPress: handleCopyRoomLink },
    { label: "WhatsApp", bg: "#25d366", icon: "💬", onPress: handleShareRoom },
    { label: "Facebook", bg: "#1877f2", icon: "f", onPress: handleShareRoom },
    { label: "Instagram", bg: "#e1306c", icon: "📸", onPress: handleShareRoom },
  ];

  const handleReportRoomSubmit = async (reason) => {
    try {
      await reportUser(hostId, reason);
      setShowReportModal(false);
      Alert.alert("Reported", "This room has been reported. Thank you.");
    } catch (e) {
      throw new Error(
        e?.message || "Could not submit report. Please try again.",
      );
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
      ? [
        {
          icon: <Ban size={22} color="#a78bfa" />,
          label: "Block",
          onPress: handleBlockHost,
        },
      ]
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
    isNavigatingToInboxRef.current = true;
    router.push({
      pathname: "/(tabs)/chat",
      params: { fromRoom: String(roomId || roomIdParam || "") },
    });
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
      // userId is set here (not left to the server echo) so the sender's own
      // VIP/decoration badges show immediately — the local echo never used
      // to carry userId at all, so isSenderSelf was permanently false for it.
      extra: { level: user?.level ?? 1, userId: myUserId, ...extra },
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

  // PK battle opponent/teammate slots are seated members only (no audience).
  const pkOpponentCandidates = useMemo(() => {
    return (seats || [])
      .filter((s) => s?.user && s.user.id != null && !isSameUser(s.user.id, myUserId))
      .map((s) => ({
        id: String(s.user.id),
        name: s.user.name ?? s.user.username ?? "User",
        avatar: s.user.avatar ?? s.user.avatarUrl ?? null,
      }));
  }, [seats, myUserId]);

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
        `You need 💎 ${formatGiftPrice(price)} but only have 💎 ${formatGiftPrice(walletDiamonds)}. Recharge to continue.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Recharge",
            onPress: () => {
              setRechargeInitialTab("diamonds");
              setShowDiamondRecharge(true);
            },
          },
        ]
      );
      return;
    }

    buyingGiftRef.current = true;
    setCatalogLoading(true);
    try {
      const result = await buyGiftToBackpack({
        giftCode,
        giftId: purchaseGift.databaseId,
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
          boughtRow?.qty ?? 1,
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
        `${bought.emoji} ${bought.name} was added to your backpack.`,
      );
    } catch (err) {
      Alert.alert(
        "Purchase failed",
        err?.message || "Could not buy this gift.",
      );
    } finally {
      buyingGiftRef.current = false;
      setCatalogLoading(false);
    }
  };

  const toNumericId = (id) => {
    const n = Number(id);
    return Number.isFinite(n) ? n : id;
  };

  const handlePkConfirm = async ({ mode, opponentId, teamMemberIds, durationMinutes }) => {
    if (!isHostSelf) {
      Alert.alert("Not allowed", "Only the room host can start a PK battle.");
      return;
    }
    if (pkBattleActionInFlightRef.current) return;
    pkBattleActionInFlightRef.current = true;
    setPkBattleActionLoading(true);
    try {
      const battle = await startPkBattle({
        roomId,
        opponentHostId: toNumericId(opponentId),
        durationMinutes,
        teamAMemberIds:
          mode === "team" && teamMemberIds?.length
            ? teamMemberIds.map(toNumericId)
            : [],
      });
      setActivePkBattle(battle);
      setShowPkBattle(false);
    } catch (err) {
      if (err?.status === 409) {
        // A battle for this room already exists server-side (most often
        // one this same request duplicated) — pull the real one and show
        // it instead of leaving the user stuck on a bare error.
        setShowPkBattle(false);
        loadActivePkBattle(String(roomId))
          .then((fresh) => {
            if (fresh) {
              setActivePkBattle(fresh);
            } else {
              Alert.alert("Couldn't start PK", err?.message || "Please try again.");
            }
          })
          .catch(() => Alert.alert("Couldn't start PK", err?.message || "Please try again."));
      } else {
        Alert.alert("Couldn't start PK", err?.message || "Please try again.");
      }
    } finally {
      pkBattleActionInFlightRef.current = false;
      setPkBattleActionLoading(false);
    }
  };

  const handlePkRespond = async (accepted, teamMemberIds) => {
    if (!activePkBattle?.id || pkBattleActionInFlightRef.current) return;
    pkBattleActionInFlightRef.current = true;
    setPkBattleActionLoading(true);
    try {
      const battle = await respondPkBattle(
        activePkBattle.id,
        accepted,
        Array.isArray(teamMemberIds) && teamMemberIds.length
          ? teamMemberIds.map(toNumericId)
          : undefined,
      );
      setActivePkBattle(battle);
      setShowPkTeamAccept(false);
    } catch (err) {
      Alert.alert(
        accepted ? "Couldn't accept" : "Couldn't reject",
        err?.message || "Please try again.",
      );
    } finally {
      pkBattleActionInFlightRef.current = false;
      setPkBattleActionLoading(false);
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
        `You need 💎 ${formatGiftPrice(totalCost)} but only have 💎 ${formatGiftPrice(walletDiamonds)}.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Recharge",
            onPress: () => {
              setRechargeInitialTab("diamonds");
              setShowDiamondRecharge(true);
            },
          },
        ]
      );
      return;
    }

    const receiverId = giftReceiverId ?? hostId;
    if (!receiverId) {
      Alert.alert(
        "Select a person",
        "Tap the name to choose who receives this gift.",
      );
      openGiftReceiverPicker();
      return;
    }

    try {
      const user = await getUser();
      const senderName =
        user?.name ?? user?.username ?? user?.nickname ?? "You";
      const senderAvatar =
        user?.avatarUrl ?? user?.profilePicUrl ?? user?.avatar ?? null;
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

      revealGiftAnimation(
        {
          ...result,
          senderName,
          senderAvatar,
          receiverName: giftReceiverName,
        },
        {
          ...selectedGift,
          senderName,
          senderAvatar,
          receiverName: giftReceiverName,
          quantity: qty,
        },
      );

      const localMsg = createLocalChatMessage({
        text: giftText,
        user: senderName,
        avatar: senderAvatar,
        extra: {
          userId: myUserId,
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
      setShowBackpack(false);
      setShowGiftPanel(false);
      setShowGiftReceiverPicker(false);
    } catch (err) {
      Alert.alert("Send failed", err?.message || "Could not send gift.");
    }
  };

  // Inventory rows don't always carry the gift artwork, so fall back to the
  // catalog entry for the same gift code before showing the emoji placeholder.
  const resolveBackpackGiftImage = useCallback(
    (gift) => {
      const direct =
        gift?.imageUrl ||
        gift?.icon ||
        gift?.image ||
        gift?.iconUrl ||
        gift?.img ||
        gift?.thumbnailUrl;
      if (direct && typeof direct === "string" && direct.trim().length > 0) {
        return direct.trim();
      }
      const catalogGifts = [
        ...giftCatalog.gift,
        ...giftCatalog.random,
        ...giftCatalog.activity,
        ...giftCatalog.relationship,
        ...giftCatalog.pk,
        ...giftCatalog.special,
        ...giftCatalog.vip,
        ...Object.values(giftCatalog.activityByEvent || {}).flat(),
      ];
      const found = catalogGifts.find((item) => giftsMatch(item, gift));
      const foundUrl =
        found?.imageUrl ??
        found?.icon ??
        found?.image ??
        found?.iconUrl ??
        found?.img ??
        found?.thumbnailUrl ??
        null;
      if (foundUrl && typeof foundUrl === "string" && foundUrl.trim().length > 0) {
        return foundUrl.trim();
      }
      return null;
    },
    [giftCatalog],
  );

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
      (person) => String(person.id) === String(giftReceiverId),
    );
    if (found) return found;
    return {
      id: String(giftReceiverId),
      name: isSameUser(giftReceiverId, hostId)
        ? (roomInfo?.name ?? "Host")
        : "User",
      avatar: isSameUser(giftReceiverId, hostId)
        ? (roomInfo?.profileImageUrl ?? null)
        : null,
      subtitle: isSameUser(giftReceiverId, hostId) ? "Host" : null,
    };
  }, [giftReceiverId, giftRecipientOptions, hostId, roomInfo]);

  const giftReceiverName = selectedGiftRecipient?.name ?? "Select person";
  const giftSendBarBottom = Math.max(22, idleBottom + 6);

  const renderGiftRecipientAvatar = (
    person,
    sizeStyle = styles.bpSendAvatar,
  ) => {
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
      Alert.alert(
        "Profile unavailable",
        "User information is not available yet.",
      );
      return;
    }

    const lockedAvatarSource = resolveRoomUserAvatarSource(userLike);
    const initial = {
      id: userId,
      name: userLike?.name ?? userLike?.displayName ?? userLike?.username ?? "User",
      username: userLike?.username ?? userLike?.handle ?? userLike?.name,
      avatar: userLike?.avatar ?? userLike?.profilePicUrl ?? userLike?.avatarUrl,
      profilePicUrl: userLike?.profilePicUrl ?? userLike?.avatar,
      gender: userLike?.gender,
      level: userLike?.level ?? userLike?.userLevel,
      countryName: userLike?.countryName,
      countryCode: userLike?.countryCode,
      flagUrl: userLike?.flagUrl,
      badgeUrl: userLike?.badgeUrl,
    };
    setProfilePopupAvatarSource(lockedAvatarSource);
    setProfilePopupUser(initial);
    setProfilePopupLoading(true);
    setProfilePopupFollowing(false);

    try {
      if (!isSameUser(userId, myUserId)) {
        const status = await loadRelationshipStatus(userId).catch(() => ({
          following: false,
        }));
        setProfilePopupFollowing(Boolean(status?.following));
      }

      // Fetch dynamic profile: GET /api/app/users/user/profile/:userId
      try {
        const profileData = await getUserProfile(userId);
        const userProfile = profileData?.data ?? profileData?.user ?? profileData;
        if (userProfile) {
          setProfilePopupUser((prev) => ({
            ...(prev ?? initial),
            ...userProfile,
            id: userProfile.id ?? userId,
            name:
              userProfile.name ??
              userProfile.displayName ??
              userProfile.username ??
              prev?.name ??
              initial.name,
            gender: userProfile.gender ?? prev?.gender,
            level: userProfile.level ?? prev?.level,
            countryCode: userProfile.countryCode ?? prev?.countryCode,
            countryName: userProfile.countryName ?? prev?.countryName,
            flagUrl: userProfile.flagUrl ?? prev?.flagUrl,
            badgeUrl: userProfile.badgeUrl ?? prev?.badgeUrl,
            avatar: userProfile.avatar ?? userProfile.profilePicUrl ?? prev?.avatar,
            profilePicUrl:
              userProfile.profilePicUrl ?? userProfile.avatar ?? prev?.profilePicUrl,
          }));
          if (!lockedAvatarSource && (userProfile.avatar || userProfile.profilePicUrl)) {
            setProfilePopupAvatarSource(resolveRoomUserAvatarSource(userProfile));
          }
        }
      } catch (err) {
        console.warn("[voice-party] getUserProfile error:", err?.message ?? err);
        if (!isSameUser(userId, myUserId)) {
          try {
            const detail = await loadUserDetail(userId);
            setProfilePopupUser((prev) => ({
              ...(prev ?? initial),
              id: userId,
              name:
                detail?.name ?? detail?.displayName ?? prev?.name ?? initial.name,
              username:
                detail?.username ??
                detail?.handle ??
                prev?.username ??
                initial.username,
              gender: detail?.gender ?? prev?.gender,
            }));
            if (!lockedAvatarSource) {
              setProfilePopupAvatarSource(resolveRoomUserAvatarSource(detail));
            }
          } catch {
            // keep initial profile from room state
          }

          try {
            const { profile: publicProfile } = await loadPublicProfile(userId);
            if (publicProfile?.level != null) {
              setProfilePopupUser((prev) => ({
                ...(prev ?? initial),
                level: publicProfile.level,
                gender: publicProfile.gender ?? prev?.gender,
              }));
            }
          } catch {
            // no level badge for this user if the endpoint fails
          }
        }
      }
    } finally {
      setProfilePopupLoading(false);
    }
  };

  const handleProfileFollowToggle = async () => {
    const targetId = profilePopupUser?.id;
    if (!targetId || isSameUser(targetId, myUserId) || profileFollowLoading)
      return;

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
        err?.message || "Please try again.",
      );
    } finally {
      setProfileFollowLoading(false);
    }
  };

  const handlePopupChat = useCallback(() => {
    if (!profilePopupUser) return;
    const targetUser = {
      userId: profilePopupUser.id,
      name: profilePopupUser.name || profilePopupUser.username || "User",
      avatar:
        profilePopupAvatarSource?.uri ||
        profilePopupUser.profilePicUrl ||
        profilePopupUser.avatar ||
        profilePopupUser.profileImageUrl,
      level: profilePopupUser.level,
    };
    closeProfilePopup();
    isNavigatingToInboxRef.current = true;
    openUserChat(router, targetUser);
  }, [profilePopupUser, profilePopupAvatarSource, router]);

  const handlePopupSendGift = useCallback(() => {
    if (!profilePopupUser) return;
    const targetId = String(profilePopupUser.id);
    closeProfilePopup();
    giftReceiverTouchedRef.current = true;
    setGiftReceiverId(targetId);
    setShowBackpack(true);
    setBackpackMainTab("Gift");
  }, [profilePopupUser]);

  const handlePopupMention = useCallback(() => {
    if (!profilePopupUser) return;
    const targetMember = {
      id: String(profilePopupUser.id),
      name: profilePopupUser.name || "User",
      username: profilePopupUser.username || profilePopupUser.name || "User",
    };
    closeProfilePopup();
    handleTagUser(targetMember);
  }, [profilePopupUser, handleTagUser]);

  const handlePopupReport = useCallback(() => {
    if (!profilePopupUser) return;
    closeProfilePopup();
    setShowReportModal(true);
  }, [profilePopupUser]);

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
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          );
        } else {
          const { status } = await Audio.getPermissionsAsync();
          micGranted = status === "granted";
        }
      } catch {
        micGranted = false;
      }

      if (micGranted) {
        handleTakeSeat(seat.id);
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
        await partyVoice.leaveMic(String(roomId), mySeatNumber).catch(() => { });
        onMicRef.current = false;
        mySeatNumberRef.current = null;
        setOnMic(false);
        setMySeatNumber(null);
      }
      setVoiceConnecting(true);
      const taken = await partyVoice.takeMic(String(roomId), targetSeatId);
      onMicRef.current = true;
      mySeatNumberRef.current = targetSeatId;
      setOnMic(true);
      setMySeatNumber(targetSeatId);
      setIsMicMuted(false);
      setVoiceListenStatus("ready");
      await applySeatsAfterClaim(taken?.claimData ?? taken, targetSeatId);
    } catch (err) {
      onMicRef.current = false;
      mySeatNumberRef.current = null;
      setOnMic(false);
      setMySeatNumber(null);
      Alert.alert(
        "Claim seat failed",
        err?.message || "Could not take that seat. Please try again.",
      );
    } finally {
      setSeatActionLoading(false);
      setVoiceConnecting(false);
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
    frameConfig = SEAT_FRAME_CONFIG,
  ) => {
    const resolvedStyle = Array.isArray(imageStyle)
      ? imageStyle[0]
      : imageStyle;
    const size = resolvedStyle?.width ?? resolvedStyle?.height ?? 48;
    // Merge in fetched frame data so WebSocket seat resets don't lose it.
    const userId = user?.id != null ? String(user.id) : null;
    const fetched = userId ? (userFrameData[userId] ?? {}) : {};
    const userWithFrame = user
      ? {
        ...user,
        hasNewUserFrame: fetched.hasNewUserFrame ?? user.hasNewUserFrame,
        newUserFrameUrl: fetched.newUserFrameUrl ?? user.newUserFrameUrl,
      }
      : user;
    const imageSource = resolveRoomUserAvatarSource(userWithFrame);
    // Mic seats show the same circular VIP profile-frame ring used everywhere
    // else in the app — the entry frame (a wide horizontal banner asset) is
    // only for the one-time "entered the room" moment, not a permanent seat
    // decoration. Self uses the already-fetched myVipAssets; other seats use
    // the seat's own ui-assets fetch (fetched.vipProfileFrameUrl) — the
    // backend embeds this only when that user's own XP clears the threshold.
    const isSelf =
      userId != null && myUserId != null && userId === String(myUserId);
    const selfVipProfileFrame =
      isSelf && myVipAssets.unlocked ? myVipAssets.profileFrame : null;
    const otherUserVipProfileFrame =
      !isSelf && fetched.vipProfileFrameUrl
        ? { uri: fetched.vipProfileFrameUrl }
        : null;
    const isVipProfileFrame = Boolean(
      selfVipProfileFrame || otherUserVipProfileFrame,
    );
    const decorationFrame = fetched?.decorationFrameUrl ?? null;
    const frameSource =
      selfVipProfileFrame ??
      otherUserVipProfileFrame ??
      (decorationFrame ? { uri: decorationFrame } : null) ??
      resolveNewUserFrameSource(userWithFrame);
    const hasFrame = Boolean(frameSource);
    const activeFrameConfig = isVipProfileFrame
      ? VIP_PROFILE_FRAME_LAYOUT
      : frameConfig;

    return (
      <ProfileAvatarWithFrame
        user={userWithFrame}
        avatarSource={imageSource}
        frameSource={frameSource}
        size={typeof size === "number" ? size : 48}
        {...(decorationFrame
          ? {
            // Decoration frames: no explicit props — ProfileAvatarWithFrame
            // auto-measures the frame image and scales it around the photo.
            frameResizeMode: "contain",
          }
          : {
            frameScale: hasFrame ? activeFrameConfig.frameScale : NEW_USER_FRAME_LAYOUT.frameScale,
            frameResizeMode: hasFrame ? activeFrameConfig.frameResizeMode : "contain",
            frameOffsetX: hasFrame ? activeFrameConfig.frameOffsetX : 0,
            frameOffsetY: hasFrame ? activeFrameConfig.frameOffsetY : 0,
            frameBleed: hasFrame ? activeFrameConfig.frameBleed : 0,
            avatarBoost: hasFrame ? activeFrameConfig.avatarBoost : NEW_USER_FRAME_LAYOUT.avatarBoost,
            avatarOffsetY: hasFrame ? activeFrameConfig.avatarOffsetY : NEW_USER_FRAME_LAYOUT.avatarOffsetY,
          })}
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
        <View
          style={[
            styles.giftReceiverSheet,
            { paddingBottom: Math.max(32, idleBottom + 16) },
          ]}
        >
          <View style={styles.shareHandle} />
          <Text style={styles.giftReceiverTitle}>Send gift to</Text>
          <Text style={styles.giftReceiverSubtitle}>
            Choose who receives your gift
          </Text>
          {giftRecipientOptions.length === 0 ? (
            <View style={styles.giftRecipientEmpty}>
              <Text style={styles.giftRecipientEmptyText}>
                No one else is in the room yet. Invite friends to join, then
                pick them here.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.giftRecipientList}
              contentContainerStyle={styles.giftRecipientListContent}
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
                    {renderGiftRecipientAvatar(
                      person,
                      styles.giftRecipientAvatar,
                    )}
                    <View style={styles.giftRecipientInfo}>
                      <Text style={styles.giftRecipientName} numberOfLines={1}>
                        {person.name}
                      </Text>
                      {person.subtitle ? (
                        <Text
                          style={styles.giftRecipientMeta}
                          numberOfLines={1}
                        >
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
    const s = String((seconds % 3600) % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleClaimListenReward = async (reward, index) => {
    const tier = reward?.tier ?? (index + 1);
    const threshold = Number(
      reward?.thresholdSeconds ?? LISTEN_THRESHOLDS[index] ?? 0,
    );
    const isReady =
      !reward?.claimed &&
      (reward?.unlocked ||
        reward?.rewardImg != null ||
        listenSeconds >= threshold);
    const isClaimed = Boolean(reward?.claimed);
    const remaining = Math.max(0, threshold - listenSeconds);

    if (isClaimed) {
      return;
    }

    if (!isReady) {
      Alert.alert(
        "Keep Listening",
        `Unlock in ${formatListenTime(remaining)}`,
      );
      return;
    }

    if (claimingRewardTierRef.current === tier) {
      return;
    }

    claimingRewardTierRef.current = tier;
    try {
      const response = await claimRewardToBackpack({
        tier,
        roomId,
      });

      if (response && response.success !== false) {
        setRewardStates((prev) =>
          prev.map((r, idx) => {
            const itemTier = r.tier ?? (idx + 1);
            if (itemTier === tier || idx === index) {
              const rewardObj = response.reward ?? r.reward;
              const rewardImg = rewardObj?.imageUrl
                ? { uri: rewardObj.imageUrl }
                : r.rewardImg;
              return {
                ...r,
                claimed: true,
                claimedAt: response.claimedAt ?? new Date().toISOString(),
                reward: rewardObj,
                rewardImg,
              };
            }
            return r;
          }),
        );

        try {
          const inventory = await loadGiftInventory();
          if (Array.isArray(inventory)) {
            setBackpackGifts(inventory);
          }
        } catch (invErr) {
          console.warn(
            "[VoiceParty] Failed to refresh backpack inventory after claim:",
            invErr,
          );
        }

        Alert.alert(
          "🎁 Reward Claimed!",
          response?.message || "You received a gift! Check your backpack.",
        );
      } else {
        const errMsg = response?.message || "Could not claim reward.";
        Alert.alert("Claim Failed", errMsg);
      }
    } catch (err) {
      console.warn("[VoiceParty] Failed to claim listen reward:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not claim reward.";
      Alert.alert("Claim Failed", errMsg);
    } finally {
      claimingRewardTierRef.current = null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── VIDEO PLAYER MODAL ── */}
      <Modal
        visible={showVideoModal}
        transparent={false}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          setShowVideoModal(false);
          setCurrentVideo(null);
        }}
      >
        <View style={styles.videoPlayerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="black" />

          {/* Header */}
          <View style={styles.videoHeader}>
            <TouchableOpacity
              style={styles.videoCloseBtn}
              onPress={() => {
                setShowVideoModal(false);
                setCurrentVideo(null);
              }}
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
            {purchaseGift &&
              (() => {
                const purchasePrice = Math.max(
                  0,
                  Number(purchaseGift.price ?? 0),
                );
                const canAfford =
                  purchasePrice <= 0 || walletDiamonds >= purchasePrice;
                return (
                  <>
                    <LinearGradient
                      colors={["#2a0d50", "#4a1d80"]}
                      style={styles.giftPurchaseEmojiWrap}
                    >
                      <Text style={styles.giftPurchaseEmoji}>
                        {purchaseGift.emoji}
                      </Text>
                    </LinearGradient>
                    <Text style={styles.giftPurchaseName}>
                      {purchaseGift.name}
                    </Text>
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
                        style={[
                          styles.giftPurchaseBuyBtn,
                          (!canAfford || catalogLoading) &&
                          styles.giftPurchaseBuyBtnDisabled,
                        ]}
                        activeOpacity={0.85}
                        disabled={!canAfford || catalogLoading}
                        onPress={handleBuyGift}
                      >
                        <LinearGradient
                          colors={
                            canAfford && !catalogLoading
                              ? ["#7c4dff", "#4a6cf7"]
                              : ["#4a4a5a", "#3a3a4a"]
                          }
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
          <View
            style={styles.backpackBox}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ height: H * 0.82 }}>
              {/* Handle */}
              <View style={styles.shareHandle} />

              {/* Currency row */}
              <View style={styles.bpCurrencyRow}>
                <TouchableOpacity
                  style={styles.bpCurrencyItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setRechargeInitialTab("diamonds");
                    setShowDiamondRecharge(true);
                  }}
                >
                  <Text style={styles.bpDiamondIcon}>💎</Text>
                  <Text style={styles.bpCurrencyVal}>
                    {walletDiamonds.toLocaleString()}
                  </Text>
                  <Text style={styles.bpCurrencyChev}> ›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bpCurrencyItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setRechargeInitialTab("golds");
                    setShowDiamondRecharge(true);
                  }}
                >
                  <Text style={styles.bpCoinIcon}>🪙</Text>
                  <Text style={styles.bpCurrencyVal}>0</Text>
                  <Text style={styles.bpCurrencyChev}> ›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bpGetListBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bpGetListText}>Get on the list</Text>
                </TouchableOpacity>
              </View>

              {/* Main tabs */}
              {catalogLoading && (
                <ActivityIndicator
                  color="#a78bfa"
                  style={{ marginVertical: 8 }}
                />
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.bpMainTabScroll}
                contentContainerStyle={styles.bpMainTabContent}
              >
                {[
                  "Backpack",
                  "Gift",
                  "Activity",
                  "Relationship",
                  "PK",
                  "Special",
                  "VIP",
                  "Rank",
                ].map((tab) => (
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
                    <Text
                      style={[
                        styles.bpMainTabText,
                        backpackMainTab === tab && styles.bpMainTabTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                    {backpackMainTab === tab && (
                      <View style={styles.bpMainTabUnderline} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* ── GIFT TAB ── */}
              {backpackMainTab === "Gift" && (
                <View style={{ flex: 1 }}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                  >
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
                          {gift.imageUrl ? (
                            <View style={styles.bpGiftImageWrap}>
                              <Image
                                source={resolveImageSource(gift.imageUrl)}
                                style={styles.bpGiftImage}
                                resizeMode="contain"
                              />
                            </View>
                          ) : (
                            <LinearGradient
                              colors={["#2a0d50", "#4a1d80"]}
                              style={styles.bpGiftEmojiWrap}
                            >
                              <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                            </LinearGradient>
                          )}
                          <Text style={styles.bpGiftName} numberOfLines={1}>
                            {gift.name}
                          </Text>
                          <View style={styles.bpGiftPriceRow}>
                            <Text style={styles.bpGiftPriceText}>
                              💎 {formatGiftPrice(gift.price)}
                            </Text>
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
                        style={[
                          styles.bpSubTabItem,
                          backpackSubTab === sub && styles.bpSubTabItemActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setBackpackSubTab(sub)}
                      >
                        <Text
                          style={[
                            styles.bpSubTabText,
                            backpackSubTab === sub && styles.bpSubTabTextActive,
                          ]}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {backpackSubTab === "Gift" && backpackGifts.length > 0 ? (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={{ flex: 1 }}
                    >
                      <View style={styles.bpGiftGrid}>
                        {backpackGifts.map((gift) => {
                          const giftImageUrl = resolveBackpackGiftImage(gift);
                          return (
                            <TouchableOpacity
                              key={gift.id}
                              style={[
                                styles.bpGiftCard,
                                giftsMatch(selectedGift, gift) &&
                                styles.bpGiftCardSelected,
                              ]}
                              activeOpacity={0.8}
                              onPress={() => setSelectedGift(gift)}
                            >
                              <View style={styles.bpGiftQtyBadge}>
                                <Text style={styles.bpGiftQtyBadgeText}>
                                  ×{gift.qty}
                                </Text>
                              </View>
                              {giftImageUrl ? (
                                <View style={styles.bpGiftImageWrap}>
                                  <Image
                                    source={resolveImageSource(giftImageUrl)}
                                    style={styles.bpGiftImage}
                                    resizeMode="contain"
                                  />
                                </View>
                              ) : (
                                <LinearGradient
                                  colors={["#2a0d50", "#4a1d80"]}
                                  style={styles.bpGiftEmojiWrap}
                                >
                                  <Text style={styles.bpGiftEmoji}>
                                    {gift.emoji}
                                  </Text>
                                </LinearGradient>
                              )}
                              <Text style={styles.bpGiftName} numberOfLines={1}>
                                {gift.name}
                              </Text>
                              <View style={styles.bpGiftPriceRow}>
                                <Text style={styles.bpGiftPriceText}>
                                  💎 {formatGiftPrice(gift.price)}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
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
                  {backpackSubTab === "Gift" &&
                    backpackGifts.length > 0 &&
                    renderGiftSendBar()}
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
                        style={[
                          styles.bpActEventTab,
                          activityEvent === ev && styles.bpActEventTabActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setActivityEvent(ev);
                          setSelectedGift(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.bpActEventText,
                            activityEvent === ev && styles.bpActEventTextActive,
                          ]}
                        >
                          {ev}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Gift grid */}
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                  >
                    <View style={styles.bpGiftGrid}>
                      {displayActivityGifts.map((gift) => (
                        <TouchableOpacity
                          key={gift.id}
                          style={styles.bpGiftCard}
                          activeOpacity={0.8}
                          onPress={() => openGiftPurchase(gift)}
                        >
                          <LinearGradient
                            colors={["#2a0d50", "#4a1d80"]}
                            style={styles.bpGiftEmojiWrap}
                          >
                            <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                          </LinearGradient>
                          <Text style={styles.bpGiftName} numberOfLines={1}>
                            {gift.name}
                          </Text>
                          <View style={styles.bpGiftPriceRow}>
                            <Text style={styles.bpGiftPriceText}>
                              💎 {formatGiftPrice(gift.price)}
                            </Text>
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
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                  >
                    <View style={styles.bpGiftGrid}>
                      {displayRelationshipVideos.length === 0 &&
                        !catalogLoading ? (
                        <Text style={styles.bpEmptyText}>
                          No relationship videos available.
                        </Text>
                      ) : null}
                      {displayRelationshipVideos.map((video, idx) => (
                        <TouchableOpacity
                          key={video.id}
                          style={[
                            styles.bpGiftCard,
                            selectedGift?.id === video.id &&
                            styles.bpGiftCardSelected,
                          ]}
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
                              <Text style={styles.bpVideoNumText}>
                                {idx + 1}
                              </Text>
                            </View>
                            <View style={styles.bpVideoPlayCircle}>
                              <Play size={22} color="white" fill="white" />
                            </View>
                          </View>

                          <Text style={styles.bpGiftName} numberOfLines={1}>
                            {video.name}
                          </Text>
                          <View style={styles.bpGiftPriceRow}>
                            <Text style={styles.bpVideoTagText}>
                              🎬 Free video
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Send bar */}
                  <View
                    style={[
                      styles.bpSendBar,
                      { paddingBottom: giftSendBarBottom },
                    ]}
                  >
                    {renderGiftRecipientAvatar(selectedGiftRecipient)}
                    <TouchableOpacity
                      style={styles.bpSendRecipient}
                      activeOpacity={0.8}
                      onPress={openGiftReceiverPicker}
                    >
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
                          Alert.alert(
                            "Select a video",
                            "Tap any video to play it.",
                          );
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
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                  >
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
                          <LinearGradient
                            colors={["#2a0d50", "#4a1d80"]}
                            style={styles.bpGiftEmojiWrap}
                          >
                            <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                          </LinearGradient>
                          <Text style={styles.bpGiftName} numberOfLines={1}>
                            {gift.name}
                          </Text>
                          <View style={styles.bpGiftPriceRow}>
                            <Text style={styles.bpGiftPriceText}>
                              💎 {formatGiftPrice(gift.price)}
                            </Text>
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
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                  >
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
                          <LinearGradient
                            colors={["#1a0a3e", "#6a1590"]}
                            style={styles.bpGiftEmojiWrap}
                          >
                            <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                          </LinearGradient>
                          <Text style={styles.bpGiftName} numberOfLines={1}>
                            {gift.name}
                          </Text>
                          <View style={styles.bpGiftPriceRow}>
                            <Text style={styles.bpGiftPriceText}>
                              💎 {formatGiftPrice(gift.price)}
                            </Text>
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
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.bpVipBannerGrad}
                    >
                      <Text style={styles.bpVipBannerIcon}>👑</Text>
                      <Text style={styles.bpVipBannerText}>
                        Exclusive VIP Gifts — Upgrade to unlock
                      </Text>
                    </LinearGradient>
                  </View>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                  >
                    <View style={styles.bpGiftGrid}>
                      {displayVipGifts.map((gift) => (
                        <TouchableOpacity
                          key={gift.id}
                          style={styles.bpGiftCard}
                          activeOpacity={0.85}
                          onPress={() =>
                            Alert.alert(
                              "VIP Exclusive 👑",
                              "Upgrade to VIP to unlock and send this gift.",
                            )
                          }
                        >
                          <LinearGradient
                            colors={["#2a1800", "#5c3a00"]}
                            style={styles.bpGiftEmojiWrap}
                          >
                            <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                          </LinearGradient>
                          <Text style={styles.bpGiftName} numberOfLines={1}>
                            {gift.name}
                          </Text>
                          <View style={styles.bpGiftPriceRow}>
                            <Text style={styles.bpVipPriceText}>
                              💎 {formatGiftPrice(gift.price)}
                            </Text>
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
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.bpVipUpgradeGrad}
                    >
                      <Text style={styles.bpVipUpgradeText}>
                        👑 Upgrade to VIP to unlock all gifts
                      </Text>
                      <TouchableOpacity
                        style={styles.bpVipUpgradeBtn}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.bpVipUpgradeBtnText}>Upgrade</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                </View>
              )}

              {/* ── OTHER TABS EMPTY STATE ── */}
              {![
                "Gift",
                "Backpack",
                "Activity",
                "Relationship",
                "PK",
                "Special",
                "VIP",
              ].includes(backpackMainTab) && (
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
                const threshold =
                  reward.thresholdSeconds ?? LISTEN_THRESHOLDS[i] ?? 60;
                const remaining = Math.max(0, threshold - listenSeconds);
                const isReady =
                  !reward.claimed &&
                  (reward.unlocked ||
                    reward.rewardImg != null ||
                    listenSeconds >= threshold);
                const isClaimed = Boolean(reward.claimed);
                const img =
                  (reward.reward?.imageUrl
                    ? { uri: reward.reward.imageUrl }
                    : null) ??
                  (reward.rewardImg ?? LISTEN_LOCKED_IMGS[i]);

                return (
                  <TouchableOpacity
                    key={reward.tier ?? i}
                    style={[styles.giftCard, isReady && styles.giftCardReady]}
                    activeOpacity={0.8}
                    onPress={() => handleClaimListenReward(reward, i)}
                  >
                    <View style={styles.giftCardImgWrap}>
                      <Image
                        source={img}
                        style={styles.giftCardImg}
                        resizeMode="contain"
                      />
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

                    <Text style={styles.giftCardLabel}>
                      {reward.label ?? LISTEN_THRESHOLD_LABELS[i]}
                    </Text>

                    <View
                      style={[
                        styles.giftCardBtn,
                        isReady && styles.giftCardBtnActive,
                        isClaimed && styles.giftCardBtnClaimed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.giftCardBtnText,
                          (isReady || isClaimed) &&
                          styles.giftCardBtnTextActive,
                        ]}
                      >
                        {isClaimed
                          ? "Claimed ✓"
                          : isReady
                            ? "Claim!"
                            : formatListenTime(remaining)}
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

      <PkBattleModal
        visible={showPkBattle}
        onClose={() => setShowPkBattle(false)}
        roomUsers={pkOpponentCandidates}
        submitting={pkBattleActionLoading}
        onConfirm={handlePkConfirm}
      />

      <PkAcceptTeamModal
        visible={showPkTeamAccept}
        onClose={() => setShowPkTeamAccept(false)}
        hostAName={activePkBattle?.hostAName}
        roomUsers={pkOpponentCandidates.filter(
          (u) => !isSameUser(u.id, activePkBattle?.hostAId),
        )}
        submitting={pkBattleActionLoading}
        onConfirm={(teamMemberIds) => handlePkRespond(true, teamMemberIds)}
      />

      <PkLiveBanner
        battle={activePkBattle}
        role={getPkBattleRole(activePkBattle, myUserId)}
        actionLoading={pkBattleActionLoading}
        topOffset={insets.top + 64}
        resolveUser={(id) => {
          const seat = (seats || []).find((s) => s?.user && isSameUser(s.user.id, id));
          return seat ? { name: seat.user.name, avatar: seat.user.avatar } : null;
        }}
        onAccept={() => {
          if (activePkBattle?.teamAMemberIds?.length) {
            setShowPkTeamAccept(true);
          } else {
            handlePkRespond(true);
          }
        }}
        onReject={() => handlePkRespond(false)}
        onDismiss={() => setActivePkBattle(null)}
      />

      <RoomUserProfilePopup
        visible={Boolean(profilePopupUser || profilePopupLoading)}
        user={profilePopupUser}
        level={
          isSameUser(profilePopupUser?.id, myUserId)
            ? myLevel
            : (profilePopupUser?.level ?? null)
        }
        avatarSource={profilePopupAvatarSource}
        frameSource={
          isSameUser(profilePopupUser?.id, myUserId) && myVipAssets.unlocked
            ? myVipAssets.profileFrame
            : userFrameData[String(profilePopupUser?.id)]?.vipProfileFrameUrl ?? null
        }
        frameLayout={
          userFrameData[String(profilePopupUser?.id)]?.decorationFrameUrl
            ? null  // decoration frames: auto-fit in ProfileAvatarWithFrame
            : (isSameUser(profilePopupUser?.id, myUserId) && myVipAssets.unlocked) ||
              userFrameData[String(profilePopupUser?.id)]?.vipProfileFrameUrl
              ? VIP_PROFILE_FRAME_LAYOUT
              : null
        }
        logoSource={
          isSameUser(profilePopupUser?.id, myUserId) && myVipAssets.unlocked
            ? myVipAssets.logo
            : userFrameData[String(profilePopupUser?.id)]?.vipProfileFrameUrl
              ? VIP_LOGO_BY_TIER[resolveVipTierFromAssetUrl(userFrameData[String(profilePopupUser?.id)]?.vipProfileFrameUrl)]
              : null
        }
        badgeSource={
          userFrameData[String(profilePopupUser?.id)]?.decorationBadgeUrl ?? null
        }
        loading={profilePopupLoading}
        isFollowing={profilePopupFollowing}
        followLoading={profileFollowLoading}
        isSelf={isSameUser(profilePopupUser?.id, myUserId)}
        isOwner={isSameUser(profilePopupUser?.id, hostId)}
        countryFlag={
          isSameUser(profilePopupUser?.id, myUserId) ? myCountryFlag : null
        }
        onClose={closeProfilePopup}
        onFollowToggle={handleProfileFollowToggle}
        onChat={handlePopupChat}
        onSendGift={handlePopupSendGift}
        onMention={handlePopupMention}
        onReport={handlePopupReport}
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
                      mediaSection === section.id &&
                      styles.mediaSectionTabActive,
                    ]}
                    onPress={() => setMediaSection(section.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.mediaSectionTabText,
                        mediaSection === section.id &&
                        styles.mediaSectionTabTextActive,
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
                          stickerTab === pack.id &&
                          styles.mediaSubTabLabelActive,
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
                            <Text style={styles.stickerCellEmoji}>
                              {sticker.emoji}
                            </Text>
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
          style={styles.playCenterOverlay}
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
                  setTimeout(() => {
                    handleToggleMusic();
                  }, 400);
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

              {/* PK — opens the PK battle setup sheet */}
              <TouchableOpacity
                style={styles.playCenterItem}
                activeOpacity={0.75}
                onPress={async () => {
                  setShowPlayCenter(false);
                  // Re-check with the server instead of trusting local state —
                  // the initial room-join fetch may still be in flight, or a
                  // websocket drop could have left `activePkBattle` stale,
                  // and either way opening the sheet on stale info just gets
                  // rejected by the backend with a 409 on Confirm.
                  const fresh = await loadActivePkBattle(String(roomId)).catch(
                    () => activePkBattle,
                  );
                  setActivePkBattle(fresh);
                  if (isPkBattlePending(fresh) || isPkBattleLive(fresh)) {
                    Alert.alert(
                      "PK battle in progress",
                      "This room already has an active PK battle. Wait for it to finish before starting a new one.",
                    );
                    return;
                  }
                  setTimeout(() => {
                    setShowPkBattle(true);
                  }, 400);
                }}
              >
                <View style={styles.playCenterIconWrap}>
                  <Text style={styles.playCenterEmoji}>⚔️</Text>
                </View>
                <Text style={styles.playCenterLabel}>PK</Text>
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
                onPress={() => {
                  setShowPowerMenu(false);
                  promptExitConfirmation();
                }}
              >
                <View
                  style={[styles.playCenterIconWrap, styles.powerExitIconWrap]}
                >
                  <Power size={28} color="#ff6b6b" />
                </View>
                <Text style={[styles.playCenterLabel, { color: "#ff6b6b" }]}>
                  Exit
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── FOLLOW / ROOM INFO MODAL ── */}
      <Modal
        visible={showFollowModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFollowModal(false)}
      >
        <TouchableOpacity
          style={styles.followModalOverlay}
          activeOpacity={1}
          onPress={() => setShowFollowModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.followModalBox}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.followModalCloseBtn}
              onPress={() => setShowFollowModal(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={16} color="#1a1a2e" />
            </TouchableOpacity>

            {/* Room / Host Avatar (Dynamic - Half Inside / Half Outside) */}
            <View style={styles.followModalAvatarWrap}>
              {hostUserLike ? (
                renderRoomUserAvatar(
                  hostUserLike,
                  styles.followModalAvatar,
                  [styles.followModalAvatar, styles.ownerAvatarPlaceholder],
                  styles.ownerInitial,
                )
              ) : roomInfo?.profileImageUrl ? (
                <Image
                  source={{ uri: roomInfo.profileImageUrl }}
                  style={styles.followModalAvatar}
                />
              ) : (
                <Image
                  source={{
                    uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      roomInfo?.name || "Host",
                    )}&background=7c4dff&color=fff`,
                  }}
                  style={styles.followModalAvatar}
                />
              )}
            </View>

            {/* Room Name & ID */}
            <Text style={styles.followModalRoomName} numberOfLines={1}>
              {roomInfo?.name ?? "Voice Room"}
            </Text>
            <Text style={styles.followModalRoomId} numberOfLines={1}>
              ID: {roomId ?? "—"}
            </Text>

            {/* Follow / Following Button */}
            <TouchableOpacity
              style={[
                styles.followModalActionBtn,
                isFollowing && styles.followModalActionBtnFollowing,
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
              activeOpacity={0.85}
            >
              {followLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? "#7c4dff" : "#ffffff"}
                />
              ) : (
                <View style={styles.followModalActionBtnContent}>
                  <Plus
                    size={16}
                    color={isFollowing ? "#7c4dff" : "#ffffff"}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.followModalActionBtnText,
                      isFollowing && styles.followModalActionBtnTextFollowing,
                    ]}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {/* ── ACTIVE USERS MODAL ── */}
      <Modal
        visible={showActiveUsersModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowActiveUsersModal(false)}
      >
        <TouchableOpacity
          style={styles.activeUsersOverlay}
          activeOpacity={1}
          onPress={() => setShowActiveUsersModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.activeUsersBox}>
            <View style={styles.activeUsersHeader}>
              <View style={styles.activeUsersTitleRow}>
                <Users size={16} color="#a78bfa" />
                <Text style={styles.activeUsersTitle}>Active Users</Text>
                <View style={styles.activeUsersBadge}>
                  <Text style={styles.activeUsersBadgeText}>
                    {onlineCount || displayActiveUsers.length}
                  </Text>
                </View>
                <View style={styles.activeUsersSeatedBadge}>
                  <Text style={styles.activeUsersSeatedBadgeText}>
                    🎙️ {seatedUsersCount} Seated
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowActiveUsersModal(false)}
                style={styles.activeUsersCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.activeUsersCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.activeUsersList}
              contentContainerStyle={styles.activeUsersListContent}
              showsVerticalScrollIndicator={false}
            >
              {displayActiveUsers.length === 0 ? (
                <View style={styles.activeUsersEmpty}>
                  <Text style={styles.activeUsersEmptyText}>
                    No active users in room
                  </Text>
                </View>
              ) : (
                displayActiveUsers.map((user, idx) => {
                  const uId = user.userId || user.id;
                  const seated = isUserSeated(uId);
                  const isMeOnSeat =
                    seated &&
                    ((myUserId != null && String(uId) === String(myUserId)) ||
                      user.name === "You" ||
                      user.id === "local-user");
                  // Same level/VIP/decoration badge row shown in the chat and the
                  // mini profile popup — derived from the same per-user
                  // userFrameData fetch (already covers every online user, see
                  // the effect that builds `audienceUserIds`), so every row here
                  // gets the same badges without any extra network calls.
                  const isRowSelf =
                    myUserId != null &&
                    uId != null &&
                    String(uId) === String(myUserId);
                  const rowIsVip = isRowSelf && myVipAssets.unlocked;
                  const rowVipTier = !isRowSelf
                    ? resolveVipTierFromAssetUrl(
                      userFrameData[String(uId)]?.vipProfileFrameUrl,
                    )
                    : null;
                  const rowVipLogo = rowIsVip
                    ? myVipAssets.logo
                    : rowVipTier
                      ? VIP_LOGO_BY_TIER[rowVipTier]
                      : null;
                  const rowDecorationBadge =
                    uId != null
                      ? (userFrameData[String(uId)]?.decorationBadgeUrl ?? null)
                      : null;
                  return (
                    <TouchableOpacity
                      key={uId ?? `active-user-${idx}`}
                      style={styles.activeUserCard}
                      activeOpacity={0.75}
                      onPress={() => {
                        setShowActiveUsersModal(false);
                        handleOnlineUserPress(user);
                      }}
                    >
                      <View style={styles.activeUserAvatarWrap}>
                        {renderRoomUserAvatar(
                          user,
                          styles.activeUserAvatar,
                          [
                            styles.activeUserAvatar,
                            styles.activeUserAvatarPlaceholder,
                          ],
                          styles.activeUserInitial,
                        )}
                        {user.muted ? (
                          <View
                            style={[
                              styles.activeUserMicDot,
                              { backgroundColor: "#ef4444" },
                            ]}
                          >
                            <MicOff size={7} color="white" />
                          </View>
                        ) : user.isSpeaking ? (
                          <View
                            style={[
                              styles.activeUserMicDot,
                              { backgroundColor: "#22c55e" },
                            ]}
                          >
                            <Mic size={7} color="white" />
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.activeUserInfo}>
                        <View style={styles.activeUserNameRow}>
                          <Text style={styles.activeUserName} numberOfLines={1}>
                            {user.name || user.username || `User ${uId || ""}`}
                          </Text>
                          {user.level != null && (
                            <Image
                              source={resolveLocalLevelBadge(user.level)}
                              style={styles.activeUserLevelImg}
                              resizeMode="contain"
                            />
                          )}
                          {rowVipLogo && (
                            <Image
                              source={{ uri: rowVipLogo }}
                              style={styles.activeUserVipBadge}
                              resizeMode="contain"
                            />
                          )}
                          {rowDecorationBadge && (
                            <Image
                              source={{ uri: rowDecorationBadge }}
                              style={styles.activeUserVerifiedBadge}
                              resizeMode="contain"
                            />
                          )}
                          <Image
                            source={VERIFIED_BADGE}
                            style={styles.activeUserVerifiedBadge}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.activeUserStatus}>
                          {uId != null && String(uId) === String(hostId)
                            ? "👑 Host"
                            : seated
                              ? "🎙️ Seated"
                              : "🎧 Listening"}
                        </Text>
                      </View>
                      <View style={styles.activeUserActionsRow}>
                        {seated ? (
                          <View style={styles.seatStatusBadge}>
                            <Text style={styles.seatStatusText}>Seated</Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.seatStatusBadge,
                              styles.audienceStatusBadge,
                            ]}
                          >
                            <Text style={styles.audienceStatusText}>Audience</Text>
                          </View>
                        )}
                        {isMeOnSeat && (
                          <TouchableOpacity
                            style={styles.leaveSeatBtn}
                            onPress={() => {
                              setShowActiveUsersModal(false);
                              handleTakeMic();
                            }}
                          >
                            <Text style={styles.leaveSeatBtnText}>Leave</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
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
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.shareBox,
              { paddingBottom: Math.max(30, safeBottom + 16) },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.shareHandle} />

            <Text style={styles.shareTitle}>Invite your friends</Text>

            {/* Platform icons */}
            <View style={styles.sharePlatformRow}>
              {sharePlatforms.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={styles.sharePlatformItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowShareMenu(false);
                    p.onPress?.();
                  }}
                >
                  <View
                    style={[
                      styles.sharePlatformIcon,
                      { backgroundColor: p.bg },
                    ]}
                  >
                    {typeof p.icon === "string" ? (
                      <Text style={styles.sharePlatformEmoji}>{p.icon}</Text>
                    ) : (
                      p.icon
                    )}
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
                  <Text
                    style={[
                      styles.shareTabText,
                      shareTab === tab && styles.shareTabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                  {shareTab === tab && (
                    <View style={styles.shareTabUnderline} />
                  )}
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
              <Text style={styles.seatActionHeaderTitle}>
                Seat {seatActionSheet?.seatId}
              </Text>
              <Text style={styles.seatActionHeaderSub}>
                What would you like to do?
              </Text>
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
                {seatActionLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.seatActionBtnIcon}>🎤</Text>
                    <Text style={styles.seatActionBtnText}>Claim seat</Text>
                  </>
                )}
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
                Please enable microphone access to use functions such as voice
                verification and calling.
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
                onPress={async () => {
                  const pendingSeatId = micPermWarning;
                  setMicPermWarning(null);
                  const granted = await agoraVoice.requestMicPermission();
                  if (granted) {
                    if (pendingSeatId === 'music') {
                      // Automatically try toggling music again now that permission is granted
                      handleToggleMusic();
                    } else if (pendingSeatId != null) {
                      handleTakeSeat(pendingSeatId);
                    }
                  }
                }}
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
            <Text style={styles.welcomeEditCount}>
              {welcomeDraft.length}/120
            </Text>
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
                  const trimmed = welcomeDraft.trim();
                  if (trimmed) {
                    setWelcomeMessage(trimmed);
                    saveRoomAnnouncement(roomId, trimmed).catch((err) => {
                      console.warn(
                        "[voice-party] Announcement save failed:",
                        err,
                      );
                    });
                  }
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

      {/* ── DIAMOND RECHARGE MODAL ── */}
      <DiamondRechargeModal
        visible={showDiamondRecharge}
        onClose={() => setShowDiamondRecharge(false)}
        currentDiamonds={walletDiamonds}
        initialTab={rechargeInitialTab}
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

      <KeyboardAvoidingView
        style={{ flex: 1, position: "relative" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          {/* Room info capsule with integrated + follow button and diamond accent */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setShowFollowModal(true)}
            style={styles.ownerSectionWrapper}
          >
            <View style={styles.ownerSection}>
              {/* Capsule Frame Background Image */}
              <Image
                source={ROOM_HEADER_BG}
                style={styles.ownerSectionBg}
                resizeMode="stretch"
              />

              {/* Dynamic Host / Room Avatar inside left crest spot */}
              <View style={styles.ownerAvatarSpot}>
                {roomInfo?.profileImageUrl ? (
                  <Image
                    source={{ uri: roomInfo.profileImageUrl }}
                    style={styles.ownerAvatarCircle}
                    resizeMode="cover"
                  />
                ) : hostUserLike ? (
                  renderRoomUserAvatar(
                    hostUserLike,
                    styles.ownerAvatarCircle,
                    [styles.ownerAvatarCircle, styles.ownerAvatarPlaceholder],
                    styles.ownerInitial,
                  )
                ) : (
                  <Image
                    source={{
                      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        roomInfo?.name || "Host",
                      )}&background=7c4dff&color=fff`,
                    }}
                    style={styles.ownerAvatarCircle}
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* Dynamic Room Name & Room ID */}
              <View style={styles.ownerTextCol}>
                <View style={styles.ownerNameRow}>
                  <Text
                    style={styles.ownerName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {roomInfo?.name ?? "Voice Room"}
                  </Text>
                  {isHostSelf && !!myCountryFlag && (
                    <Text style={styles.ownerCountryFlag}>{myCountryFlag}</Text>
                  )}
                </View>
                <Text
                  style={styles.ownerId}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  ID:{roomId ?? "—"}
                </Text>
              </View>

              {/* + Follow Button inside capsule */}
              <TouchableOpacity
                style={styles.capsulePlusBtn}
                onPress={() => setShowFollowModal(true)}
                activeOpacity={0.8}
              >
                <Plus size={13} color="white" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.8}
              onPress={handleShareRoom}
            >
              <Share2 size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowMoreMenu(true)}
            >
              <MoreVertical size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowPowerMenu(true)}
            >
              <Power size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ONLINE USERS ROW ── */}
        <View style={styles.badgesRow}>
          <View style={styles.trophyBadge}>
            <Image
              source={{
                uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/user.png",
              }}
              style={styles.trophyIcon}
              resizeMode="cover"
            />
            <Text style={styles.trophyText}>
              {onlineCount || displayActiveUsers.length}
            </Text>
          </View>
          <View style={styles.badgesRowRight}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.audienceScroll}
              contentContainerStyle={styles.audienceScrollContent}
            >
              {(onlineUsers.length > 0 ? onlineUsers : displayActiveUsers)
                .slice(0, 6)
                .map((user, index) => (
                  <TouchableOpacity
                    key={user.userId || user.id || `user-${index}`}
                    style={styles.audienceItem}
                    activeOpacity={0.85}
                    onPress={() => handleOnlineUserPress(user)}
                  >
                    {renderRoomUserAvatar(
                      user,
                      [
                        styles.audienceAvatar,
                        index > 0 && styles.audienceAvatarOverlap,
                      ],
                      [
                        styles.audienceAvatar,
                        styles.audienceAvatarPlaceholder,
                        index > 0 && styles.audienceAvatarOverlap,
                      ],
                      styles.audienceInitial,
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
            {(onlineCount || displayActiveUsers.length) > 6 && (
              <View style={styles.audienceCount}>
                <Text style={styles.audienceCountText}>
                  +{(onlineCount || displayActiveUsers.length) - 6}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => {
                getClaimedSeats(String(roomId)).catch(() => {});
                setShowActiveUsersModal(true);
              }}
            >
              <Users size={20} color="white" />
            </TouchableOpacity>
          </View>
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
                  <SpeakingRing
                    active={speakingUserIds.has(String(seat.user.id))}
                  />
                  {renderRoomUserAvatar(
                    seat.user,
                    styles.seatAvatar,
                    [
                      styles.seatEmpty,
                      styles.seatAvatarPlaceholder,
                      seat.user.active && styles.seatActiveBorder,
                    ],
                    styles.seatInitial,
                  )}
                  {/* Seated green badge in top-right corner */}
                  {/* <View style={styles.seatSeatedBadge}>
                    <Text style={styles.seatSeatedBadgeText}>Seated</Text>
                  </View> */}
                  {/* Mic status badge in bottom-right corner */}
                  <View style={styles.seatMicIcon}>
                    {seat.user.muted ? (
                      <MicOff size={12} color="#f87171" />
                    ) : (
                      <Mic
                        size={12}
                        color={
                          seat.user.active ? "#4ade80" : "rgba(255,255,255,0.8)"
                        }
                      />
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          {/* Bottom-to-Top Floating Gift Emoji Animation */}
          {activeRisingGifts.map((item) => (
            <FloatingGiftRiseItem
              key={item._riseKey || item.id}
              gift={item}
              catalog={giftCatalog}
              onComplete={() =>
                handleRisingGiftComplete(item._riseKey || item.id)
              }
            />
          ))}

          {/* Floating Gift Display Overlay — non-blocking real-time animations for all users */}
          {activeGiftDisplays.length > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: vs(155),
                left: s(14),
                zIndex: 10000,
                elevation: 100,
                maxWidth: W * 0.78,
              }}
            >
              {activeGiftDisplays.map((item) => (
                <GiftAnimationItem
                  key={item._displayKey || item.id}
                  gift={item}
                  catalog={giftCatalog}
                  onComplete={() =>
                    handleGiftAnimationComplete(item._displayKey || item.id)
                  }
                />
              ))}
            </View>
          )}

          {/* Entry Banners (VIP badge) — overlay, displays after 10s of completed loading */}
          {!roomLoading && canShowEntryBanner && recentEntries.length > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: vs(120),
                left: 0,
                right: 0,
                alignItems: "center",
                zIndex: 9999,
                elevation: 99,
              }}
            >
              {recentEntries.slice(-1).map((user, idx) => (
                <UserEntryBanner
                  key={user._entryKey || `${user.id || user.userId || "entry"}-${idx}`}
                  user={user}
                  countryFlag={myCountryFlag}
                  onComplete={() =>
                    handleEntryComplete(user._entryKey || user.id || user.userId)
                  }
                />
              ))}
            </View>
          )}

          {/* Real-time Room Activity Event Toast (Enter / Leave / Seated) */}
          {!roomLoading && currentActivityEvent && (
            <RoomActivityEventBanner
              event={currentActivityEvent}
              onDismiss={handleActivityDismiss}
              onClap={handleActivityClap}
            />
          )}

          <View style={styles.chatArea}>
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
                    Welcome to TukTuk! Please respect each other and chat in a
                    decent manner.
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
                      onPress={() => {
                        setWelcomeDraft(welcomeMessage);
                        setShowWelcomeEdit(true);
                      }}
                    >
                      <Text style={styles.pinnedEditBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Card 3 — share prompt */}
                <View style={styles.pinnedShareCard}>
                  <Text style={styles.pinnedShareText}>
                    Share your room to others!
                  </Text>
                  <TouchableOpacity
                    style={styles.pinnedShareBtn}
                    activeOpacity={0.8}
                    onPress={handleShareToChatList}
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
                  const senderName = resolveChatSenderName(
                    msg.userId,
                    msg.user,
                  );
                  const senderAvatar =
                    resolveChatSenderAvatar(msg.userId) ?? msg.avatar;
                  // VIP chat cosmetics — the chat-bubble background frame and
                  // corner logo are only known for the logged-in user's own
                  // messages (myVipAssets), but the avatar ring itself is also
                  // shown for other senders when the backend embeds
                  // vipProfileFrameUrl on their message (their own XP >= threshold).
                  const isSenderSelf =
                    msg.userId != null &&
                    myUserId != null &&
                    String(msg.userId) === String(myUserId);
                  const isSenderVip = isSenderSelf && myVipAssets.unlocked;
                  const otherSenderVipProfileFrame =
                    !isSenderSelf && msg.vipProfileFrameUrl
                      ? { uri: msg.vipProfileFrameUrl }
                      : null;
                  const senderProfileFrame = isSenderVip
                    ? myVipAssets.profileFrame
                    : otherSenderVipProfileFrame;
                  // VIP badge shown next to the name, for every sender — self
                  // uses the confirmed logo from /api/app/vip/me/logo
                  // (myVipAssets), other senders only expose the tier baked
                  // into their profile-frame URL, so their badge is looked up
                  // from that same VIP_TIER_THRESHOLDS table used elsewhere.
                  const otherSenderVipTier = !isSenderSelf
                    ? resolveVipTierFromAssetUrl(
                      msg.vipProfileFrameUrl ??
                      userFrameData[String(msg.userId)]
                        ?.vipProfileFrameUrl,
                    )
                    : null;
                  const senderVipLogo = isSenderVip
                    ? myVipAssets.logo
                    : otherSenderVipTier
                      ? VIP_LOGO_BY_TIER[otherSenderVipTier]
                      : null;
                  // Same backend-assigned decoration badge shown below the
                  // name on the profile screens (fetchUserDecorations) —
                  // fetched per userId for every visible sender, self included.
                  const senderDecorationBadge =
                    msg.userId != null
                      ? (userFrameData[String(msg.userId)]?.decorationBadgeUrl ??
                        null)
                      : null;
                  // Trimmed whole-image chat frame for this sender's tier (keyed
                  // by tier number, not by URL — the URL can vary once the real
                  // API is wired up). Falls back to the raw remote asset (old
                  // behavior) for any tier without a trimmed image yet.
                  const vipChatFrameAsset = isSenderVip
                    ? VIP_CHAT_FRAME_FITTED_BY_TIER[myVipAssets.tier]
                    : null;
                  // Re-wrapped as a bare {uri} (dropping the asset's known
                  // width/height) so resizeMode="stretch" fills the bubble's
                  // actual box exactly — with the width/height metadata local
                  // require()'d images carry, Fabric's Android image view
                  // partially preserves aspect ratio even under "stretch",
                  // rendering oversized and clipped. A plain uri (like the
                  // remote chatFrame fallback below already used) has no
                  // intrinsic size to preserve, so it stretches correctly.
                  const vipChatFrameSource = vipChatFrameAsset
                    ? {
                      uri: Image.resolveAssetSource(vipChatFrameAsset.source)
                        .uri,
                    }
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
                          handleUserAvatarPress({
                            id: msg.userId,
                            name: senderName,
                            avatar: senderAvatar,
                          })
                        }
                      >
                        {senderAvatar ? (
                          senderProfileFrame ? (
                            <ProfileAvatarWithFrame
                              avatarSource={resolveRoomUserAvatarSource({
                                avatar: senderAvatar,
                              })}
                              frameSource={senderProfileFrame}
                              size={32}
                              avatarStyle={styles.chatAvatar}
                              frameScale={VIP_PROFILE_FRAME_LAYOUT.frameScale}
                              frameResizeMode={
                                VIP_PROFILE_FRAME_LAYOUT.frameResizeMode
                              }
                              frameOffsetX={
                                VIP_PROFILE_FRAME_LAYOUT.frameOffsetX
                              }
                              frameOffsetY={
                                VIP_PROFILE_FRAME_LAYOUT.frameOffsetY
                              }
                              frameBleed={VIP_PROFILE_FRAME_LAYOUT.frameBleed}
                              avatarBoost={VIP_PROFILE_FRAME_LAYOUT.avatarBoost}
                              avatarOffsetY={
                                VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY
                              }
                            />
                          ) : (
                            <Image
                              source={resolveRoomUserAvatarSource({
                                avatar: senderAvatar,
                              })}
                              style={styles.chatAvatar}
                            />
                          )
                        ) : (
                          <View
                            style={[
                              styles.chatAvatar,
                              styles.chatAvatarPlaceholder,
                            ]}
                          >
                            <Text
                              style={{
                                color: "white",
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              {senderName?.[0]?.toUpperCase() ?? "?"}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.chatBubble,
                          vipChatFrameSource && styles.chatBubbleVipPadding,
                        ]}
                      >
                        {vipChatFrameSource ? (
                          <Image
                            source={vipChatFrameSource}
                            style={vipChatFrameStyle}
                            resizeMode="stretch"
                            pointerEvents="none"
                          />
                        ) : (
                          isSenderVip &&
                          (myVipAssets.chatFrame || myVipAssets.logo) && (
                            <Image
                              source={{
                                uri: myVipAssets.chatFrame || myVipAssets.logo,
                              }}
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
                              handleUserAvatarPress({
                                id: msg.userId,
                                name: senderName,
                                avatar: senderAvatar,
                              })
                            }
                          >
                            <Text style={styles.chatUser}>{senderName}</Text>
                          </TouchableOpacity>
                          {isSenderSelf && !!myCountryFlag && (
                            <Text style={styles.chatUserFlag}>{myCountryFlag}</Text>
                          )}
                          <Image
                            source={resolveLocalLevelBadge(msg.level)}
                            style={styles.lvBadgeImg}
                            resizeMode="contain"
                          />
                          <BadgeCheck
                            size={14}
                            color="#3897f0"
                            strokeWidth={2.2}
                          />
                          {senderVipLogo && (
                            <Image
                              source={{ uri: senderVipLogo }}
                              style={styles.chatVipBadge}
                              resizeMode="contain"
                            />
                          )}
                          {senderDecorationBadge && (
                            <Image
                              source={{ uri: senderDecorationBadge }}
                              style={styles.chatVerifiedBadge}
                              resizeMode="contain"
                            />
                          )}
                          <Image
                            source={VERIFIED_BADGE}
                            style={styles.chatVerifiedBadge}
                            resizeMode="contain"
                          />
                          {msg.userId != null &&
                            (userFrameData[String(msg.userId)]
                              ?.hasNewUserFrame ??
                              false) && (
                              <Image
                                source={NEW_START_BADGE}
                                style={styles.newStartBadge}
                                resizeMode="contain"
                              />
                            )}
                          {msg.coins > 0 && (
                            <Text style={styles.chatCoin}>🪙 {msg.coins}</Text>
                          )}
                          {msg.diamonds > 0 && (
                            <Text style={styles.chatDiamond}>
                              💎 {msg.diamonds}
                            </Text>
                          )}
                        </View>
                        {isChatMediaUrl(msg.text) ? (
                          <Image
                            source={{ uri: msg.text.trim() }}
                            style={styles.chatMediaImg}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text
                            style={[
                              styles.chatText,
                              msg.isGift && styles.chatGiftText,
                            ]}
                          >
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
                  style={styles.treasureBoxImage}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rightIconBtn}
                onPress={() => setShowGiftPanel(true)}
              >
                <View style={styles.giftPanelCropWrap}>
                  <Image
                    source={{ uri: GIFT_PANEL_ICON }}
                    style={styles.giftPanelCropImage}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chatIconBtn}
                onPress={handleOpenChatTab}
              >
                <View style={styles.chatCropWrap}>
                  <Image
                    source={{ uri: CHAT_ICON }}
                    style={styles.chatCropImage}
                  />
                </View>
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
                    <View style={styles.micCropWrap}>
                      <Image
                        source={{ uri: MIC_ICON }}
                        style={styles.micCropImage}
                      />
                    </View>
                    <Text style={styles.takeMicText}>
                      {onMic ? "Leave Mic" : "Take seat"}
                    </Text>
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
        </ScrollView>
        {/* {(voiceListenStatus !== "idle" || voiceDiagnostics?.joined) && (
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
        )} */}

        {/* ── BOTTOM DOCK: buttons above chat input ── */}
        <View
          style={[
            styles.bottomDock,
            {
              paddingBottom: safeBottom > 0 ? safeBottom : 4,
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
                <TouchableOpacity
                  onPress={() => setShowTagPicker(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.tagPickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              {roomMembersList.length === 0 ? (
                <Text style={styles.tagPickerEmpty}>
                  No one else is in the room
                </Text>
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
                        <View
                          style={[
                            styles.tagPickerAvatar,
                            styles.tagPickerAvatarFallback,
                          ]}
                        >
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
                          <Text
                            style={styles.tagPickerUsername}
                            numberOfLines={1}
                          >
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

          {/* Bottom icon bar — always visible except on Android when typing to avoid adjustPan overlay issues */}
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
            <TouchableOpacity
              style={styles.bottomIconBtn}
              onPress={handleOpenMediaPicker}
            >
              <Smile size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomIconBtn}
              onPress={handleOpenPartyChat}
            >
              <MessageSquare
                size={20}
                color={showChatInput ? "#4dc8ff" : "white"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.giftShortcutHighlight}
              onPress={() => setShowBackpack(true)}
            >
              <View style={styles.rechargeBonusCropWrap}>
                <Image
                  source={{ uri: RECHARGE_BONUS_ICON }}
                  style={styles.rechargeBonusCropImage}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomIconBtn}
              onPress={() => setShowPlayCenter(true)}
            >
              <LayoutGrid size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── TOP 3 GIFTING RANKING FLOATING WIDGET ── */}
        {!roomLoading && (
          <TopGiftingRanking roomId={roomId} onUserPress={handleOnlineUserPress} />
        )}
      </KeyboardAvoidingView>

      {/* ── CUSTOM REWARD CLAIMED MODAL ── */}
      <Modal
        visible={Boolean(claimedRewardModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setClaimedRewardModal(null)}
      >
        <View style={styles.rewardModalOverlay}>
          <View style={styles.rewardModalOuter}>
            {/* Bursting Gifts Overlay */}
            <Image
              source={{ uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Popup.png" }}
              style={styles.rewardModalHeaderImg}
              resizeMode="contain"
            />

            <LinearGradient
              colors={["#ffd17f", "#fffbf0", "#ffffff"]}
              style={styles.rewardModalContainer}
            >
              <View style={styles.rewardModalBody}>
                <View style={styles.rewardModalGiftBox}>
                  <Image
                    source={claimedRewardModal}
                    style={styles.rewardModalGiftImg}
                    resizeMode="contain"
                  />
                  <Text style={styles.rewardModalGiftBadge}>x1d</Text>
                </View>
                <Text style={styles.rewardModalGiftLabel}>Gift</Text>

                <Text style={styles.rewardModalTips}>
                  Tips: Stay in the room long enough to earn a gift.
                </Text>

                <TouchableOpacity
                  style={{ width: '100%', alignItems: 'center' }}
                  activeOpacity={0.8}
                  onPress={() => setClaimedRewardModal(null)}
                >
                  <LinearGradient
                    colors={["#ff7a00", "#ff007a"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.rewardModalOkBtn}
                  >
                    <Text style={styles.rewardModalOkText}>OK</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Close Button floating above everything */}
            <TouchableOpacity
              style={styles.rewardModalCloseIcon}
              activeOpacity={0.8}
              onPress={() => setClaimedRewardModal(null)}
            >
              <X color="white" size={26} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  ownerSectionWrapper: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: s(6),
  },
  ownerSection: {
    position: "relative",
    height: vs(66),
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 0,
    paddingRight: s(4),
    overflow: "visible",
  },
  ownerSectionBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  ownerAvatarSpot: {
    width: s(48),
    height: vs(48),
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: s(10),
  },
  ownerAvatarCircle: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
  },
  ownerAvatarPlaceholder: {
    backgroundColor: "rgba(124, 77, 255, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerInitial: {
    color: "white",
    fontSize: ms(15),
    fontWeight: "800",
  },
  ownerTextCol: {
    gap: vs(2.5),
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginLeft: s(6),
    justifyContent: "center",
  },
  ownerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    minWidth: 0,
  },
  ownerName: {
    color: "#ffffff",
    fontSize: ms(13),
    fontWeight: "800",
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  ownerCountryFlag: {
    fontSize: ms(12.5),
  },
  ownerId: {
    color: "#c4b5fd",
    fontSize: ms(10),
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  capsulePlusBtn: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    borderColor: '#ffffff',
    borderWidth: 1,
    backgroundColor: "#7c4dff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
    flexShrink: 0,
    marginLeft: s(4),
    marginRight: s(24),
  },
  capsulePlusBtnFollowing: {
    backgroundColor: "rgba(124, 77, 255, 0.45)",
    borderWidth: 0.8,
    borderColor: "rgba(167, 139, 250, 0.6)",
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
  },
  loadingOverlay: {
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
  audienceScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  audienceScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 2,
    paddingLeft: 2,
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
    marginLeft: 2,
    flexShrink: 0,
  },
  audienceCountText: { color: "white", fontSize: 11, fontWeight: "700" },
  headerRight: { flexDirection: "row", gap: 6, flexShrink: 0 },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 10,
    overflow: "visible",
  },
  badgesRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    justifyContent: "flex-end",
    marginLeft: "auto",
  },
  trophyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(255,215,0,0.2)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.4)",
    flexShrink: 0,
  },
  trophyIcon: {
    width: 16,
    height: 16,
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
  seatItem: {
    width: SEAT_SIZE,
    alignItems: "center",
    gap: 4,
    overflow: "visible",
  },
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
  seatSeatedBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#10b981",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 7,
    zIndex: 20,
    elevation: 20,
    borderWidth: 1.5,
    borderColor: "#1a0a2e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
  },
  seatSeatedBadgeText: {
    color: "#ffffff",
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  seatNum: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
  seatName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: ms(10),
    textAlign: "center",
    maxWidth: SEAT_SIZE,
  },
  chatArea: {
    flex: 1,
    flexDirection: "row",
    paddingLeft: s(12),
    paddingRight: 0,
    gap: s(8),
    minHeight: 0,
  },
  chatLeft: { flex: 1, minHeight: 0 },
  chatScroll: { flex: 1 },
  chatScrollContent: {
    gap: vs(8),
    paddingTop: vs(4),
    paddingBottom: vs(12),
  },
  systemMsg: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    alignSelf: "flex-start",
  },
  systemMsgText: { color: "rgba(255,255,255,0.7)", fontSize: ms(12) },
  chatMsg: { flexDirection: "row", alignItems: "flex-start", gap: s(6) },
  chatAvatar: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
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
    borderRadius: s(12),
    padding: s(8),
    flex: 1,
    overflow: "hidden",
  },
  // Extra clearance so message text doesn't sit flush against the VIP chat
  // frame image's border art — without this, text can visually touch/cross
  // the border instead of sitting inside it. overflow:visible (instead of
  // chatBubble's default "hidden") lets the frame's crown/gem art bleed
  // above/below the bubble instead of being clipped — see vipChatFrameStyle.
  chatBubbleVipPadding: {
    paddingHorizontal: s(10),
    paddingVertical: vs(12),
    overflow: "visible",
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    marginBottom: vs(3),
    flexWrap: "wrap",
  },
  chatUser: { color: "#b44dff", fontSize: ms(12), fontWeight: "700" },
  chatUserFlag: { fontSize: ms(12) },
  // Same level-badge image (and aspect ratio) shown on the Profile tab —
  // 142/149 measured from the actual asset files, see levelBadge.js.
  lvBadgeImg: { height: vs(18), width: vs(18) * (142 / 149) },
  chatVipBadge: { width: vs(18), height: vs(18) },
  chatVerifiedBadge: { width: vs(18) * (438 / 179), height: vs(18) },
  newStartBadge: { width: s(52), height: vs(24), marginLeft: s(2) },
  chatCoin: { fontSize: ms(11), color: "#ffd700" },
  chatDiamond: { fontSize: ms(11), color: "#4dc8ff" },
  chatText: { color: "white", fontSize: ms(13) },
  chatGiftText: { color: "#f9a8d4", fontWeight: "700" },
  chatRight: {
    // width: 60,
    alignItems: "center",
    gap: vs(10),
    justifyContent: "flex-end",
    marginRight: -s(6),
  },
  luckyStarBox: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: s(10),
    padding: s(6),
    width: s(58),
  },
  luckyStarEmoji: { fontSize: ms(22) },
  luckyStarLabel: {
    color: "#ffd700",
    fontSize: ms(8),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  luckyProgress: {
    backgroundColor: "#8b0000",
    borderRadius: s(4),
    paddingHorizontal: s(4),
    paddingVertical: vs(2),
    marginTop: vs(2),
  },
  luckyProgressText: { color: "white", fontSize: ms(9), fontWeight: "700" },
  rightIconBtn: {
    width: s(33),
    height: s(33),
    borderRadius: s(16.5),
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  treasureBoxBtn: {
    width: s(70),
    height: s(70),
    alignItems: "center",
    justifyContent: "center",
  },
  treasureBoxImage: {
    width: s(68),
    height: s(68),
  },
  // Crop wrappers below: each S3 icon is a 1280x720 canvas with its glyph
  // confined to a small centered region (huge transparent margin baked in), so
  // rendering it straight scales the whole padded canvas and looks tiny. Each
  // wrapper is sized to the glyph's own scaled bounding box (overflow: hidden),
  // and its Image child is drawn at the full scaled 1280x720 size then shifted
  // left/top by -bboxLeft*scale / -bboxTop*scale so only the glyph lands inside.
  giftPanelCropWrap: {
    // gift+box2.png bbox (337,72)-(841,648) in a 1280x720 source, scaled so the
    // glyph's own height fills 29px (matching the other right-panel icons).
    width: s(25.38),
    height: s(29),
    overflow: "hidden",
    position: "relative",
  },
  giftPanelCropImage: {
    position: "absolute",
    width: s(64.44),
    height: s(36.25),
    left: -s(16.97),
    top: -s(3.62),
  },
  rechargeBonusCropWrap: {
    // gift+box1.png bbox (371,73)-(909,646), glyph height scaled to 32px.
    width: s(30.05),
    height: s(32),
    overflow: "hidden",
    position: "relative",
    marginTop: -vs(1),
  },
  rechargeBonusCropImage: {
    position: "absolute",
    width: s(71.48),
    height: s(40.21),
    left: -s(20.72),
    top: -s(4.08),
  },
  micCropWrap: {
    // mic.png bbox (502,83)-(773,606), glyph height scaled to 34px.
    width: s(17.62),
    height: s(34),
    overflow: "hidden",
    position: "relative",
  },
  micCropImage: {
    position: "absolute",
    width: s(83.21),
    height: s(46.81),
    left: -s(32.63),
    top: -s(5.4),
  },
  chatIconBtn: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  chatCropWrap: {
    // chat.png bbox (447,166)-(748,477), glyph height scaled to 26px.
    width: s(25.16),
    height: s(26),
    overflow: "hidden",
    position: "relative",
  },
  chatCropImage: {
    position: "absolute",
    width: s(107.01),
    height: s(60.19),
    left: -s(37.37),
    top: -s(13.88),
  },
  rightBannerBtn: {
    width: s(44),
    height: vs(60),
    borderRadius: s(10),
    backgroundColor: " rgba(61, 52, 88, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightBannerText: { fontSize: ms(26) },
  chatBadge: {
    position: "absolute",
    top: -vs(4),
    right: -s(4),
    backgroundColor: "#4dc8ff",
    borderRadius: s(8),
    minWidth: s(18),
    height: vs(18),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(3),
  },
  chatBadgeText: { color: "white", fontSize: ms(9), fontWeight: "800" },
  giftBadge: {
    position: "absolute",
    bottom: -vs(4),
    right: -s(4),
    backgroundColor: "#ff4ea3",
    borderRadius: s(6),
    paddingHorizontal: s(4),
    paddingVertical: vs(1),
  },
  giftBadgeText: { color: "white", fontSize: ms(10), fontWeight: "700" },
  takeMicBtn: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: s(22),
    paddingVertical: 0,
    paddingHorizontal: s(6),
    width: s(38),
  },
  takeMicText: {
    color: "white",
    fontSize: ms(9),
    fontWeight: "700",
    textAlign: "center",
    marginTop: vs(2),
  },
  micMuteBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: s(6),
  },
  voiceDebugText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: ms(10),
    paddingHorizontal: s(12),
    paddingBottom: vs(4),
  },
  bottomDock: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#110720",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(12),
    paddingTop: vs(6),
    paddingBottom: vs(6),
  },
  bottomIconBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftRow: { flex: 1, flexDirection: "row", gap: s(8), justifyContent: "center" },
  giftShortcut: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftShortcutHighlight: {
    width: s(36),
    height: s(36),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -vs(6),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(10),
    paddingBottom: Platform.OS === "android" ? 0 : vs(5),
    paddingTop: vs(6),
    gap: s(8),
    borderBottomWidth: Platform.OS === "android" ? 0 : 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    height: Platform.OS === "android" ? vs(46) : vs(34),
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: s(6),
    paddingVertical: 0,
    paddingBottom: Platform.OS === "android" ? vs(12) : 0,
    color: "white",
    fontSize: ms(14),
    borderWidth: 0,
  },
  sendBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: s(18),
    height: vs(36),
    paddingHorizontal: s(14),
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: { color: "white", fontWeight: "700", fontSize: ms(13) },

  // Tag / @mention styles
  tagBtn: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: "rgba(124,77,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  tagBtnText: {
    color: "#b39dff",
    fontSize: ms(17),
    fontWeight: "800",
    lineHeight: vs(20),
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: s(18),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    height: Platform.OS === "android" ? vs(46) : vs(36),
    paddingHorizontal: s(8),
    overflow: "hidden",
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.4)",
    borderRadius: s(12),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    marginRight: s(4),
    maxWidth: s(110),
  },
  tagChipText: {
    color: "#d8c8ff",
    fontSize: ms(12),
    fontWeight: "700",
    flexShrink: 1,
  },
  tagChipClose: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(10),
    marginLeft: s(4),
    fontWeight: "700",
  },
  tagPickerContainer: {
    backgroundColor: "rgba(30,10,60,0.97)",
    borderTopLeftRadius: s(16),
    borderTopRightRadius: s(16),
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.35)",
    maxHeight: vs(260),
    paddingBottom: vs(8),
  },
  tagPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  tagPickerTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: ms(13),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  tagPickerClose: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(14),
    fontWeight: "700",
  },
  tagPickerEmpty: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    paddingVertical: vs(20),
    fontSize: ms(13),
  },
  tagPickerList: {
    paddingHorizontal: s(8),
  },
  tagPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(8),
    paddingHorizontal: s(8),
    borderRadius: s(10),
    gap: s(10),
  },
  tagPickerAvatar: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
  },
  tagPickerAvatarFallback: {
    backgroundColor: "rgba(124,77,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  tagPickerAvatarInitial: {
    color: "white",
    fontSize: ms(15),
    fontWeight: "700",
  },
  tagPickerUserInfo: {
    flex: 1,
  },
  tagPickerName: {
    color: "white",
    fontSize: ms(14),
    fontWeight: "600",
  },
  tagPickerUsername: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(12),
    marginTop: vs(1),
  },
  tagPickerMicBadge: {
    backgroundColor: "rgba(77,200,255,0.15)",
    borderRadius: s(8),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
  },
  tagPickerMicText: {
    fontSize: ms(12),
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
  shareTabItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  shareTabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },
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
  shareCancelText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "600",
  },

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
  playCenterOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 90,
    paddingRight: 12,
  },
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

  // ── Entry Banner (overlay — floats over screen, takes no layout space) ──
  entryBannerContainer: {
    position: "relative",
    overflow: "visible",
    marginBottom: vs(6),
  },
  entryBannerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  entryBannerBgDefault: {
    backgroundColor: "rgba(10, 4, 30, 0.85)",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "rgba(124, 77, 255, 0.45)",
  },
  entryBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: s(22),
    paddingRight: s(32),
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
  entryBannerFramedAvatarWrap: {
    position: "absolute",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,

  },
  entryBannerFramedTextWrap: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    overflow: "hidden",
    zIndex: 2,
  },
  entryBannerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 12,
    alignSelf: "center",
  },

  entryBannerTextContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  entryBannerName: {
    color: "#FFD700",
    fontWeight: "800",
    fontSize: 8.5,
    letterSpacing: 0.1,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  entryBannerJoined: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 9.5,
    marginTop: 1.5,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  // ── Backpack modal ──
  backpackBox: {
    position: "relative",
    backgroundColor: "#FFF0F5",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 14,
  },
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
  bpCurrencyVal: {
    color: "#1a1a2e",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 5,
  },
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
  bpMainTabScroll: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
    flexGrow: 0,
    flexShrink: 0,
  },
  bpMainTabContent: { paddingHorizontal: 12, gap: 2 },
  bpMainTabItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  bpMainTabText: {
    color: "rgba(26,26,46,0.4)",
    fontSize: 15,
    fontWeight: "600",
  },
  bpMainTabTextActive: { color: "#1a1a2e" },
  bpMainTabUnderline: {
    height: 2,
    width: "80%",
    backgroundColor: "#a78bfa",
    borderRadius: 2,
    marginTop: 4,
  },
  bpScrollArea: { flex: 1 },

  // Gift grid
  bpGiftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 12,
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
  bpGiftEmojiWrap: {
    width: GIFT_CARD_W - 20,
    height: GIFT_CARD_W - 20,
    borderRadius: (GIFT_CARD_W - 20) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bpGiftImageWrap: {
    width: GIFT_CARD_W - 16,
    height: GIFT_CARD_W - 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  bpGiftImage: {
    width: "88%",
    height: "88%",
  },
  bpGiftEmoji: { fontSize: 32 },
  bpGiftName: {
    color: "#1a1a2e",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 2,
  },
  bpGiftPriceRow: { flexDirection: "row", alignItems: "center" },
  bpGiftPriceText: { color: "#3D1A80", fontSize: 10, fontWeight: "700" },

  // Send bar
  bpSendBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.15)",
    backgroundColor: "#FFF0F5",
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
  bpSendName: { color: "#3D1A80", fontSize: 13, fontWeight: "600", flex: 1 },
  bpSendChev: { color: "#3D1A80", fontSize: 12 },
  bpSendQtyBtn: {
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  bpSendQtyText: { color: "#3D1A80", fontSize: 13, fontWeight: "700" },
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
    backgroundColor: "#FFF0F5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.15)",
    maxHeight: H * 0.5,
    zIndex: 41,
    elevation: 41,
  },
  giftRecipientEmpty: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  giftRecipientEmptyText: {
    color: "rgba(26,26,46,0.65)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  giftReceiverTitle: {
    color: "#3D1A80",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  giftReceiverSubtitle: {
    color: "rgba(26,26,46,0.5)",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  giftRecipientList: {
    maxHeight: H * 0.32,
  },
  giftRecipientListContent: {
    paddingBottom: 8,
  },
  giftRecipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.12)",
  },
  giftRecipientRowActive: {
    backgroundColor: "rgba(124,77,255,0.12)",
    borderColor: "rgba(124,77,255,0.35)",
  },
  giftRecipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#7c4dff",
  },
  giftRecipientInfo: { flex: 1, minWidth: 0 },
  giftRecipientName: { color: "#3D1A80", fontSize: 15, fontWeight: "600" },
  giftRecipientMeta: {
    color: "rgba(26,26,46,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  giftRecipientCheck: {
    color: "#3D1A80",
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
  bpSubTabText: {
    color: "rgba(26,26,46,0.4)",
    fontSize: 13,
    fontWeight: "600",
  },
  bpSubTabTextActive: { color: "#1a1a2e" },
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
  bpActEventText: {
    color: "rgba(26,26,46,0.45)",
    fontSize: 13,
    fontWeight: "600",
  },
  bpActEventTextActive: { color: "#1a1a2e" },

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
    color: "rgba(26,26,46,0.55)",
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
  bpVipBannerText: {
    flex: 1,
    color: "#ffd700",
    fontSize: 12,
    fontWeight: "700",
  },

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
  bpVipTagText: {
    color: "#fff8e1",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
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
  bpVipUpgradeText: {
    flex: 1,
    color: "#fff8e1",
    fontSize: 13,
    fontWeight: "700",
  },
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
  // ── Floating Gift Banner Display ──
  giftBannerCard: {
    maxWidth: W * 0.78,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 215, 0, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
    overflow: "visible",
    marginBottom: vs(6),
  },
  giftBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 24,
    backgroundColor: "rgba(22, 10, 46, 0.92)",
  },
  giftBannerAvatarWrap: {
    position: "relative",
    marginRight: 8,
  },
  giftBannerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FFD700",
  },
  giftBannerAvatarFallback: {
    backgroundColor: "#6d28d9",
    alignItems: "center",
    justifyContent: "center",
  },
  giftBannerAvatarInitial: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },
  giftBannerSparkleBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFD700",
    borderRadius: 6,
    width: 13,
    height: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  giftBannerTextCol: {
    justifyContent: "center",
    marginRight: 8,
    maxWidth: W * 0.42,
  },
  giftBannerSenderName: {
    color: "#FFE500",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  giftBannerActionText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 1,
  },
  giftBannerVisualWrap: {
    marginLeft: "auto",
    position: "relative",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  giftBannerGlowBackdrop: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.45)",
  },
  giftBannerImageContainer: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  giftBannerImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  giftBannerEmojiMain: {
    fontSize: 18,
    textAlign: "center",
    includeFontPadding: false,
    alignSelf: "center",
  },
  giftBannerEmojiBig: {
    fontSize: 22,
    textAlign: "center",
    includeFontPadding: false,
  },
  giftBannerMultiplierBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  giftBannerMultiplierGrad: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  giftBannerMultiplierText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 9.5,
    fontStyle: "italic",
  },

  // ── Floating Gift Rise (Bottom to Top) ──
  floatingGiftRiseWrap: {
    position: "absolute",
    top: 0,
    zIndex: 10002,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingGiftRiseGlow: {
    width: s(68),
    height: s(68),
    borderRadius: s(34),
    backgroundColor: "rgba(255, 215, 0, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
  },
  floatingGiftRiseImage: {
    width: s(58),
    height: s(58),
  },
  floatingGiftRiseEmoji: {
    fontSize: ms(40),
  },

  // ── Seat action popup (centered) ──
  seatActionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
  },
  seatActionCard: {
    width: "64%",
    maxWidth: 245,
    backgroundColor: "#1e1035",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  seatActionHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  seatActionHeaderEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  seatActionHeaderTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 1,
  },
  seatActionHeaderSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },
  seatActionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  seatActionBtn: {
    alignSelf: "center",
    width: "65%",
    maxWidth: 135,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 3,
  },
  seatActionBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  seatActionBtnIcon: { fontSize: 12 },
  seatActionBtnText: {
    color: "white",
    fontSize: 11.5,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  seatActionCancelBtn: {
    marginTop: 1,
    paddingVertical: 4,
    alignItems: "center",
  },
  seatActionCancelText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
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

  // Custom Reward Claimed Modal
  rewardModalOverlay: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
  },
  rewardModalOuter: {
    width: "75%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  activeUsersOverlay: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  activeUsersBox: {
    backgroundColor: "#1e0e36",
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "rgba(167, 139, 250, 0.35)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    width: "100%",
    maxWidth: 350,
    maxHeight: "65%",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  activeUsersHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255, 215, 240, 0.4)",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  activeUsersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 215, 240, 0.18)",
    marginBottom: 6,
  },
  activeUsersTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  activeUsersTitle: {
    color: "white",
    fontSize: 13.5,
    fontWeight: "700",
  },
  activeUsersBadge: {
    backgroundColor: "rgba(124,77,255,0.3)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  activeUsersBadgeText: {
    color: "#c4b5fd",
    fontSize: 10,
    fontWeight: "700",
  },
  activeUsersSeatedBadge: {
    backgroundColor: "rgba(167, 139, 250, 0.22)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.4)",
  },
  activeUsersSeatedBadgeText: {
    color: "#e9d5ff",
    fontSize: 9.5,
    fontWeight: "700",
  },
  activeUsersCloseBtn: {
    padding: 3,
  },
  activeUsersCloseText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  activeUsersList: {
    maxHeight: 220,
  },
  activeUsersListContent: {
    paddingVertical: 2,
    gap: 5,
  },
  activeUsersEmpty: {
    paddingVertical: 16,
    alignItems: "center",
  },
  activeUsersEmptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  activeUserCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: "transparent",
    gap: 7,
  },
  activeUserAvatarWrap: {
    position: "relative",
  },
  activeUserAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  activeUserAvatarPlaceholder: {
    backgroundColor: "#3b1580",
    justifyContent: "center",
  },
  rewardModalHeaderImg: {
    position: "absolute",
    top: -70,
    width: "110%",
    height: 145,
    zIndex: 10,
    elevation: 10,
    alignSelf: "center",
  },
  rewardModalContainer: {
    width: "100%",
    borderRadius: 20,
    alignItems: "center",
    paddingTop: 55,
    paddingBottom: 20,
    elevation: 5,
  },
  rewardModalCloseIcon: {
    position: "absolute",
    top: -60,
    right: 0,
    zIndex: 100,
    padding: 5,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
  },
  rewardModalTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "900",
    textShadowColor: "#d6249f",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    zIndex: 20,
    marginBottom: 20,
  },
  rewardModalBody: {
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 10,
  },
  rewardModalGiftBox: {
    width: 100,
    height: 100,
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#ffc107",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeUserInfo: {
    flex: 1,
  },
  activeUserName: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 0,
  },
  activeUserStatus: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
  },
  activeUserNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 0,
  },
  activeUserLevelImg: { height: 14, width: 14 * (142 / 149) },
  activeUserVipBadge: { width: 14, height: 14 },
  activeUserVerifiedBadge: { width: 14 * (438 / 179), height: 14 },
  activeUserActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  seatStatusBadge: {
    backgroundColor: "rgba(167, 139, 250, 0.2)",
    borderWidth: 1,
    borderColor: "#a78bfa",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  seatStatusText: {
    color: "#e9d5ff",
    fontSize: 11,
    fontWeight: "600",
  },
  audienceStatusBadge: {
    backgroundColor: "rgba(167, 139, 250, 0.12)",
    borderColor: "rgba(167, 139, 250, 0.35)",
  },
  audienceStatusText: {
    color: "#c4b5fd",
    fontSize: 11,
    fontWeight: "600",
  },
  leaveSeatBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveSeatBtnText: {
    color: "#fca5a5",
    fontSize: 11,
    fontWeight: "700",
  },
  rewardModalGiftImg: {
    width: "80%",
    height: "80%",
    position: "absolute",
    top: "10%",
    left: "10%",
  },
  rewardModalGiftBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    color: "#e64a19",
    fontSize: 12,
    fontWeight: "bold",
  },
  rewardModalGiftLabel: {
    color: "#e64a19",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  rewardModalTips: {
    color: "#a0a0a0",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 16,
  },
  rewardModalOkBtn: {
    width: "100%",
    height: 42,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff007a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  rewardModalOkText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  followModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  followModalBox: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 3,
    borderColor: "#F8C8DC",
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 32,
    width: "100%",
    maxWidth: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    position: "relative",
  },
  followModalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(26, 26, 46, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
  },
  followModalAvatarWrap: {
    position: "absolute",
    top: -40,
    alignSelf: "center",
    zIndex: 10,
    elevation: 10,
    backgroundColor: "transparent",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  followModalAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    // borderWidth: 3.5,
    // borderColor: "#ffffff",
  },
  followModalRoomName: {
    color: "#1a1a2e",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  followModalRoomId: {
    color: "rgba(26, 26, 46, 0.55)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  followModalActionBtn: {
    backgroundColor: "#7c4dff",
    paddingVertical: 11,
    paddingHorizontal: 36,
    borderRadius: 22,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    marginBottom: 8,

  },
  followModalActionBtnFollowing: {
    backgroundColor: "rgba(124, 77, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(124, 77, 255, 0.35)",
    shadowOpacity: 0,
    elevation: 0,
  },
  followModalActionBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  followModalActionBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  followModalActionBtnTextFollowing: {
    color: "#7c4dff",
  },

  // ── Room Activity Event Banner (Enter / Leave / Seated) ──
  activityBannerContainer: {
    position: "absolute",
    bottom: vs(155),
    left: s(14),
    zIndex: 9999,
    elevation: 99,
    maxWidth: W * 0.78,
  },
  activityBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.4)",
    backgroundColor: "rgba(22, 10, 46, 0.90)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  activityBannerAvatarWrap: {
    marginRight: 8,
  },
  activityBannerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  activityBannerAvatarFallback: {
    backgroundColor: "#6d28d9",
    alignItems: "center",
    justifyContent: "center",
  },
  activityBannerAvatarInitial: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  activityBannerTextCol: {
    justifyContent: "center",
    marginRight: 10,
    maxWidth: W * 0.46,
  },
  activityBannerName: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  activityBannerAction: {
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 1,
  },
  activityBannerClapBtn: {
    marginLeft: "auto",
    borderRadius: 16,
    overflow: "hidden",
  },
  activityBannerClapGrad: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activityBannerClapText: {
    fontSize: 14,
  },
});


