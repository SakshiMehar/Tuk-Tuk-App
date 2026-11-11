import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Bell, ChevronRight, Plus, ThumbsUp } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Dimensions,
  Easing,
  FlatList,
  InteractionManager,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Image as RNImage,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AppBackground from "../../Components/AppBackground";
import ComingSoonModal from "../../Components/ComingSoonModal";
import DiamondRechargeModal from "../../Components/DiamondRechargeModal";
import PostCreateSheet from "../../Components/PostCreateSheet";
import PostImageViewer from "../../Components/PostImageViewer";
import ProfileAvatarWithFrame from "../../Components/ProfileAvatarWithFrame";
import ReportReasonModal from "../../Components/ReportReasonModal";
import Toast from "../../Components/Toast";
import {
  getFollowingRooms,
  getRecentlyRooms,
  getRoomRecommendations,
} from "../../src/api/partyApi";
import {
  addComment,
  createPost,
  deletePost,
  getPostComments,
  likePost,
  markInterested,
  markNotInterested,
  reportUser,
  shareUser,
  unlikePost,
} from "../../src/api/postApi";
import { patchMyProfile } from "../../src/api/profileApi";
import {
  VIP_PROFILE_FRAME_LAYOUT,
  VIP_TIER_THRESHOLDS,
  resolveVipTierFromAssetUrl,
} from "../../src/constants/vip";
import {
  getAvatarSource,
  isBundledAvatarId,
} from "../../src/data/avatarOptions";
import {
  COUNTRY_OPTIONS,
  findCountryByName,
} from "../../src/data/countryOptions";
import { useModalKeyboardInset } from "../../src/hooks/useKeyboardInset";
import { useWalletBalance } from "../../src/hooks/useWalletBalance";
import { fetchUserDecorations } from "../../src/services/decorationsService";
import * as homeService from "../../src/services/homeService";
import { syncNewUserFrameForSession } from "../../src/services/newUserFrameService";
import {
  fetchNotificationsData,
  markAllNotificationsAsRead,
  markNotificationsAsRead,
} from "../../src/services/notificationService";
import {
  blockUser,
  followUser,
  isSameUser,
  loadFollowers,
  loadFollowing,
  unfollowUser,
} from "../../src/services/relationshipService";
import { syncUserCountryToServer } from "../../src/services/userCountryService";
import { updateUserProfile } from "../../src/services/userProfileService";
import { loadMyVipAssets } from "../../src/services/vipService";
import { wsService } from "../../src/services/websocket";
import { getUser, updateUser } from "../../src/store/authStore";
import {
  applyWalletFromSources,
  refreshWalletBalance,
} from "../../src/store/walletStore";
import { openUserChat } from "../../src/utils/chatNavigation";
import { getDeviceCoordinates } from "../../src/utils/deviceLocation";
import { resolveLocalLevelBadge } from "../../src/utils/levelBadge";
import { isUserLive, useUserOnlineOrLiveStatus } from "../../src/utils/liveStatus";
import { resolveEntityNewUserFrameSource } from "../../src/utils/newUserFrame";
import { navigateFromNotification } from "../../src/utils/notificationNavigation";
import { resolveProfileAvatarSource } from "../../src/utils/profileAvatar";
import { openUserProfile } from "../../src/utils/profileNavigation";
import { ms, s, vs } from "../../src/utils/responsive";
import { getAppUserId, isOwnContent } from "../../src/utils/sessionUser";
import { resolveImageSource } from "../../src/utils/videoSource";
import { extractVipProfileFrameUrl } from "../../src/utils/vipProfileFrame";

// Same per-tier VIP "logo" crest used as the VIP badge everywhere else it
// appears (UserProfileView, ChatTab) — derives the logo URL for a card that
// already carries a vipProfileFrameUrl, with no extra network call.
const VIP_LOGO_BY_TIER = Object.fromEntries(
  VIP_TIER_THRESHOLDS.map(({ tier, assets }) => [tier, assets?.logo ?? null]),
);

const H_PAD = 20;
const CARD_GAP = 10;
// Module-level fallbacks using Dimensions — used in StyleSheet.create and
// stable module-level arrays.
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_SIZE = ((SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2) * 0.88;
const BANNER_SLIDE_WIDTH = SCREEN_WIDTH - H_PAD * 2;

// Instagram-style bounds: never taller than 4:5 portrait, never wider than
// 1.91:1 landscape — keeps the feed's per-post height sane while matching
// the box ratio to the photo for the vast majority of normal aspect ratios.
const MIN_POST_IMAGE_RATIO = 4 / 5;
const MAX_POST_IMAGE_RATIO = 1.91;
const clampAspectRatio = (ratio) =>
  Math.min(MAX_POST_IMAGE_RATIO, Math.max(MIN_POST_IMAGE_RATIO, ratio));

// Drops posts sharing an id with one already seen — guards against the
// backend returning an overlapping page (e.g. new posts shifting offsets
// between requests), which otherwise renders the same post id twice and
// trips FlatList's "duplicate key" warning.
const dedupePostsById = (posts) => {
  const seen = new Set();
  return posts.filter((post) => {
    const id = String(post?.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// Stable arrays at module level — never recreated on re-renders
const WAVE_HEIGHTS = [8, 14, 10, 18, 12];
const MATCH_WAVE_HEIGHTS = [5, 10, 7, 13, 9, 6, 11];

const HOME_S3_BASE =
  "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/images";

const actionCards = [
  {
    title: "Voice Party",
    subtitle: "Join a live room",
    colors: ["#362407ff", "#f76b1c"],
    img: { uri: `${HOME_S3_BASE}/TM1.png` },
    partyRandom: true,
    showWave: true,
    imgSize: CARD_SIZE * 0.8,
    gifDelay: 0,
  },
  {
    title: "Find Friends",
    subtitle: "Meet new people",
    colors: ["#180c3aff", "#a647eaff"],
    img: { uri: `${HOME_S3_BASE}/ofcchat.gif` },
    route: "/find-friends",
    imgSize: CARD_SIZE * 0.88,
    gifDelay: 400,
  },
  {
    title: "Nearby",
    subtitle: "People around you",
    colors: ["#143238ff", "#0077b6"],
    img: { uri: `${HOME_S3_BASE}/TM3.gif` },
    route: "/nearby",
    imgSize: CARD_SIZE * 0.9,
    gifDelay: 800,
  },
  {
    title: "Blind Pick",
    subtitle: "Mystery match",
    colors: ["#dc62bcff", "#351743ff"],
    img: { uri: `${HOME_S3_BASE}/TM2B.gif` },
    route: "/blind-pick",
    imgSize: CARD_SIZE * 0.8,
    gifDelay: 1200,
  },
];

const iconItems = [
  {
    label: "Voice Call",
    img: { uri: `${HOME_S3_BASE}/officialchat.png` },
    colors: ["#cf91b6ff", "#180a31ff"],
    imgSize: 60,
    comingSoon: true,
  },
  {
    label: "Personality Test",
    img: { uri: `${HOME_S3_BASE}/blindpick.png` },
    colors: ["#080334ff", "#ac4dffff"],
    imgSize: 60,
    route: "/personality-test",
  },
  {
    label: "Truth & Dare",
    img: { uri: `${HOME_S3_BASE}/truthdare.png` },
    colors: ["#15072dff", "#486ba8ff"],
    imgSize: 150,
    comingSoon: true,
  },
  {
    label: "Invitation\nRewards",
    img: { uri: `${HOME_S3_BASE}/invitationReward.png` },
    colors: ["#76093fff", "#ba741eff"],
    imgSize: 80,
    comingSoon: true,
  },
  {
    label: "Ludo",
    img: { uri: `${HOME_S3_BASE}/ludo.jpg` },
    colors: ["#041e04ff", "#175726ff"],
    imgSize: 55,
    comingSoon: true,
  },
  {
    label: "Snakes & ladders",
    img: { uri: `${HOME_S3_BASE}/SnakesAndLadders.jpg` },
    colors: ["#0c250cff", "#d2ec23cf"],
    imgSize: 50,
    comingSoon: true,
  },
  {
    label: "Draw & Guess",
    img: { uri: `${HOME_S3_BASE}/draw+n+guess.jpg` },
    colors: ["#5f0909ff", "#9e4c3eff"],
    imgSize: 50,
    comingSoon: true,
  },
];

const TABS = ["For You", "Online", "Following", "New"];

// Per-tab empty-state copy shown when a tab has no content yet.
const TAB_EMPTY_COPY = {
  "For You": {
    emoji: "✨",
    title: "Nothing here yet",
    subtitle: "Posts picked for you will show up here.",
  },
  Online: {
    emoji: "🟢",
    title: "No one's online",
    subtitle: "Active people will appear here when they come online.",
  },
  Following: {
    emoji: "👥",
    title: "No posts from following",
    subtitle: "Follow people to see their latest posts here.",
  },
  New: {
    emoji: "🆕",
    title: "No new posts",
    subtitle: "Fresh posts will appear here as they're shared.",
  },
};

// Local fallback images for banner slides.
// When the API provides imageUrl, that CDN URL is used instead.
const BANNER_IMAGES = [
  require("../../assets/images/cat gif.gif"),
  require("../../assets/images/labelgif (1).jpg"),
  require("../../assets/images/labelgif (2).jpg"),
  require("../../assets/images/labelgif (3).jpg"),
  require("../../assets/images/labelgif (4).jpg"),
];

// ─────────────────────────────────────────────────────────────
// Memoized sub-components — defined outside Home so React never
// recreates them and FlatList can skip re-renders efficiently
// ─────────────────────────────────────────────────────────────

// Staggers GIF decode across time so multiple GIFs never start
// decoding simultaneously. Non-GIF images pass delay=0 and render
// immediately. The card's LinearGradient shows as placeholder.
const StaggeredImage = memo(({ source, style, contentFit, delay }) => {
  const [ready, setReady] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const task = InteractionManager.runAfterInteractions(() => {
      const t = setTimeout(() => setReady(true), delay);
      return () => clearTimeout(t);
    });
    return () => task.cancel();
  }, []);

  if (!ready) return null;
  return (
    <Image source={source} style={style} contentFit={contentFit ?? "contain"} />
  );
});
StaggeredImage.displayName = "StaggeredImage";

// ── More-menu constants ───────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { id: "whatsapp", label: "WhatsApp", bg: "#25D366", emoji: "💬" },
  { id: "telegram", label: "Telegram", bg: "#2CA5E0", emoji: "✈️" },
  { id: "instagram", label: "Instagram", bg: "#E1306C", emoji: "📸" },
  { id: "facebook", label: "Facebook", bg: "#1877F2", emoji: "📘" },
  { id: "twitter", label: "X / Twitter", bg: "#14171A", emoji: "🐦" },
  { id: "more", label: "More", bg: "#7c4dff", emoji: "⋯" },
];

const MENU_ACTIONS = [
  { id: "interested", label: "Interested", emoji: "👍", color: "#7c4dff" },
  {
    id: "not_interested",
    label: "Not Interested",
    emoji: "👎",
    color: "#ff4ea3",
  },
  { id: "report", label: "Report", emoji: "🚩", color: "#ff6b35" },
  { id: "block", label: "Block User", emoji: "🚫", color: "#ff3f72" },
];

// ── Post more-menu bottom sheet ───────────────────────────────
const PostMoreMenu = memo(
  ({
    visible,
    post,
    friends,
    onClose,
    onBlock,
    onDelete,
    onReport,
    currentUserId,
  }) => {
    // Show delete if: post was created by this user (flag), OR userId matches current user
    const isOwnPost =
      post?._isOwn === true || isOwnContent(post, currentUserId);
    const menuActions = isOwnPost
      ? MENU_ACTIONS.filter((action) => action.id !== "block")
      : MENU_ACTIONS;

    const handleSocialShare = useCallback(
      async (platform) => {
        const text = `Check this out on Tuk Tuk! "${(post?.text ?? "").slice(0, 100)}..."`;

        if (post?.userId) {
          shareUser(post.userId).catch(() => { });
        }

        if (platform.id === "more") {
          await Share.share({ message: text }).catch(() => { });
          onClose();
          return;
        }
        const deepLinks = {
          whatsapp: `whatsapp://send?text=${encodeURIComponent(text)}`,
          telegram: `tg://msg?text=${encodeURIComponent(text)}`,
          instagram: `instagram://`,
          facebook: `fb://facewebmodal/f?href=${encodeURIComponent("https://tuktuk.app")}`,
          twitter: `twitter://post?message=${encodeURIComponent(text)}`,
        };
        const url = deepLinks[platform.id];
        const canOpen = await Linking.canOpenURL(url).catch(() => false);
        if (canOpen) {
          Linking.openURL(url);
        } else {
          await Share.share({ message: text }).catch(() => { });
        }
        onClose();
      },
      [post, onClose],
    );

    const handleAction = useCallback(
      async (action) => {
        onClose();
        const targetUserId = post?.userId;
        switch (action.id) {
          case "block":
            onBlock(targetUserId, post?.name);
            break;
          case "interested":
            try {
              await markInterested(targetUserId);
            } catch {
              // Ignore — non-critical interaction.
            }
            break;
          case "not_interested":
            try {
              await markNotInterested(targetUserId);
            } catch {
              // Ignore — non-critical interaction.
            }
            break;
          case "report":
            onReport?.(targetUserId, post?.name);
            break;
          case "delete":
            onDelete?.(post?.id);
            break;
          default:
            break;
        }
      },
      [post, onClose, onBlock, onReport],
    );

    if (!post) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={moreMenuStyles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            activeOpacity={1}
          />
          <View style={moreMenuStyles.sheet}>
            <LinearGradient
              colors={["#1e0a3c", "#16082a", "#0d0618"]}
              style={StyleSheet.absoluteFill}
            />
            {/* Top border glow */}
            <LinearGradient
              colors={["#7c4dff", "#ff4ea3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={moreMenuStyles.topGlow}
            />
            {/* Drag handle */}
            <View style={moreMenuStyles.handle} />

            {/* ── SHARE WITH FRIENDS ── */}
            <Text style={moreMenuStyles.sectionTitle}>Share with friends</Text>
            {friends.length > 0 ? (
              <FlatList
                data={friends}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(f) => f.id}
                contentContainerStyle={moreMenuStyles.friendsRow}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={moreMenuStyles.friendItem}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#7c4dff", "#ff4ea3"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={moreMenuStyles.friendRing}
                    >
                      <ProfileAvatarWithFrame
                        user={item}
                        avatarSource={toImageSource(item.avatar)}
                        frameSource={item.vipProfileFrameUrl}
                        size={52}
                        avatarStyle={moreMenuStyles.friendAvatar}
                        {...(item.vipProfileFrameUrl
                          ? {
                            frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
                            frameResizeMode:
                              VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                            frameOffsetX:
                              VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                            frameOffsetY:
                              VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                            frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                            avatarBoost: VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
                            avatarOffsetY:
                              VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                          }
                          : {})}
                      />
                    </LinearGradient>
                    <Text style={moreMenuStyles.friendName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={moreMenuStyles.emptyFriends}>
                No friends to show
              </Text>
            )}

            {/* ── SHARE ON SOCIAL ── */}
            <Text style={moreMenuStyles.sectionTitle}>Share on</Text>
            <View style={moreMenuStyles.platformsRow}>
              {SOCIAL_PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={moreMenuStyles.platformItem}
                  onPress={() => handleSocialShare(p)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      moreMenuStyles.platformIcon,
                      { backgroundColor: p.bg },
                    ]}
                  >
                    <Text style={moreMenuStyles.platformEmoji}>{p.emoji}</Text>
                  </View>
                  <Text style={moreMenuStyles.platformLabel}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Divider */}
            <LinearGradient
              colors={["transparent", "rgba(124,77,255,0.4)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={moreMenuStyles.divider}
            />

            {/* ── ACTION BUTTONS ── */}
            {menuActions.map((action, i) => (
              <View key={action.id}>
                <TouchableOpacity
                  style={moreMenuStyles.actionRow}
                  onPress={() => handleAction(action)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      moreMenuStyles.actionIconBox,
                      { backgroundColor: action.color + "25" },
                    ]}
                  >
                    <Text style={moreMenuStyles.actionEmoji}>
                      {action.emoji}
                    </Text>
                  </View>
                  <Text
                    style={[
                      moreMenuStyles.actionLabel,
                      action.id === "block" && { color: "#ff3f72" },
                    ]}
                  >
                    {action.id === "block" && post?.name
                      ? `Block ${post.name}`
                      : action.label}
                  </Text>
                  <Text style={moreMenuStyles.actionChevron}>›</Text>
                </TouchableOpacity>
                {i < menuActions.length - 1 && (
                  <View style={moreMenuStyles.actionDivider} />
                )}
              </View>
            ))}

            {/* ── DELETE (own posts only) ── */}
            {isOwnPost && (
              <>
                <View style={moreMenuStyles.actionDivider} />
                <TouchableOpacity
                  style={moreMenuStyles.actionRow}
                  onPress={() => handleAction({ id: "delete" })}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      moreMenuStyles.actionIconBox,
                      { backgroundColor: "#ff3f7225" },
                    ]}
                  >
                    <Text style={moreMenuStyles.actionEmoji}>🗑️</Text>
                  </View>
                  <Text
                    style={[moreMenuStyles.actionLabel, { color: "#ff3f72" }]}
                  >
                    Delete Post
                  </Text>
                  <Text style={moreMenuStyles.actionChevron}>›</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={moreMenuStyles.bottomPad} />
          </View>
        </View>
      </Modal>
    );
  },
);
PostMoreMenu.displayName = "PostMoreMenu";

const moreMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  topGlow: {
    height: 2,
    width: "100%",
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#b388ff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  friendsRow: {
    paddingBottom: 18,
    gap: 14,
    paddingRight: 4,
  },
  friendItem: {
    alignItems: "center",
    width: 62,
  },
  friendRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    marginBottom: 5,
  },
  friendAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1a0a2e",
  },
  friendName: {
    color: "#d4b8ff",
    fontSize: 10,
    textAlign: "center",
  },
  emptyFriends: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 18,
  },
  platformsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  platformItem: {
    alignItems: "center",
    gap: 6,
  },
  platformIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  platformEmoji: {
    fontSize: 22,
  },
  platformLabel: {
    color: "#c4a8ff",
    fontSize: 9.5,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 14,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionEmoji: {
    fontSize: 19,
  },
  actionLabel: {
    flex: 1,
    color: "#f0e6ff",
    fontSize: 15,
    fontWeight: "500",
  },
  actionChevron: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 22,
    fontWeight: "300",
  },
  actionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 54,
  },
  bottomPad: {
    height: 28,
  },
});

// ── Floating Action Button ─────────────────────────────────────
const PostFAB = memo(({ onPress }) => {
  const insets = useSafeAreaInsets();
  const bottomPos = Math.max(insets.bottom, 10) + 64;

  return (
    <TouchableOpacity
      style={[fabStyles.fab, { bottom: bottomPos }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={fabStyles.outerHalo}>
        <LinearGradient
          colors={["#A855F7", "#7C3AED", "#6D28D9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={fabStyles.gradient}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={3} />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
});
PostFAB.displayName = "PostFAB";

const fabStyles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    zIndex: 100,
    elevation: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  outerHalo: {
    padding: 1,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  gradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
});

// ── Comment helpers ───────────────────────────────────────────
const timeAgo = (ts) => {
  if (!ts) return "";
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
};

const QUICK_EMOJIS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

// ── Comment Sheet ─────────────────────────────────────────────
const CommentSheet = memo(({ visible, postId, onClose }) => {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [likedComments, setLiked] = useState([]);
  const [composerHeight, setComposerHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(SCREEN_HEIGHT);
  const baselineWindowHeight = useRef(SCREEN_HEIGHT);
  const inputRef = useRef(null);
  const { keyboardHeight, syncKeyboardHeight } = useModalKeyboardInset(visible);

  useEffect(() => {
    if (!visible) return undefined;
    const baseline = Dimensions.get("window").height;
    baselineWindowHeight.current = baseline;
    setWindowHeight(baseline);

    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setWindowHeight(window.height);
    });
    return () => sub.remove();
  }, [visible]);

  // Lift only what adjustResize did not already handle — keeps input flush on the keyboard.
  const resizeLift =
    keyboardHeight > 0
      ? Math.max(0, baselineWindowHeight.current - windowHeight)
      : 0;
  const keyboardLift =
    keyboardHeight > 0
      ? resizeLift >= keyboardHeight * 0.75
        ? 0
        : resizeLift <= 0
          ? keyboardHeight
          : Math.max(0, keyboardHeight - resizeLift)
      : 0;

  // Load comments whenever sheet opens
  useEffect(() => {
    if (!visible || !postId) return;
    setComments([]);
    setText("");
    setLoading(true);
    getPostComments(postId)
      .then((data) => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.content)) list = data.content;
        else if (Array.isArray(data?.comments)) list = data.comments;
        else if (Array.isArray(data?.comments?.content))
          list = data.comments.content;
        else if (Array.isArray(data?.data)) list = data.data;
        else if (Array.isArray(data?.data?.content)) list = data.data.content;
        else if (Array.isArray(data?.items)) list = data.items;
        else if (Array.isArray(data?.result)) list = data.result;

        setComments(list);
      })
      .finally(() => setLoading(false));
  }, [visible, postId]);

  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    const draft = text.trim();
    setText("");
    setSending(true);
    const temp = {
      id: `temp_${Date.now()}`,
      text: draft,
      user: { name: "You" },
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    // Add to bottom (newest last)
    setComments((prev) => [...prev, temp]);
    try {
      const saved = await addComment(postId, draft);
      // Replace temp with real saved comment, keep temp data as fallback
      setComments((prev) =>
        prev.map((c) =>
          c.id === temp.id ? { ...c, ...(saved ?? {}), _temp: false } : c,
        ),
      );
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== temp.id));
      setText(draft);
    } finally {
      setSending(false);
    }
  }, [text, sending, postId]);

  const handleQuickEmoji = useCallback(
    (emoji) => {
      setText((prev) => prev + emoji);
      inputRef.current?.focus();
      syncKeyboardHeight();
    },
    [syncKeyboardHeight],
  );

  const handleReply = useCallback(
    (userName) => {
      setText(`@${userName} `);
      inputRef.current?.focus();
      syncKeyboardHeight();
    },
    [syncKeyboardHeight],
  );

  const toggleCommentLike = useCallback((id) => {
    setLiked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const renderComment = useCallback(
    ({ item }) => {
      const avatarUri =
        item.user?.avatar ??
        item.user?.avatarUrl ??
        item.author?.avatar ??
        null;
      const userName =
        item.user?.name ??
        item.user?.username ??
        item.author?.name ??
        item.userName ??
        "User";
      const commentText =
        item.text ?? item.content ?? item.comment ?? item.body ?? "";
      const ts = item.createdAt ?? item.timestamp ?? item.created_at ?? null;
      const isLikedC = likedComments.includes(item.id);

      return (
        <View style={cs.row}>
          {/* Avatar with gradient ring */}
          <LinearGradient
            colors={["#7c4dff", "#ff4ea3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={cs.ring}
          >
            <View style={cs.ringInner}>
              {avatarUri ? (
                <Image
                  source={toImageSource(avatarUri)}
                  style={cs.avatarImg}
                  cachePolicy="memory-disk"
                />
              ) : (
                <Text style={cs.avatarFallback}>👤</Text>
              )}
            </View>
          </LinearGradient>

          {/* Text block */}
          <View style={cs.bubble}>
            <View style={cs.metaRow}>
              <Text style={cs.username}>{userName}</Text>
              <Text style={cs.timeText}>{timeAgo(ts)}</Text>
            </View>
            <Text style={cs.commentText}>{commentText}</Text>
            <TouchableOpacity onPress={() => handleReply(userName)}>
              <Text style={cs.replyBtn}>Reply</Text>
            </TouchableOpacity>
          </View>

          {/* Like thumbs-up */}
          <TouchableOpacity
            style={cs.heartBtn}
            onPress={() => toggleCommentLike(item.id)}
          >
            <ThumbsUp
              size={16}
              color={isLikedC ? "#ff4ea3" : "rgba(0,0,0,0.55)"}
              fill={isLikedC ? "#ff4ea3" : "transparent"}
            />
          </TouchableOpacity>
        </View>
      );
    },
    [likedComments, handleReply, toggleCommentLike],
  );

  if (!visible) return null;

  return (
    <View style={cs.hostOverlay}>
      <View style={cs.fullSheet}>
        <LinearGradient
          colors={["#1e0a3c", "#16082a", "#0d0618"]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["#7c4dff", "#ff4ea3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={cs.topGlow}
        />

        <View style={[cs.sheetTop, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={cs.handle} />

          <View style={cs.header}>
            <Text style={cs.title}>
              Comments{comments.length > 0 ? ` (${comments.length})` : ""}
            </Text>
            <TouchableOpacity onPress={onClose} style={cs.closeBtn}>
              <Text style={cs.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={["transparent", "rgba(124,77,255,0.35)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={cs.divider}
          />
        </View>

        <ScrollView
          style={[cs.listFill, { marginBottom: composerHeight + keyboardLift }]}
          contentContainerStyle={cs.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {loading ? (
            <View style={cs.loadingBox}>
              <ActivityIndicator color="#7c4dff" size="large" />
            </View>
          ) : comments.length === 0 ? (
            <View style={cs.emptyBox}>
              <Text style={cs.emptyEmoji}>💬</Text>
              <Text style={cs.emptyTitle}>No comments yet</Text>
              <Text style={cs.emptySub}>Be the first to comment!</Text>
            </View>
          ) : (
            comments.map((item, i) => (
              <View key={String(item.id ?? i)}>{renderComment({ item })}</View>
            ))
          )}
        </ScrollView>

        <View
          style={[cs.composerDock, cs.composerFloat, { bottom: keyboardLift }]}
          onLayout={(event) =>
            setComposerHeight(event.nativeEvent.layout.height)
          }
        >
          <LinearGradient
            colors={["#16082a", "#0d0618"]}
            style={StyleSheet.absoluteFill}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={cs.emojiBar}
            contentContainerStyle={cs.emojiBarContent}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={cs.emojiBtn}
                onPress={() => handleQuickEmoji(e)}
                activeOpacity={0.7}
              >
                <Text style={cs.emojiTxt}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={cs.inputRow}>
            <View style={cs.inputAvatar}>
              <Text style={{ fontSize: 14 }}>👤</Text>
            </View>
            <View style={cs.inputWrap}>
              <TextInput
                ref={inputRef}
                style={cs.input}
                placeholder="Add a comment…"
                placeholderTextColor="rgba(255,255,255,0.32)"
                value={text}
                onChangeText={setText}
                onFocus={syncKeyboardHeight}
                multiline
                maxLength={300}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || sending}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  text.trim() ? ["#7c4dff", "#ff4ea3"] : ["#2a2a3e", "#2a2a3e"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[cs.sendBtn, (!text.trim() || sending) && cs.sendBtnOff]}
              >
                {sending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={cs.sendIcon}>➤</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});
CommentSheet.displayName = "CommentSheet";

const cs = StyleSheet.create({
  hostOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    elevation: 2000,
  },
  fullSheet: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  sheetTop: {
    paddingHorizontal: 16,
  },
  topGlow: { height: 2 },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  divider: { height: 1, marginBottom: 10 },

  loadingBox: {
    flex: 1,
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  listFill: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: { paddingBottom: 12, flexGrow: 1 },
  emptyWrap: { flexGrow: 1, justifyContent: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { color: "#d4b8ff", fontSize: 15, fontWeight: "600" },
  emptySub: { color: "rgba(255,255,255,0.35)", fontSize: 13 },

  // Comment row
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  ring: { width: 44, height: 44, borderRadius: 22, padding: 2 },
  ringInner: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1a0a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: { fontSize: 20 },
  bubble: { flex: 1, gap: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { color: "#e0ccff", fontSize: 13, fontWeight: "700" },
  timeText: { color: "rgba(255,255,255,0.35)", fontSize: 11 },
  commentText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 20,
  },
  replyBtn: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 },
  heartBtn: { paddingTop: 2, paddingLeft: 4 },
  heartIcon: { fontSize: 16 },
  heartIconLiked: { fontSize: 16 },

  // Quick emoji bar + composer (pinned above keyboard)
  composerDock: {
    width: "100%",
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: "rgba(13,6,24,0.98)",
  },
  composerFloat: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  emojiBar: {
    borderTopWidth: 0,
    marginTop: 0,
  },
  emojiBarContent: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 4,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiTxt: { fontSize: 20 },

  // Input row
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124,77,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 42,
    justifyContent: "center",
  },
  input: {
    color: "#fff",
    fontSize: 14,
    maxHeight: 88,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { opacity: 0.35 },
  sendIcon: { color: "#fff", fontSize: 15 },
});

const toImageSource = (uri) => {
  if (!uri) return null;
  // Backend may send a bundled preset id (e.g. "avatar3") instead of a real
  // image URL — resolve those to the local asset, otherwise treat as a URI.
  if (isBundledAvatarId(uri)) return getAvatarSource(uri);
  return { uri };
};

const resolveNotifIcon = (icon, type) => {
  const str = String(type || "").toLowerCase();
  if (
    str.includes("message") ||
    str.includes("chat") ||
    str.includes("direct_message")
  )
    return "💬";
  if (str.includes("gift")) return "🎁";
  if (str.includes("like") || str.includes("heart")) return "👍";
  if (str.includes("follow") || str.includes("friend")) return "👤";
  if (str.includes("party") || str.includes("room") || str.includes("voice"))
    return "🎉";
  if (
    icon &&
    typeof icon === "string" &&
    icon.trim().length > 0 &&
    icon !== "🔔" &&
    icon.length <= 4
  )
    return icon;
  return "🔔";
};

const PostCard = memo(
  ({
    post,
    onMore,
    isFollowing,
    onFollowToggle,
    isLiked,
    onLikeToggle,
    onCommentPress,
    onImagePress,
    currentUserId,
    currentUserAvatarSource,
    currentUserFrameSource,
    currentUserVipFrameSource,
  }) => {
    const router = useRouter();
    const [imgFailed, setImgFailed] = useState(false);
    const [imgAspectRatio, setImgAspectRatio] = useState(null);
    const isOwnPost =
      post?._isOwn === true || isOwnContent(post, currentUserId);
    const handleAvatarPress = () => {
      openUserProfile(router, {
        userId: post.userId,
        name: post.name,
        avatar: post.avatar,
      });
    };
    const postAvatarSource =
      isOwnPost && currentUserAvatarSource
        ? currentUserAvatarSource
        : post.avatar
          ? toImageSource(post.avatar)
          : null;
    const isOwnVipFrame = isOwnPost && Boolean(currentUserVipFrameSource);
    const postFrameSource = isOwnPost
      ? (currentUserVipFrameSource ?? currentUserFrameSource)
      : resolveEntityNewUserFrameSource({
        hasNewUserFrame: post.authorHasNewUserFrame,
      });
    // Resolve media — prefer CDN URL(s), fall back to local URI picked from device
    const imageUri = post.imageUrl ?? post._localMediaUri ?? null;
    const galleryUrls = post.imageUrls?.length
      ? post.imageUrls
      : imageUri
        ? [imageUri]
        : [];
    const isGallery = galleryUrls.length > 1;
    const hasImage = imageUri && post._mediaType !== "video" && !post.hasVideo;
    const hasVideo = post.hasVideo || post._mediaType === "video";
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [galleryWidth, setGalleryWidth] = useState(0);
    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [showMoreButton, setShowMoreButton] = useState(false);
    const handleTextLayout = useCallback((e) => {
      if (e.nativeEvent.lines.length > 2) {
        setShowMoreButton(true);
      }
    }, []);
    // Stable object identity across re-renders — cachePolicy="none" makes
    // expo-image treat a new `{ uri }` object as a brand-new source and
    // restart loading from scratch.
    const postImageSource = useMemo(() => toImageSource(imageUri), [imageUri]);

    // Measure the first photo's real aspect ratio via a separate, one-shot
    // RN Image.getSize() call BEFORE the visible (cachePolicy="none")
    // expo-image ever mounts with its final layout. Deriving the ratio from
    // the visible Image's own onLoad instead would change its style right
    // after it finishes loading, which with cachePolicy="none" can make it
    // restart the fetch from scratch — and if that reload gets interrupted
    // (e.g. by list scroll/virtualization), the image is left stuck blank.
    // For a gallery post, every slide shares this same box height (matching
    // how Instagram carousels work) rather than re-measuring per slide.
    useEffect(() => {
      if (!imageUri) return undefined;
      let cancelled = false;
      RNImage.getSize(
        imageUri,
        (w, h) => {
          if (!cancelled && w && h) setImgAspectRatio(w / h);
        },
        () => { },
      );
      return () => {
        cancelled = true;
      };
    }, [imageUri]);
    return (
      <View style={styles.postOuter}>
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleAvatarPress}>
              {postAvatarSource ? (
                <ProfileAvatarWithFrame
                  user={post}
                  avatarSource={postAvatarSource}
                  frameSource={postFrameSource}
                  size={42}
                  avatarStyle={styles.postAvatar}
                  imageComponent={Image}
                  {...(isOwnVipFrame
                    ? {
                      frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
                      frameResizeMode:
                        VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                      frameOffsetX: VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                      frameOffsetY: VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                      frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                      avatarBoost: VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
                      avatarOffsetY: VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                    }
                    : {})}
                />
              ) : (
                <View style={[styles.postAvatar, styles.postAvatarPlaceholder]}>
                  <Text
                    style={{ color: "white", fontSize: 16, fontWeight: "700" }}
                  >
                    {(post.name ?? "?")[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.postName}>{post.name ?? "User"}</Text>
            {!isOwnPost && (
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  isFollowing && styles.followBtnActive,
                ]}
                onPress={() => onFollowToggle?.(post.userId)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.followBtnText,
                    isFollowing && styles.followBtnTextActive,
                  ]}
                >
                  {isFollowing ? "✓ Following" : "👤 Follow"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => onMore?.(post)}
            >
              <Text style={styles.moreBtnText}>⋯</Text>
            </TouchableOpacity>
          </View>

          {/* Text / caption */}
          {!!post.text && (
            <View>
              <Text
                style={styles.postText}
                numberOfLines={isTextExpanded ? undefined : 2}
                onTextLayout={handleTextLayout}
              >
                {post.text}
              </Text>
              {showMoreButton && (
                <TouchableOpacity
                  onPress={() => setIsTextExpanded(!isTextExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreText}>
                    {isTextExpanded ? "Less" : "More"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Image — box sized to the image's own aspect ratio, clamped to a
          sane range (Instagram-style: 4:5 portrait .. 1.91:1 landscape) so
          normal photos render edge-to-edge with zero cropping. contentFit
          stays "cover" so a matched ratio never gets letterboxed — only
          outlier shapes (extreme panorama/portrait) get a small edge crop
          instead of a big empty void that can blend into the dark theme. */}
          {hasImage && !imgFailed && !isGallery && (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() =>
                onImagePress?.({
                  post,
                  imageUrls: galleryUrls,
                  startIndex: 0,
                  avatarSource: postAvatarSource,
                  frameSource: postFrameSource,
                  isOwnVipFrame,
                  isOwnPost,
                })
              }
            >
              <Image
                source={postImageSource}
                style={[
                  styles.postImage,
                  imgAspectRatio
                    ? {
                      aspectRatio: clampAspectRatio(imgAspectRatio),
                      height: undefined,
                    }
                    : { height: 220 },
                ]}
                contentFit="cover"
                transition={200}
                cachePolicy="none"
                onError={() => setImgFailed(true)}
              />
            </TouchableOpacity>
          )}

          {/* Multi-photo gallery — same shared-height box (Instagram carousels
          all lock to the first slide's ratio too), swipeable, with a
          "N/M" badge and dot pager. Tapping a slide opens the full-screen
          viewer starting at that exact photo. */}
          {isGallery && !imgFailed && (
            <View
              style={[
                styles.postImage,
                imgAspectRatio
                  ? {
                    aspectRatio: clampAspectRatio(imgAspectRatio),
                    height: undefined,
                  }
                  : { height: 220 },
              ]}
              onLayout={(e) => setGalleryWidth(e.nativeEvent.layout.width)}
            >
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const w = e.nativeEvent.layoutMeasurement.width || 1;
                  setGalleryIndex(
                    Math.round(e.nativeEvent.contentOffset.x / w),
                  );
                }}
                style={StyleSheet.absoluteFill}
              >
                {galleryUrls.map((uri, index) => (
                  <TouchableOpacity
                    key={uri}
                    activeOpacity={0.92}
                    style={[
                      styles.galleryPage,
                      galleryWidth ? { width: galleryWidth } : null,
                    ]}
                    onPress={() =>
                      onImagePress?.({
                        post,
                        imageUrls: galleryUrls,
                        startIndex: index,
                        avatarSource: postAvatarSource,
                        frameSource: postFrameSource,
                        isOwnVipFrame,
                        isOwnPost,
                      })
                    }
                  >
                    <Image
                      source={toImageSource(uri)}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="none"
                      onError={
                        index === 0 ? () => setImgFailed(true) : undefined
                      }
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.galleryCountBadge}>
                <Text style={styles.galleryCountText}>
                  {galleryIndex + 1}/{galleryUrls.length}
                </Text>
              </View>
              <View style={styles.galleryDots}>
                {galleryUrls.map((uri, index) => (
                  <View
                    key={uri}
                    style={[
                      styles.galleryDot,
                      index === galleryIndex && styles.galleryDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Video */}
          {hasVideo && (
            <View style={styles.videoBox}>
              <View style={styles.playBtn}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
              {post.duration && (
                <Text style={styles.videoDuration}>{post.duration}</Text>
              )}
            </View>
          )}

          {/* ── POST FOOTER: Like + Comment ── */}
          <View style={styles.postFooter}>
            <View style={styles.postFooterLeft}>
              {(post.likeCount ?? 0) > 0 && (
                <Text style={styles.postLikeCount}>👍 {post.likeCount}</Text>
              )}
            </View>
            <View style={styles.postFooterRight}>
              <TouchableOpacity
                style={[
                  styles.postActionBtn,
                  isLiked && styles.postActionBtnLiked,
                ]}
                onPress={() => onLikeToggle?.(post.id)}
                activeOpacity={0.75}
              >
                <ThumbsUp
                  size={14}
                  color={isLiked ? "#ff4ea3" : "rgba(0,0,0,0.55)"}
                  fill={isLiked ? "#ff4ea3" : "transparent"}
                />
                <Text
                  style={[
                    styles.postActionLabel,
                    isLiked && { color: "#ff4ea3" },
                  ]}
                >
                  Like
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.postActionBtn}
                onPress={() => onCommentPress?.(post.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.postActionEmoji}>💬</Text>
                <Text style={styles.postActionLabel}>Comment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  },
);
PostCard.displayName = "PostCard";

const RecommendedUserItem = memo(({ user }) => {
  const router = useRouter();
  const recommendVipTier = resolveVipTierFromAssetUrl(user.vipProfileFrameUrl);
  const recommendVipLogo =
    recommendVipTier != null ? VIP_LOGO_BY_TIER[recommendVipTier] : null;
  const isOnline = useUserOnlineOrLiveStatus(
    user,
    isUserLive(user),
    Boolean(user.isOnline ?? user.online)
  );

  return (
    <TouchableOpacity
      style={styles.recommendItem}
      activeOpacity={0.8}
      onPress={() =>
        openUserProfile(router, {
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          vipProfileFrameUrl: user.vipProfileFrameUrl,
        })
      }
    >
      <View style={styles.recommendAvatarWrap}>
        <ProfileAvatarWithFrame
          user={user}
          avatarSource={user.avatar ? toImageSource(user.avatar) : null}
          frameSource={user.vipProfileFrameUrl}
          placeholderInitial={user.name?.[0]?.toUpperCase() ?? "?"}
          size={s(60)}
          isOnline={isOnline}
          isLive={isUserLive(user)}
          avatarStyle={{ borderRadius: s(36) }}
          {...(user.vipProfileFrameUrl
            ? {
              frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
              frameResizeMode: VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
              frameOffsetX: VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
              frameOffsetY: VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
              frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
              avatarBoost: VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
              avatarOffsetY: VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
            }
            : {})}
        />
      </View>
      <View style={styles.recommendNameRow}>
        <Text style={styles.recommendName} numberOfLines={1}>
          {user.name}
        </Text>
        {user.level != null && (
          <Image
            source={resolveLocalLevelBadge(user.level)}
            style={styles.recommendLevelBadge}
            contentFit="contain"
          />
        )}
        {recommendVipLogo && (
          <Image
            source={{ uri: recommendVipLogo }}
            style={styles.recommendVipBadge}
            contentFit="contain"
          />
        )}
      </View>
    </TouchableOpacity>
  );
});
RecommendedUserItem.displayName = "RecommendedUserItem";

// BannerSlider owns its auto-scroll timer — parent never re-renders just for banner ticks
const BannerSlider = memo(({ slides, activeBanner, onBannerChange }) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      onBannerChange((prev) => {
        const next = (prev + 1) % slides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length, onBannerChange]);

  if (slides.length === 0) return null;

  return (
    <View style={styles.bannerWrapper}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / BANNER_SLIDE_WIDTH,
          );
          onBannerChange(index);
        }}
        renderItem={({ item, index }) => (
          <TouchableOpacity activeOpacity={0.9} style={styles.bannerSlide}>
            <Image
              source={
                item.imageUrl
                  ? { uri: item.imageUrl }
                  : BANNER_IMAGES[index % BANNER_IMAGES.length]
              }
              style={styles.bannerImg}
              contentFit="cover"
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.bannerDots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.bannerDot,
              activeBanner === i && styles.bannerDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
});
BannerSlider.displayName = "BannerSlider";

// ─── Static data for new home sections ──────────────────────────────────────
const FEATURE_CARDS_DATA = [
  {
    key: "find-friends",
    title: "Find Friends",
    subtitle: "Meet new people",
    colors: ["#FF4D80", "#FF2A6D", "#E0185D"],
    arrowColor: "#FF2A6D",
    img: require("../../assets/images/icon_find_friends.jpg"),
    route: "/find-friends",
  },
  {
    key: "nearby",
    title: "Nearby",
    subtitle: "People around you",
    colors: ["#00B4D8", "#0096C7", "#0077B6"],
    arrowColor: "#0077B6",
    img: require("../../assets/images/icon_nearby_pin.jpg"),
    isNearby: true,
  },
  {
    key: "blind-pick",
    title: "Blind Pick",
    subtitle: "Mystery match",
    colors: ["#A855F7", "#7C3AED", "#5B21B6"],
    arrowColor: "#7C3AED",
    img: require("../../assets/images/icon_blind_pick.jpg"),
    route: "/blind-pick",
  },
];

const PLAY_ITEMS_DATA = [
  {
    key: "truth-dare",
    title: "Truth &\nDare",
    colors: ["#FE5B74", "#FF7E52", "#FF924E"],
    arrowColor: "#FE5B74",
    img: require("../../assets/images/icon_play_truth_dare.png"),
    label: "Truth & Dare",
    comingSoon: true,
  },
  {
    key: "personality-test",
    title: "Personality\nTest",
    colors: ["#5144FD", "#6B49FD", "#8E41FC"],
    arrowColor: "#7044FD",
    img: require("../../assets/images/icon_play_personality.png"),
    label: "Personality Test",
    route: "/personality-test",
  },
  {
    key: "mini-games",
    title: "Mini\nGames",
    colors: ["#00BF9F", "#00A889", "#008E74"],
    arrowColor: "#008E74",
    img: require("../../assets/images/icon_play_mini_games.png"),
    label: "Mini Games",
    comingSoon: true,
  },
];

const ROOM_FILTER_TABS = ["Trending", "Nearby", "Following"];

const FALLBACK_ROOMS = [
  {
    id: "__f1",
    name: "Good Vibes Only",
    listenerCount: 8200,
    image: require("../../assets/images/room_good_vibes.jpg"),
    region: "Global",
  },
  {
    id: "__f2",
    name: "Music & Chill",
    listenerCount: 6700,
    image: require("../../assets/images/room_music_chill.jpg"),
    region: "Global",
  },
  {
    id: "__f3",
    name: "Gaming Zone",
    listenerCount: 5300,
    image: require("../../assets/images/room_gaming_zone.jpg"),
    region: "Global",
  },
  {
    id: "__f4",
    name: "Let's Talk",
    listenerCount: 4800,
    image: require("../../assets/images/room_lets_talk.jpg"),
    region: "Global",
  },
];

const fmtListeners = (n) => {
  if (n == null) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

// ── Popular Room Card ────────────────────────────────────────────────────────
const PopularRoomCard = memo(({ room, onPress }) => {
  const coverSource =
    room.image ??
    (room.coverImage ? { uri: room.coverImage } : null) ??
    (room.avatarUrl ? { uri: room.avatarUrl } : null) ??
    require("../../assets/images/room_good_vibes.jpg");

  return (
    <TouchableOpacity
      style={styles.roomCard}
      activeOpacity={0.88}
      onPress={() => onPress?.(room)}
    >
      <LinearGradient
        colors={["#F59E0B", "#EC4899", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.roomRing}
      >
        <Image
          source={
            typeof coverSource === "number"
              ? coverSource
              : toImageSource(coverSource?.uri ?? coverSource)
          }
          style={styles.roomCardImg}
          contentFit="cover"
        />
        <View style={styles.roomLiveBadge}>
          <View style={styles.roomLiveDot} />
          <Text style={styles.roomLiveTxt}>Live</Text>
        </View>
      </LinearGradient>
      <Text style={styles.roomCardName} numberOfLines={1}>
        {room.name ?? room.title ?? "Room"}
      </Text>
      <View style={styles.roomCardCountRow}>
        <Text style={{ fontSize: 11 }}>👥</Text>
        <Text style={styles.roomCardCount}>
          {fmtListeners(
            room.listenerCount ?? room.memberCount ?? room.userCount ?? 5000,
          )}
        </Text>
      </View>
      <View style={styles.roomCardRegionRow}>
        <Text style={{ fontSize: 10 }}>🌐</Text>
        <Text style={styles.roomCardRegion}>{room.region ?? "Global"}</Text>
      </View>
    </TouchableOpacity>
  );
});
PopularRoomCard.displayName = "PopularRoomCard";

// All content above the feed — redesigned to match reference UI
const HomeHeader = memo(
  ({
    userProfile,
    walletDiamonds,
    sessionAvatarSource,
    sessionNewUserFrameSource,
    vipProfileFrameSource,
    stats,
    unreadNotifications,
    recommendedUsers,
    popularRooms,
    selectedTab,
    tabScales,
    tabUnderlineScales,
    onTabPress,
    onRoomFilterChange,
    onSearchOpen,
    onNotifOpen,
    onRechargeOpen,
    onNearbyPress,
    onComingSoon,
    router,
  }) => {
    const insets = useSafeAreaInsets();
    const [roomFilter, setRoomFilter] = useState("Trending");
    const displayRooms =
      popularRooms?.length > 0 ? popularRooms : FALLBACK_ROOMS;

    const handleRoomPress = useCallback(
      (room) => {
        router.push({
          pathname: "/voice-party",
          params: { roomId: room.id ?? room.roomId, party: "true" },
        });
      },
      [router],
    );

    const handleFilterSelect = useCallback(
      (f) => {
        setRoomFilter(f);
        onRoomFilterChange?.(f);
      },
      [onRoomFilterChange],
    );

    return (
      <>
        {/* Soft pastel ambient glow at the top matching screenshot */}
        <LinearGradient
          colors={["#EDE4FF", "#FAF5FF", "rgba(255,255,255,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topAmbientGlow}
          pointerEvents="none"
        />

        {/* ── TOP HEADER ROW ── */}
        <View
          style={[
            styles.newHeaderRow,
            { paddingTop: Math.max(insets.top, 10) },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/account")}
            style={styles.headerAvatarWrap}
          >
            <ProfileAvatarWithFrame
              avatarSource={
                sessionAvatarSource ??
                (userProfile?.avatarUrl
                  ? { uri: userProfile.avatarUrl }
                  : null)
              }
              frameSource={vipProfileFrameSource ?? sessionNewUserFrameSource}
              size={s(46)}
              avatarStyle={styles.newHeaderAvatar}
              placeholderInitial={
                (userProfile?.name ?? "S")[0]?.toUpperCase() ?? "S"
              }
              imageComponent={Image}
              {...(vipProfileFrameSource
                ? {
                  frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
                  frameResizeMode:
                    VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                  frameOffsetX: VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                  frameOffsetY: VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                  frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                  avatarBoost: VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
                  avatarOffsetY: VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                }
                : {})}
            />
          </TouchableOpacity>
          <Text style={styles.newAppName}>Tuk Tuk</Text>
          <View style={{ flex: 1 }} />
          {/* Diamond pill */}
          <TouchableOpacity
            style={styles.newDiamondPill}
            onPress={onRechargeOpen}
            activeOpacity={0.85}
          >
            <Image
              source={{
                uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/Diamond.png",
              }}
              style={styles.newDiamondIcon}
              contentFit="contain"
            />
            <Text style={styles.newDiamondCount} numberOfLines={1}>
              {(
                walletDiamonds ??
                userProfile?.diamonds ??
                28951.4
              ).toLocaleString("en-IN")}
            </Text>
            <View style={styles.newDiamondPlusBtn}>
              <Text style={styles.newDiamondPlusText}>+</Text>
            </View>
          </TouchableOpacity>
          {/* Notification bell */}
          <TouchableOpacity
            style={styles.newBellBtn}
            onPress={onNotifOpen}
            activeOpacity={0.8}
          >
            <Bell size={21} color="#1E293B" strokeWidth={2.2} />
            <View style={styles.newBellBadge}>
              <Text style={styles.newBellBadgeText}>
                {unreadNotifications.length > 0
                  ? unreadNotifications.length > 99
                    ? "99+"
                    : unreadNotifications.length
                  : "20"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── ACTIVE NOW JOIN PILL ── */}
        <TouchableOpacity
          style={styles.activeNowPill}
          activeOpacity={0.9}
          onPress={() => router.push("/chat")}
        >
          <LinearGradient
            colors={["#FF1493", "#E01880", "#9333EA", "#7E22CE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeNowGradient}
          >
            <View style={styles.activeNowLeft}>
              <View style={styles.activeNowAvatarWrap}>
                <Image
                  source={toImageSource(
                    stats?.featuredUserAvatar ??
                    "https://randomuser.me/api/portraits/men/45.jpg",
                  )}
                  style={styles.activeNowAvatar}
                  cachePolicy="memory-disk"
                  transition={200}
                />
                <View style={styles.activeNowGreenDot} />
              </View>
              <View style={styles.activeNowWaves}>
                {MATCH_WAVE_HEIGHTS.map((h, i) => (
                  <View
                    key={i}
                    style={[styles.activeNowWaveBar, { height: h }]}
                  />
                ))}
              </View>
              <View style={styles.activeNowTextCol}>
                <Text style={styles.activeNowNumber}>
                  {stats?.activeUsers
                    ? stats.activeUsers > 999
                      ? (stats.activeUsers / 1000).toFixed(0) + "K"
                      : stats.activeUsers
                    : "1"}
                </Text>
                <Text style={styles.activeNowLabel}>Active now 🟢</Text>
              </View>
            </View>
            <View style={styles.joinBtn}>
              <Text style={styles.joinBtnText}>Join</Text>
              <ChevronRight size={14} color="#FF1493" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── VOICE PARTY HERO BANNER ── */}
        <TouchableOpacity
          style={styles.vpBanner}
          activeOpacity={0.92}
          onPress={() =>
            router.push({
              pathname: "/voice-party",
              params: { party: "true" },
            })
          }
        >
          <LinearGradient
            colors={["#240A5E", "#380D77", "#2D106E", "#1E1B4B", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vpBannerGradient}
          >
            {/* Left content */}
            <View style={styles.vpLeft}>
              <View style={styles.vpLiveBadge}>
                <View style={styles.vpLiveDot} />
                <Text style={styles.vpLiveTxt}>Live Now</Text>
              </View>
              <Text style={styles.vpTitle}>Voice Party</Text>
              <Text style={styles.vpSubtitle}>
                Talk • Make Friends • Have Fun
              </Text>
              <TouchableOpacity
                style={styles.vpJoinBtn}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/voice-party",
                    params: { party: "true" },
                  })
                }
              >
                <LinearGradient
                  colors={["#FF2A85", "#FF007A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.vpJoinBtnGrad}
                >
                  <Text style={{ fontSize: 13 }}>🎧</Text>
                  <Text style={styles.vpJoinBtnText}>Join Live</Text>
                  <ChevronRight size={13} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Right illustration */}
            <View style={styles.vpRight} pointerEvents="none">
              <Image
                source={require("../../assets/images/voice_party_hero.jpg")}
                style={styles.vpHeroArt}
                contentFit="cover"
              />
              <LinearGradient
                colors={["#240A5E", "rgba(36, 10, 94, 0.4)", "transparent"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.vpHeroArtFade}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── 3-COLUMN FEATURE CARDS ── */}
        <View style={styles.featureCardsRow}>
          {FEATURE_CARDS_DATA.map((card) => (
            <TouchableOpacity
              key={card.key}
              style={styles.featureCard}
              activeOpacity={0.85}
              onPress={() => {
                if (card.isNearby && onNearbyPress) {
                  onNearbyPress();
                } else if (card.route) {
                  router.push(card.route);
                }
              }}
            >
              <LinearGradient
                colors={card.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureCardGradient}
              >
                <View style={styles.featureCardImgWrap}>
                  <Image
                    source={card.img}
                    style={styles.featureCardImg}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.featureCardBottom}>
                  <View style={styles.featureCardTextCol}>
                    <Text style={styles.featureCardTitle}>{card.title}</Text>
                    <Text style={styles.featureCardSub}>{card.subtitle}</Text>
                  </View>
                  <View style={styles.featureCardArrowWrap}>
                    <ChevronRight size={12} color={card.arrowColor} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PLAY & CONNECT ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("../../assets/images/icon_gamepad_purple.png")}
                style={styles.playHeaderIcon}
                contentFit="contain"
              />
              <Text style={styles.sectionTitle}>Play & Connect</Text>
            </View>
            <TouchableOpacity
              onPress={() => onComingSoon?.("Games")}
              activeOpacity={0.75}
            >
              <Text style={styles.sectionSeeAll}>See All ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.playCardsRow}>
            {PLAY_ITEMS_DATA.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.playCard}
                activeOpacity={0.85}
                onPress={
                  item.route
                    ? () => router.push(item.route)
                    : () => onComingSoon?.(item.label)
                }
              >
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.playCardGradient}
                >
                  <View style={styles.playCardImgWrap}>
                    <Image
                      source={item.img}
                      style={styles.playCardImg}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.playCardContent}>
                    <Text
                      style={styles.playCardTitle}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <View style={styles.playCardArrow}>
                    <ChevronRight size={s(9)} color={item.arrowColor} strokeWidth={3} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── POPULAR ROOMS ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <Text style={styles.sectionTitle}>Popular Rooms</Text>
            </View>
          </View>
          {/* Filter pills row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContent}
            style={styles.filterPillsScroll}
          >
            <TouchableOpacity
              style={styles.filterPillGlobal}
              activeOpacity={0.85}
            >
              <Text style={styles.filterPillGlobalTxt}>🌐 Global ▾</Text>
            </TouchableOpacity>
            {ROOM_FILTER_TABS.map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.filterTabItem}
                activeOpacity={0.75}
                onPress={() => handleFilterSelect(f)}
              >
                <Text
                  style={[
                    styles.filterTabTxt,
                    roomFilter === f && styles.filterTabTxtActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Room cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.roomsScrollContent}
          >
            {displayRooms.map((room, idx) => (
              <PopularRoomCard
                key={room.id ?? idx}
                room={room}
                onPress={handleRoomPress}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── FEED TABS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          style={[styles.tabsBar, { marginTop: 8 }]}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabPress(tab)}
              style={styles.tabItem}
              activeOpacity={1}
            >
              <Animated.Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabActive,
                  { transform: [{ scale: tabScales[tab] }] },
                ]}
              >
                {tab}
              </Animated.Text>
              <Animated.View
                style={[
                  styles.tabUnderline,
                  {
                    transform: [{ scaleX: tabUnderlineScales[tab] }],
                    opacity: tabUnderlineScales[tab],
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </>
    );
  },
);
HomeHeader.displayName = "HomeHeader";

// ─────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { createPost: createPostParam } = useLocalSearchParams();
  const feedListRef = useRef(null);
  useScrollToTop(feedListRef);
  const [selectedTab, setSelectedTab] = useState("For You");
  const [activeBanner, setActiveBanner] = useState(0);

  // ── Data state ────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [stats, setStats] = useState(null);
  const [bannerSlides, setBannerSlides] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [gifts, setGifts] = useState([]);
  const { diamonds: walletDiamonds } = useWalletBalance();
  const [followingIds, setFollowingIds] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);

  // Ref keeps followingIds in sync for stable callbacks (avoids stale closures)
  const followingIdsRef = useRef([]);

  // ── Modal state ───────────────────────────────────────────
  const [searchVisible, setSearchVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [giftsVisible, setGiftsVisible] = useState(false);
  const [moreMenuPost, setMoreMenuPost] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);
  const [imageViewerData, setImageViewerData] = useState(null);
  const [postSheetVisible, setPostSheetVisible] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState([]);
  const likedPostIdsRef = useRef([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchDebounceRef = useRef(null);
  const searchSeqRef = useRef(0);
  const [searchProfile, setSearchProfile] = useState(null);
  const [searchProfileLoading, setSearchProfileLoading] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [sessionAvatarSource, setSessionAvatarSource] = useState(null);
  const [sessionNewUserFrameSource, setSessionNewUserFrameSource] =
    useState(null);
  const [vipProfileFrameSource, setVipProfileFrameSource] = useState(null);
  const [comingSoonFeature, setComingSoonFeature] = useState(null);
  const [diamondRechargeVisible, setDiamondRechargeVisible] = useState(false);
  const [genderPickerVisible, setGenderPickerVisible] = useState(false);
  const [genderSaving, setGenderSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    const shouldOpen = Array.isArray(createPostParam)
      ? createPostParam.includes("1")
      : createPostParam === "1";
    if (!shouldOpen) return;
    setPostSheetVisible(true);
    router.setParams({ createPost: "" });
  }, [createPostParam, router]);

  const syncSessionAvatar = useCallback(async () => {
    try {
      const user = await getUser();
      setSessionAvatarSource(resolveProfileAvatarSource(user));
      const frameSource = await syncNewUserFrameForSession();
      setSessionNewUserFrameSource(frameSource);
    } catch {
      setSessionAvatarSource(null);
      setSessionNewUserFrameSource(null);
    }

    try {
      const vipAssets = await loadMyVipAssets();
      setVipProfileFrameSource(
        vipAssets.unlocked && vipAssets.profileFrame
          ? resolveImageSource(vipAssets.profileFrame)
          : null,
      );
    } catch {
      setVipProfileFrameSource(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncSessionAvatar();
    }, [syncSessionAvatar]),
  );

  // Show gender picker once if user hasn't set their gender yet
  useEffect(() => {
    getUser()
      .then((user) => {
        if (!user?.gender) setGenderPickerVisible(true);
      })
      .catch(() => { });
  }, []);

  // Saves gender + country from the "Who are you?" picker straight to the
  // session user and both profile endpoints, so Account screen reflects it
  // immediately (same fields/shape as the Account screen's own country save).
  const saveGenderSelection = useCallback(
    async (gender) => {
      setGenderSaving(true);
      try {
        const match = selectedCountry
          ? findCountryByName(selectedCountry)
          : null;
        const countryFields = match
          ? {
            country: match.name,
            countryCode: match.code,
            countryName: match.name,
          }
          : {};
        await updateUser({ gender, ...countryFields });
        await updateUserProfile({ gender, ...countryFields }).catch(() => { });
        if (match) {
          await patchMyProfile(countryFields).catch(() => { });
          await syncUserCountryToServer({
            country: match.name,
            countryCode: match.code,
          }).catch(() => { });
        }
      } finally {
        setGenderSaving(false);
        setGenderPickerVisible(false);
        setSelectedCountry("");
      }
    },
    [selectedCountry],
  );

  useFocusEffect(
    useCallback(() => {
      refreshWalletBalance();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      homeService
        .refreshActiveUsersCount()
        .then((activeUsers) => {
          setStats((prev) => ({ ...(prev ?? {}), activeUsers }));
        })
        .catch(() => { });
    }, []),
  );

  const handleNearbyPress = useCallback(async () => {
    const coords = await getDeviceCoordinates();
    if (!coords.ok) {
      if (coords.reason === "module_unavailable") {
        setToastMessage(
          "Location unavailable. Rebuild the app: npx expo run:android",
        );
      } else {
        setToastMessage("Please turn on location on your device");
      }
      setToastVisible(true);
      return;
    }
    router.push("/nearby");
  }, [router]);

  // Tab animation values — stable Animated refs, never recreated
  const tabScales = useRef(
    TABS.reduce((acc, t) => {
      acc[t] = new Animated.Value(1);
      return acc;
    }, {}),
  ).current;
  const tabUnderlineScales = useRef(
    TABS.reduce((acc, t) => {
      acc[t] = new Animated.Value(t === "For You" ? 1 : 0);
      return acc;
    }, {}),
  ).current;

  // Ref for selectedTab — avoids stale closure in handleTabPress without adding it to deps
  const selectedTabRef = useRef(selectedTab);
  selectedTabRef.current = selectedTab;

  // Ref for currentUserId — lets the tab feed loader stay a stable callback
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  // ── Data loading ──────────────────────────────────────────
  // Deferred until after navigation animations finish so the first
  // paint is never blocked by data fetching
  useEffect(() => {
    getAppUserId()
      .then((id) => setCurrentUserId(String(id)))
      .catch(() => { });

    syncSessionAvatar();

    const task = InteractionManager.runAfterInteractions(() => {
      homeService
        .getHomeData()
        .then(async (data) => {
          let sessionUserId = currentUserId;
          try {
            sessionUserId = String(await getAppUserId());
            setCurrentUserId(sessionUserId);
          } catch {
            const profileId =
              data.userProfile?.userId ?? data.userProfile?.id ?? null;
            if (profileId) {
              sessionUserId = String(profileId);
              setCurrentUserId(sessionUserId);
            }
          }

          setUserProfile(data.userProfile);
          setStats(data.stats);
          setBannerSlides(data.bannerSlides);
          setRecommendedUsers(data.recommendedUsers);
          setFeedPosts(
            dedupePostsById(
              (data.feedPosts ?? []).map((post) => ({
                ...post,
                _isOwn: sessionUserId
                  ? isOwnContent(post, sessionUserId)
                  : false,
              })),
            ),
          );
          setFeedHasMore(data.feedHasMore ?? false);
          setNotifications(data.notifications);
          setGifts(data.gifts);
          applyWalletFromSources({
            walletData: data.wallet,
            userProfile: data.userProfile,
          });
          setSearchSuggestions(data.searchSuggestions);
          setTrendingTags(data.trendingTags);
          // Use server unreadCount when available, fall back to local filter
          if (data.unreadCount > 0) {
            setUnreadNotifications(
              (data.notifications ?? [])
                .filter((n) => n.unread)
                .map((n) => n.id),
            );
          } else {
            setUnreadNotifications([]);
          }
        })
        .catch(() => { });

      // Load following + followers in parallel after home data
      Promise.all([loadFollowing(), loadFollowers()]).then(([followingArr]) => {
        const ids = followingArr.map((u) => u.userId ?? u.id).filter(Boolean);
        followingIdsRef.current = ids;
        setFollowingIds(ids);
        setFollowingList(followingArr);
      });
    });
    return () => task.cancel();
  }, []);

  // Load popular rooms independently after interactions
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      getRoomRecommendations()
        .then((data) => {
          const rooms = Array.isArray(data) ? data : (data?.content ?? data?.rooms ?? []);
          if (rooms.length > 0) setPopularRooms(rooms);
        })
        .catch(() => { /* fallback rooms shown */ });
    });
    return () => task.cancel();
  }, []);

  useFocusEffect(
    useCallback(() => {
      wsService.connect().catch(() => { });
    }, [])
  );

  // Real-time presence updates for recommended users & active users count
  useEffect(() => {
    const unsub = wsService.onPresence((event) => {
      if (!event || event.userId == null) return;
      const targetId = String(event.userId);
      const isOnline = Boolean(event.isOnline ?? event.online);

      console.log(`[Home Presence] Event received:`, {
        event,
        userId: targetId,
        isOnline,
        activeUsers: event.activeUsers ?? stats?.activeUsers,
      });

      setRecommendedUsers((prev) =>
        prev.map((user) => {
          const uid = String(user?.id ?? user?.userId ?? "");
          if (uid === targetId) {
            return {
              ...user,
              isOnline,
              online: isOnline,
              status: isOnline ? "ONLINE" : "OFFLINE",
            };
          }
          return user;
        })
      );

      if (event.activeUsers != null) {
        setStats((prev) =>
          prev ? { ...prev, activeUsers: event.activeUsers } : prev
        );
      }
    });
    return unsub;
  }, []);

  // Listen for deleted posts across app (e.g. Profile Moments) and remove from feed
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("postDeleted", ({ postId }) => {
      if (!postId) return;
      setFeedPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));
    });
    return () => sub.remove();
  }, []);

  // Listen for created posts across app (e.g. Profile Moments) and prepend to feed immediately
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("postCreated", ({ post }) => {
      if (!post?.id) return;
      const normalized = homeService.normalizePost(post);
      const withOwnership = {
        ...normalized,
        _isOwn: true,
      };
      setFeedPosts((prev) => {
        if (prev.some((p) => String(p.id) === String(post.id))) return prev;
        return [withOwnership, ...prev];
      });
      // Background sync feed with backend
      homeService
        .refreshFeed(selectedTabRef.current)
        .then((fresh) => {
          let sessionUserId = currentUserIdRef.current;
          setFeedPosts(
            (fresh.posts ?? []).map((p) => ({
              ...p,
              _isOwn: sessionUserId ? isOwnContent(p, sessionUserId) : false,
            }))
          );
        })
        .catch(() => {});
    });
    return () => sub.remove();
  }, []);

  // ── Stable callbacks ──────────────────────────────────────

  // Loads the feed for a given tab (For You / Online / Following / New).
  // homeService.refreshFeed maps the tab label to the API param, so this is
  // ready to work as soon as the backend returns data per tab.
  const loadTabFeed = useCallback(async (tab) => {
    setFeedLoading(true);
    setFeedPosts([]);
    setFeedPage(1);
    setFeedHasMore(false);

    try {
      const res = await homeService.refreshFeed(tab);
      const uid = currentUserIdRef.current;
      setFeedPosts(
        dedupePostsById(
          (res.posts ?? []).map((post) => ({
            ...post,
            _isOwn: uid ? isOwnContent(post, uid) : false,
          })),
        ),
      );
      setFeedHasMore(res.hasMore ?? false);
    } catch {
      setFeedPosts([]);
      setFeedHasMore(false);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const handleTabPress = useCallback(
    (tab) => {
      const prev = selectedTabRef.current;
      if (tab === prev) return;
      Animated.timing(tabUnderlineScales[prev], {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      Animated.sequence([
        Animated.timing(tabScales[tab], {
          toValue: 0.82,
          duration: 80,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(tabScales[tab], {
          toValue: 1,
          tension: 260,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
      Animated.timing(tabUnderlineScales[tab], {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }).start();
      setSelectedTab(tab);
      loadTabFeed(tab);
    },
    [tabScales, tabUnderlineScales, loadTabFeed],
  );

  const handleMarkAllRead = useCallback(async () => {
    // Optimistic clear; restore previous state if the request fails.
    const prevUnread = unreadNotifications;
    const prevCount = unreadCount;
    setUnreadNotifications([]);
    setUnreadCount(0);
    try {
      // POST /api/notifications/mark-read  { "notificationIds": "all" }
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("[notifications] markAllRead failed:", error);
      setUnreadNotifications(prevUnread);
      setUnreadCount(prevCount);
    }
  }, [unreadNotifications, unreadCount]);

  const handleSearchQuery = useCallback(
    (text) => {
      setSearchQuery(text);
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        setSearchResults([]);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchSeqRef.current += 1; // cancel any in-flight people search
        return;
      }
      const query = text.toLowerCase();
      const results = [];
      actionCards.forEach((card) => {
        if (
          card.title.toLowerCase().includes(query) ||
          card.subtitle.toLowerCase().includes(query)
        ) {
          results.push({
            id: card.title,
            title: card.title,
            subtitle: card.subtitle,
            type: "action",
            route: card.route,
            partyRandom: card.partyRandom,
            colors: card.colors,
          });
        }
      });
      iconItems.forEach((item) => {
        if (item.label.toLowerCase().includes(query)) {
          results.push({
            id: item.label,
            title: item.label,
            type: "icon",
            colors: item.colors,
          });
        }
      });
      searchSuggestions.forEach((suggestion) => {
        if (
          suggestion.toLowerCase().includes(query) &&
          !results.some((r) => r.title === suggestion)
        ) {
          results.push({
            id: suggestion,
            title: suggestion,
            type: "suggestion",
          });
        }
      });
      setSearchResults(results);

      // Debounced people search against the backend.
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      const seq = ++searchSeqRef.current;
      searchDebounceRef.current = setTimeout(async () => {
        try {
          const people = await homeService.searchPeople(trimmed);
          if (seq !== searchSeqRef.current) return; // a newer query superseded this
          const userResults = people
            .filter((u) => u.userId ?? u.id)
            .map((u) => ({
              id: `user-${u.userId ?? u.id}`,
              userId: String(u.userId ?? u.id),
              title: u.name ?? "User",
              subtitle: u.isOnline ? "🟢 Online" : "Tap to view profile",
              type: "user",
              avatar: u.avatar ?? null,
              level: u.level ?? null,
              vip: Boolean(u.vip),
              status: u.status ?? null,
              vipProfileFrameUrl:
                u.vipProfileFrameUrl ?? extractVipProfileFrameUrl(u),
              colors: ["#3d1a6e", "#5b2d8e"],
            }));
          // Keep feature matches, replace any previous user rows.
          setSearchResults((prev) => [
            ...prev.filter((r) => r.type !== "user"),
            ...userResults,
          ]);
        } catch {
          // Ignore — keep existing search results.
        }
      }, 350);
    },
    [searchSuggestions],
  );

  const handleOpenSearchUser = useCallback(async (result) => {
    // Show the profile immediately with the data we already have, then
    // enrich it with the full GET /api/app/users/{userId} response.
    setSearchProfile({
      userId: result.userId,
      name: result.title,
      avatar: result.avatar,
      level: result.level,
      vip: result.vip,
      status: result.status,
      vipProfileFrameUrl: result.vipProfileFrameUrl ?? null,
      isOnline: Boolean(result.subtitle && result.subtitle.includes("Online")),
    });
    setSearchProfileLoading(true);
    // A single opened profile (not a list), so one fetchUserDecorations call
    // here is fine — same reasoning UserProfileView uses for its badge row.
    fetchUserDecorations(result.userId)
      .then(({ badgeUrl }) => {
        setSearchProfile((prev) =>
          prev?.userId === result.userId
            ? { ...prev, decorationBadgeUrl: badgeUrl }
            : prev,
        );
      })
      .catch(() => { });
    try {
      const detail = await homeService.getUserDetailById(result.userId);
      setSearchProfile((prev) => ({
        ...prev,
        ...detail,
        userId: result.userId,
        name: detail?.name ?? prev?.name,
        avatar: detail?.avatar ?? prev?.avatar,
      }));
    } catch {
      // Keep the room-state fallback profile if the detail fetch fails.
    } finally {
      setSearchProfileLoading(false);
    }
  }, []);

  const handleMessageSearchProfile = useCallback(async () => {
    const profile = searchProfile;
    if (!profile?.userId) return;
    setSearchProfile(null);
    closeSearch();
    setSearchResults([]);
    await openUserChat(router, {
      userId: profile.userId,
      id: profile.userId,
      name: profile.name,
      avatarUrl: profile.avatar,
      profilePicUrl: profile.avatar,
    });
  }, [searchProfile, router]);

  const handleLoadMore = useCallback(async () => {
    if (!feedHasMore || feedLoading) return;
    setFeedLoading(true);
    const nextPage = feedPage + 1;
    try {
      const more = await homeService.loadMoreFeed(selectedTab, nextPage);
      setFeedPosts((prev) =>
        dedupePostsById([
          ...prev,
          ...(more.posts ?? []).map((post) => ({
            ...post,
            _isOwn: currentUserId ? isOwnContent(post, currentUserId) : false,
          })),
        ]),
      );
      setFeedHasMore(more.hasMore ?? false);
      setFeedPage(nextPage);
    } catch {
      // Keep the current feed page if loading more fails.
    } finally {
      setFeedLoading(false);
    }
  }, [feedHasMore, feedLoading, feedPage, selectedTab, currentUserId]);

  const handleMorePress = useCallback((post) => setMoreMenuPost(post), []);
  const handleMoreClose = useCallback(() => setMoreMenuPost(null), []);

  // Follow / Unfollow — optimistic toggle backed by ref so callback is stable
  const handleFollowToggle = useCallback(
    async (userId) => {
      if (!userId) return;
      if (isSameUser(userId, currentUserId)) return;

      const targetId = String(userId);
      const wasFollowing = followingIdsRef.current.some((id) =>
        isSameUser(id, targetId),
      );

      const updated = wasFollowing
        ? followingIdsRef.current.filter((id) => !isSameUser(id, targetId))
        : [...followingIdsRef.current, targetId];
      followingIdsRef.current = updated;
      setFollowingIds([...updated]);

      try {
        if (wasFollowing) {
          await unfollowUser(targetId);
        } else {
          await followUser(targetId);
        }
      } catch (e) {
        const msg = e?.message?.toLowerCase() ?? "";

        // "not following" on unfollow → backend agrees, keep UI as not-following (already reverted)
        if (wasFollowing && msg.includes("not following")) return;

        // "already following" on follow → backend agrees, keep UI as following (already set)
        if (!wasFollowing && msg.includes("already following")) return;

        // Any other error → revert optimistic UI
        const reverted = wasFollowing
          ? [...followingIdsRef.current, targetId]
          : followingIdsRef.current.filter((id) => !isSameUser(id, targetId));
        followingIdsRef.current = reverted;
        setFollowingIds([...reverted]);
      }
    },
    [currentUserId],
  );

  // Like / Dislike — optimistic toggle
  const handleLikeToggle = useCallback(async (postId) => {
    if (!postId) return;
    const wasLiked = likedPostIdsRef.current.includes(postId);
    const updated = wasLiked
      ? likedPostIdsRef.current.filter((id) => id !== postId)
      : [...likedPostIdsRef.current, postId];
    likedPostIdsRef.current = updated;
    setLikedPostIds([...updated]);
    // Optimistic count update
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likeCount: (p.likeCount ?? 0) + (wasLiked ? -1 : 1) }
          : p,
      ),
    );
    try {
      if (wasLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch {
      // Revert on failure
      const reverted = wasLiked
        ? [...likedPostIdsRef.current, postId]
        : likedPostIdsRef.current.filter((id) => id !== postId);
      likedPostIdsRef.current = reverted;
      setLikedPostIds([...reverted]);
      setFeedPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likeCount: (p.likeCount ?? 0) + (wasLiked ? 1 : -1) }
            : p,
        ),
      );
    }
  }, []);

  const handleCommentPress = useCallback((postId) => {
    setCommentPostId(postId);
  }, []);

  const handleOpenImageViewer = useCallback((payload) => {
    setImageViewerData(payload);
  }, []);
  const handleCloseImageViewer = useCallback(
    () => setImageViewerData(null),
    [],
  );
  const handleImageViewerAvatarPress = useCallback(() => {
    const post = imageViewerData?.post;
    if (!post) return;
    setImageViewerData(null);
    openUserProfile(router, {
      userId: post.userId,
      name: post.name,
      avatar: post.avatar,
    });
  }, [imageViewerData, router]);

  const handlePostSubmit = useCallback(
    async ({ caption, photos, video, mediaType }) => {
      // Helper — calls GET /api/home/feed?tab=for_you&page=1&limit=10 and resets the feed
      const refreshFeed = async () => {
        const fresh = await homeService.refreshFeed(selectedTabRef.current);
        let sessionUserId = currentUserId;
        try {
          sessionUserId = String(await getAppUserId());
        } catch {
          // keep existing currentUserId
        }
        setFeedPosts(
          (fresh.posts ?? []).map((post) => ({
            ...post,
            _isOwn: sessionUserId ? isOwnContent(post, sessionUserId) : false,
          })),
        );
        setFeedHasMore(fresh.hasMore ?? false);
        setFeedPage(1);
      };

      const localImageUris = (photos ?? []).map((p) => p.uri).filter(Boolean);
      const mediaUri = video?.uri ?? localImageUris[0] ?? null;

      let newPost = null;
      try {
        newPost = await createPost({ caption, photos, video, mediaType });
      } catch (e) {
        await refreshFeed().catch(() => { });
        throw e;
      }

      // Normalize backend response so the optimistic item matches our feed shape
      let sessionUserId = currentUserId;
      try {
        sessionUserId = String(await getAppUserId());
      } catch {
        // keep existing currentUserId
      }

      // Backend may return one URL (imageUrl) or several (imageUrls/mediaUrls) —
      // fall back to the locally-picked URIs so the post shows instantly even
      // before the feed refresh brings back the real CDN URLs.
      const returnedImageUrls = Array.isArray(newPost?.imageUrls)
        ? newPost.imageUrls
        : Array.isArray(newPost?.mediaUrls)
          ? newPost.mediaUrls
          : null;
      const imageUrls =
        mediaType === "video"
          ? []
          : returnedImageUrls?.length
            ? returnedImageUrls
            : localImageUris;

      const normalized = {
        id: newPost?.id ?? newPost?.postId ?? `local-${Date.now()}`,
        userId: newPost?.userId ?? newPost?.authorId ?? sessionUserId ?? null,
        name:
          newPost?.name ?? newPost?.username ?? newPost?.authorName ?? "You",
        avatar:
          newPost?.avatar ??
          newPost?.profileImage ??
          newPost?.authorAvatar ??
          null,
        text:
          newPost?.text ??
          newPost?.caption ??
          newPost?.content ??
          caption ??
          "",
        imageUrl:
          newPost?.imageUrl ??
          newPost?.mediaUrl ??
          newPost?.image ??
          imageUrls[0] ??
          null,
        imageUrls,
        hasVideo: mediaType === "video",
        duration: newPost?.duration ?? null,
        likeCount: newPost?.likeCount ?? newPost?.likes ?? 0,
        _localMediaUri: mediaUri,
        _mediaType: mediaType ?? null,
        _isOwn: true,
      };

      // Optimistically prepend so the post appears instantly while the refresh is in-flight
      setFeedPosts((prev) => [normalized, ...prev]);

      // Broadcast so profile moments (and other screens) get the new post instantly
      DeviceEventEmitter.emit("postCreated", { post: normalized, rawPost: newPost });

      // Refresh GET /api/home/feed?tab=for_you&page=1&limit=10 — new post will be on top
      await refreshFeed().catch(() => { });
    },
    [currentUserId],
  );

  // Block — removes user's posts from feed immediately
  const handleBlockUser = useCallback(
    async (userId, userName) => {
      if (!userId) return;
      if (isSameUser(userId, currentUserId)) return;

      try {
        await blockUser(userId);

        setFeedPosts((prev) => prev.filter((p) => p.userId !== userId));
      } catch (e) {
        Alert.alert("Block failed", e?.message || "Please try again.");
      }
    },
    [currentUserId],
  );

  const handleReportSubmit = useCallback(
    async (reason) => {
      if (!reportTarget?.userId) return;
      try {
        await reportUser(reportTarget.userId, reason);
        setReportTarget(null);
        setToastMessage("Report submitted. Thank you for letting us know.");
        setToastVisible(true);
      } catch (e) {
        throw new Error(
          e?.message || "Could not submit report. Please try again.",
        );
      }
    },
    [reportTarget],
  );

  const handleDeletePost = useCallback(async (postId) => {
    if (!postId) return;
    // Optimistically remove from feed immediately
    setFeedPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));
    setMoreMenuPost(null);
    DeviceEventEmitter.emit("postDeleted", { postId: String(postId) });
    try {
      await deletePost(postId);
    } catch {
      // If delete fails, we could re-fetch but for now the optimistic removal stays
    }
  }, []);

  const openSearch = useCallback(() => setSearchVisible(true), []);
  const openNotif = useCallback(async () => {
    setNotifVisible(true);
    setNotificationsLoading(true);
    setNotificationsError(false);
    try {
      const { content, unreadCount: count } = await fetchNotificationsData({
        page: 0,
        size: 30,
      });
      if (Array.isArray(content)) {
        setNotifications(content);
        const unreadIds = content
          .filter(
            (n) => n.unread === true || n.read === false || n.isRead === false,
          )
          .map((n) => n.id);
        setUnreadNotifications(unreadIds);
      }
      if (typeof count === "number") {
        setUnreadCount(count);
      }
    } catch (err) {
      console.warn(
        "[home] Failed to load notifications on open:",
        err?.message,
      );
      setNotificationsError(true);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const handleNotificationPress = useCallback(
    async (notif) => {
      if (!notif) return;

      if (unreadNotifications.includes(notif.id)) {
        setUnreadNotifications((prev) => prev.filter((id) => id !== notif.id));
        setUnreadCount((prev) => Math.max(0, prev - 1));
        markNotificationsAsRead([notif.id]).catch(() => { });
      }

      setNotifVisible(false);

      setTimeout(async () => {
        try {
          const success = await navigateFromNotification(router, notif);
        } catch (navErr) {
          console.error("[home] Navigation error on notification tap:", navErr);
        }
      }, 150);
    },
    [unreadNotifications, router],
  );

  const openGifts = useCallback(() => setGiftsVisible(true), []);
  const closeSearch = useCallback(() => {
    setSearchVisible(false);
    setSearchQuery("");
  }, []);
  const closeNotif = useCallback(() => setNotifVisible(false), []);
  const closeGifts = useCallback(() => setGiftsVisible(false), []);
  const handleBannerChange = useCallback((idx) => setActiveBanner(idx), []);

  const handleRoomFilterChange = useCallback(async (filter) => {
    try {
      if (filter === "Following") {
        const data = await getFollowingRooms();
        const rooms = Array.isArray(data) ? data : (data?.content ?? data?.rooms ?? []);
        if (rooms.length > 0) setPopularRooms(rooms);
      } else if (filter === "Nearby") {
        const data = await getRecentlyRooms();
        const rooms = Array.isArray(data) ? data : (data?.content ?? data?.rooms ?? []);
        if (rooms.length > 0) setPopularRooms(rooms);
      } else {
        const data = await getRoomRecommendations();
        const rooms = Array.isArray(data) ? data : (data?.content ?? data?.rooms ?? []);
        if (rooms.length > 0) setPopularRooms(rooms);
      }
    } catch {
      // keep fallback
    }
  }, []);

  // ── Feed data ─────────────────────────────────────────────
  // Flatten feed posts + a banner slot at position 5 into one
  // array so the outer FlatList can virtualize all items at once
  const feedData = useMemo(() => {
    if (feedPosts.length === 0) return [];
    return [
      ...feedPosts.slice(0, 5).map((p) => ({ ...p, _type: "post" })),
      { id: "__banner__", _type: "banner" },
      ...feedPosts.slice(5).map((p) => ({ ...p, _type: "post" })),
    ];
  }, [feedPosts]);

  const renderFeedItem = useCallback(
    ({ item }) => {
      if (item._type === "banner") {
        return (
          <BannerSlider
            slides={bannerSlides}
            activeBanner={activeBanner}
            onBannerChange={handleBannerChange}
          />
        );
      }
      return (
        <PostCard
          post={item}
          onMore={handleMorePress}
          isFollowing={followingIds.some((id) => isSameUser(id, item.userId))}
          onFollowToggle={handleFollowToggle}
          isLiked={likedPostIds.includes(item.id)}
          onLikeToggle={handleLikeToggle}
          onCommentPress={handleCommentPress}
          onImagePress={handleOpenImageViewer}
          currentUserId={currentUserId}
          currentUserAvatarSource={sessionAvatarSource}
          currentUserFrameSource={sessionNewUserFrameSource}
          currentUserVipFrameSource={vipProfileFrameSource}
        />
      );
    },
    [
      bannerSlides,
      activeBanner,
      handleBannerChange,
      handleMorePress,
      followingIds,
      handleFollowToggle,
      likedPostIds,
      handleLikeToggle,
      handleCommentPress,
      handleOpenImageViewer,
      currentUserId,
      sessionAvatarSource,
      sessionNewUserFrameSource,
      vipProfileFrameSource,
    ],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  // Per-tab loading / empty UI shown when the feed has no items.
  const listEmpty = useMemo(() => {
    if (feedLoading) {
      return (
        <View style={styles.feedStateBox}>
          <ActivityIndicator color="#7c4dff" size="large" />
          <Text style={styles.feedStateTitle}>Loading {selectedTab}…</Text>
        </View>
      );
    }
    const copy = TAB_EMPTY_COPY[selectedTab] ?? TAB_EMPTY_COPY["For You"];
    return (
      <View style={styles.feedStateBox}>
        <Text style={styles.feedStateEmoji}>{copy.emoji}</Text>
        <Text style={styles.feedStateTitle}>{copy.title}</Text>
        <Text style={styles.feedStateSubtitle}>{copy.subtitle}</Text>
      </View>
    );
  }, [feedLoading, selectedTab]);

  // ListHeaderComponent memoized — only re-creates when its specific
  // props change, not on every unrelated state update
  const listHeader = useMemo(
    () => (
      <HomeHeader
        userProfile={userProfile}
        walletDiamonds={walletDiamonds}
        sessionAvatarSource={sessionAvatarSource}
        sessionNewUserFrameSource={sessionNewUserFrameSource}
        vipProfileFrameSource={vipProfileFrameSource}
        stats={stats}
        unreadNotifications={unreadNotifications}
        recommendedUsers={recommendedUsers}
        popularRooms={popularRooms}
        selectedTab={selectedTab}
        tabScales={tabScales}
        tabUnderlineScales={tabUnderlineScales}
        onTabPress={handleTabPress}
        onRoomFilterChange={handleRoomFilterChange}
        onSearchOpen={openSearch}
        onNotifOpen={openNotif}
        onRechargeOpen={() => setDiamondRechargeVisible(true)}
        onNearbyPress={handleNearbyPress}
        onComingSoon={setComingSoonFeature}
        router={router}
      />
    ),
    [
      userProfile,
      walletDiamonds,
      sessionAvatarSource,
      sessionNewUserFrameSource,
      vipProfileFrameSource,
      stats,
      unreadNotifications,
      recommendedUsers,
      popularRooms,
      selectedTab,
      handleTabPress,
      handleRoomFilterChange,
      openSearch,
      openNotif,
      handleNearbyPress,
      router,
    ],
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <AppBackground />

      {/* Outer FlatList gives true virtualization to the feed —
          only posts near the viewport are kept in memory */}
      <FlatList
        ref={feedListRef}
        data={feedData}
        renderItem={renderFeedItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        removeClippedSubviews={Platform.OS === "android"}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={4}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          feedLoading ? (
            <ActivityIndicator color="#7c4dff" style={{ marginVertical: 16 }} />
          ) : null
        }
      />

      {/* ── SEARCH MODAL ── */}
      <Modal
        visible={searchVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSearch}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeSearch}
          />
          {searchVisible && (
            <View style={styles.searchPanel}>
              <LinearGradient
                colors={["#1e0a3c", "#2d1b4e"]}
                style={StyleSheet.absoluteFill}
                borderRadius={24}
              />
              <View style={styles.searchHeader}>
                <Text style={styles.searchPanelTitle}>Search</Text>
                <TouchableOpacity
                  onPress={closeSearch}
                  style={styles.searchCloseBtn}
                >
                  <Text style={styles.searchCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.searchInputRow}>
                <Text style={styles.searchInputIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search people, parties, games…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={searchQuery}
                  onChangeText={handleSearchQuery}
                  autoFocus
                  selectionColor="#7c4dff"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    <Text style={styles.searchClearBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {searchResults.length > 0 ? (
                <View style={styles.searchResultsSection}>
                  <Text style={styles.searchSuggestLabel}>Search Results</Text>
                  {searchResults.map((result) => {
                    const resultVipTier =
                      result.type === "user"
                        ? resolveVipTierFromAssetUrl(result.vipProfileFrameUrl)
                        : null;
                    const resultVipLogo =
                      resultVipTier != null
                        ? VIP_LOGO_BY_TIER[resultVipTier]
                        : null;
                    return (
                      <TouchableOpacity
                        key={result.id}
                        style={styles.searchResultItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (result.type === "user") {
                            handleOpenSearchUser(result);
                          } else if (result.partyRandom) {
                            router.push({
                              pathname: "/voice-party",
                              params: { party: "true" },
                            });
                            closeSearch();
                            setSearchResults([]);
                          } else if (result.route) {
                            router.push(result.route);
                            closeSearch();
                            setSearchResults([]);
                          }
                        }}
                      >
                        {result.type === "user" && result.avatar ? (
                          <ProfileAvatarWithFrame
                            user={result}
                            avatarSource={toImageSource(result.avatar)}
                            frameSource={result.vipProfileFrameUrl}
                            size={44}
                            avatarStyle={styles.resultIconBox}
                            {...(result.vipProfileFrameUrl
                              ? {
                                frameScale:
                                  VIP_PROFILE_FRAME_LAYOUT.frameScale,
                                frameResizeMode:
                                  VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                                frameOffsetX:
                                  VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                                frameOffsetY:
                                  VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                                frameBleed:
                                  VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                                avatarBoost:
                                  VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
                                avatarOffsetY:
                                  VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                              }
                              : {})}
                          />
                        ) : (
                          <LinearGradient
                            colors={result.colors || ["#3d1a6e", "#5b2d8e"]}
                            style={styles.resultIconBox}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <Text style={styles.resultIcon}>
                              {result.type === "action"
                                ? "🎮"
                                : result.type === "user"
                                  ? "👤"
                                  : "✨"}
                            </Text>
                          </LinearGradient>
                        )}
                        <View style={styles.resultTextCol}>
                          <View style={styles.resultTitleRow}>
                            <Text style={styles.resultTitle}>
                              {result.title}
                            </Text>
                            {result.type === "user" && result.level != null && (
                              <Image
                                source={resolveLocalLevelBadge(result.level)}
                                style={styles.resultLevelBadge}
                                contentFit="contain"
                              />
                            )}
                            {resultVipLogo && (
                              <Image
                                source={{ uri: resultVipLogo }}
                                style={styles.resultVipBadge}
                                contentFit="contain"
                              />
                            )}
                            {/* Decoration badge intentionally skipped here: search
                              results can be a long, unbounded list, so firing
                              fetchUserDecorations per row would risk an N+1
                              request storm. */}
                          </View>
                          {result.subtitle && (
                            <Text style={styles.resultSubtitle}>
                              {result.subtitle}
                            </Text>
                          )}
                        </View>
                        <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : searchQuery.length === 0 ? (
                <>
                  <View style={styles.searchSuggestSection}>
                    <Text style={styles.searchSuggestLabel}>Quick explore</Text>
                    <View style={styles.searchSuggestRow}>
                      {searchSuggestions.map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={styles.searchChip}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={["#3d1a6e", "#5b2d8e"]}
                            style={styles.searchChipGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <Text style={styles.searchChipText}>{s}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.searchSuggestSection}>
                    <Text style={styles.searchSuggestLabel}>
                      Trending now 🔥
                    </Text>
                    {trendingTags.map((tag) => (
                      <View key={tag} style={styles.trendingRow}>
                        <View style={styles.trendingDot} />
                        <Text style={styles.trendingTag}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsEmoji}>🔍</Text>
                  <Text style={styles.noResultsText}>No results found</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try searching for features like Voice Party, Games, or
                    People
                  </Text>
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* ── GIFT MODAL — content lazy-mounted ── */}
      <Modal
        visible={giftsVisible}
        transparent
        animationType="slide"
        onRequestClose={closeGifts}
      >
        <View style={styles.giftsOverlay}>
          <TouchableOpacity
            style={styles.giftBackdrop}
            activeOpacity={1}
            onPress={closeGifts}
          />
          {giftsVisible && (
            <SafeAreaView style={styles.giftsPanel}>
              <LinearGradient
                colors={["#1a0a2e", "#16082a", "#0d0618"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.giftsHeader}>
                <Text style={styles.giftsTitle}>Daily Gifts</Text>
                <TouchableOpacity
                  onPress={closeGifts}
                  style={styles.giftCloseBtn}
                >
                  <Text style={styles.giftCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.freeGiftBanner}>
                <LinearGradient
                  colors={["#ffb700", "#ff9500"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.freeGiftGradient}
                >
                  <View style={styles.freeGiftContent}>
                    <Text style={styles.freeGiftEmoji}>🎉</Text>
                    <View style={styles.freeGiftText}>
                      <Text style={styles.freeGiftTitle}>Free Gift Daily!</Text>
                      <Text style={styles.freeGiftSubtitle}>
                        Claim one free gift every 24 hours
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.giftsScrollContent}
              >
                <View style={styles.giftsGrid}>
                  {gifts.map((gift) => (
                    <TouchableOpacity
                      key={gift.id}
                      style={styles.giftCard}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={gift.colors}
                        style={styles.giftCardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                        <Text style={styles.giftName}>{gift.name}</Text>
                        <Text style={styles.giftValue}>+{gift.value}</Text>
                        <Text style={styles.giftDescription}>
                          {gift.description}
                        </Text>
                        {gift.isFree && (
                          <View style={styles.freeTag}>
                            <Text style={styles.freeTagText}>FREE</Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </SafeAreaView>
          )}
        </View>
      </Modal>

      {/* ── NOTIFICATION MODAL — content lazy-mounted ── */}
      <Modal
        visible={notifVisible}
        transparent
        animationType="slide"
        onRequestClose={closeNotif}
      >
        <View style={styles.notifOverlay}>
          <TouchableOpacity
            style={styles.notifBackdrop}
            activeOpacity={1}
            onPress={closeNotif}
          />
          {notifVisible && (
            <SafeAreaView style={styles.notifPanel}>
              <LinearGradient
                colors={["#1a0a2e", "#16082a", "#0d0618"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>Notifications</Text>
                <View style={styles.notifHeaderRight}>
                  <TouchableOpacity
                    style={styles.notifMarkAll}
                    onPress={handleMarkAllRead}
                  >
                    <Text style={styles.notifMarkAllText}>Mark all read</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeNotif}
                    style={styles.notifCloseBtn}
                  >
                    <Text style={styles.notifCloseTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <LinearGradient
                colors={["transparent", "#7c4dff", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.notifDivider}
              />
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
              >
                {notificationsLoading ? (
                  <View style={styles.notifStateBox}>
                    <ActivityIndicator size="small" color="#7c4dff" />
                    <Text style={styles.notifStateText}>
                      Loading notifications...
                    </Text>
                  </View>
                ) : notifications.length === 0 ? (
                  <View style={styles.notifStateBox}>
                    <Text style={styles.notifStateEmoji}>🔔</Text>
                    <Text style={styles.notifStateText}>
                      No notifications yet
                    </Text>
                  </View>
                ) : (
                  notifications.map((notif) => {
                    const avatarUri =
                      notif.avatar || notif.senderAvatar || notif.userAvatar;
                    const rightImageUri =
                      notif.imageUrl || notif.image || notif.mediaUrl;
                    const displayAvatar =
                      avatarUri || (rightImageUri ? null : notif.imageUrl);
                    const displaySub =
                      notif.message ?? notif.subtitle ?? notif.body ?? "";
                    const displayTime = notif.time ?? notif.createdAt ?? "";

                    return (
                      <TouchableOpacity
                        key={notif.id ?? notif._id ?? Math.random()}
                        style={[
                          styles.notifItem,
                          unreadNotifications.includes(notif.id) &&
                          styles.notifItemUnread,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleNotificationPress(notif)}
                      >
                        {unreadNotifications.includes(notif.id) && (
                          <View style={styles.unreadDot} />
                        )}

                        {/* Left: Default system icon related to notification */}
                        <View style={styles.notifAvatarWrapper}>
                          <LinearGradient
                            colors={["#3d1a6e", "#7c4dff"]}
                            style={styles.notifSystemIcon}
                          >
                            <Text style={{ fontSize: 24 }}>
                              {resolveNotifIcon(notif.icon, notif.type)}
                            </Text>
                          </LinearGradient>
                        </View>

                        {/* Middle: Title, text message & timestamp */}
                        <View style={styles.notifTextCol}>
                          <Text style={styles.notifItemTitle} numberOfLines={1}>
                            {notif.title ?? notif.senderName ?? "Tuk-Tuk"}
                          </Text>
                          {displaySub ? (
                            <Text style={styles.notifItemSub} numberOfLines={2}>
                              {displaySub}
                            </Text>
                          ) : null}
                          {displayTime ? (
                            <Text style={styles.notifTime}>{displayTime}</Text>
                          ) : null}
                        </View>

                        {/* Right: Small image preview thumbnail (like Instagram notifications) */}
                        {rightImageUri ? (
                          <View style={styles.notifRightImageWrap}>
                            <Image
                              source={toImageSource(rightImageUri)}
                              style={styles.notifRightImage}
                              cachePolicy="memory-disk"
                              transition={150}
                            />
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </SafeAreaView>
          )}
        </View>
      </Modal>

      {/* ── COMMENT SHEET ── */}
      <CommentSheet
        visible={commentPostId !== null}
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
      />

      {/* ── FULL-SCREEN POST IMAGE VIEWER ── */}
      <PostImageViewer
        visible={imageViewerData !== null}
        data={imageViewerData}
        isFollowing={
          imageViewerData
            ? followingIds.some((id) =>
              isSameUser(id, imageViewerData.post.userId),
            )
            : false
        }
        isLiked={
          imageViewerData
            ? likedPostIds.includes(imageViewerData.post.id)
            : false
        }
        onClose={handleCloseImageViewer}
        onFollowToggle={handleFollowToggle}
        onLikeToggle={handleLikeToggle}
        onCommentPress={handleCommentPress}
        onMore={handleMorePress}
        onAvatarPress={handleImageViewerAvatarPress}
      />

      {/* ── FLOATING ACTION BUTTON ── */}
      <PostFAB onPress={() => setPostSheetVisible(true)} />

      {/* ── POST CREATE SHEET ── */}
      <PostCreateSheet
        visible={postSheetVisible}
        onClose={() => setPostSheetVisible(false)}
        onPost={handlePostSubmit}
      />

      {/* ── POST MORE MENU ── */}
      <PostMoreMenu
        visible={moreMenuPost !== null}
        post={moreMenuPost}
        friends={followingList.length > 0 ? followingList : recommendedUsers}
        onClose={handleMoreClose}
        onBlock={handleBlockUser}
        onDelete={handleDeletePost}
        onReport={(userId, name) => setReportTarget({ userId, name })}
        currentUserId={currentUserId}
      />

      {/* ── REPORT REASON MODAL ── */}
      <ReportReasonModal
        visible={reportTarget !== null}
        targetLabel={reportTarget?.name ? `@${reportTarget.name}` : "this user"}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReportSubmit}
      />

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => {
          setToastVisible(false);
          setToastMessage("");
        }}
      />

      <ComingSoonModal
        feature={comingSoonFeature}
        onClose={() => setComingSoonFeature(null)}
      />

      <DiamondRechargeModal
        visible={diamondRechargeVisible}
        onClose={() => setDiamondRechargeVisible(false)}
        currentDiamonds={walletDiamonds}
      />

      {/* ── Gender Picker (shown once if gender not set) ── */}
      <Modal
        visible={genderPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { }}
      >
        <View style={styles.genderOverlay}>
          <LinearGradient
            colors={["#1a0a3e", "#0d0618", "#1a0a3e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.genderCard}
          >
            <View style={styles.genderGlow} />

            <Text style={styles.genderHeaderTitle}>Who are you?</Text>
            <Text style={styles.genderHeaderSub}>
              Choose your identity to personalize{"\n"}avatars and your
              experience
            </Text>

            {/* ── Select Country button ── */}
            <TouchableOpacity
              style={styles.countryPickerBtn}
              activeOpacity={0.8}
              onPress={() => {
                setCountryDropdownOpen((o) => !o);
                setCountrySearch("");
              }}
            >
              <Text style={styles.countryPickerBtnText}>
                {selectedCountry
                  ? `🌍  ${selectedCountry}`
                  : "🌍  Select Country"}
              </Text>
              <Text style={styles.countryPickerArrow}>
                {countryDropdownOpen ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            {/* Inline country dropdown */}
            {countryDropdownOpen && (
              <View style={styles.countryDropdown}>
                <View style={styles.countrySearchWrap}>
                  <TextInput
                    style={styles.countrySearchInput}
                    placeholder="Search country..."
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={countrySearch}
                    onChangeText={setCountrySearch}
                    autoCorrect={false}
                  />
                </View>
                <ScrollView
                  style={styles.countryList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {COUNTRY_OPTIONS.filter((c) =>
                    c.name.toLowerCase().includes(countrySearch.toLowerCase()),
                  ).map((country) => (
                    <TouchableOpacity
                      key={country.name}
                      activeOpacity={0.75}
                      style={[
                        styles.countryRow,
                        selectedCountry === country.name &&
                        styles.countryRowSelected,
                      ]}
                      onPress={() => {
                        setSelectedCountry(country.name);
                        setCountryDropdownOpen(false);
                        setCountrySearch("");
                      }}
                    >
                      <Text
                        style={[
                          styles.countryRowText,
                          selectedCountry === country.name &&
                          styles.countryRowTextSelected,
                        ]}
                      >
                        {country.flag} {country.name}
                      </Text>
                      {selectedCountry === country.name && (
                        <Text style={styles.countryRowCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Boy / Girl cards */}
            {!countryDropdownOpen && (
              <>
                <View style={styles.genderAvatarRow}>
                  {/* Boy */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={genderSaving}
                    style={styles.genderAvatarBtn}
                    onPress={() => saveGenderSelection("Male")}
                  >
                    <LinearGradient
                      colors={["#0d2b6b", "#1a4fbf", "#4a7fff"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.genderAvatarCard}
                    >
                      <View style={styles.genderAvatarImgWrap}>
                        <Image
                          source={{
                            uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Avatar/avatar1.webp",
                          }}
                          style={styles.genderAvatarImg}
                          contentFit="cover"
                        />
                        <View style={styles.genderAvatarGlowBlue} />
                      </View>
                      <View style={styles.genderLabelRow}>
                        <Text style={styles.genderAvatarSign}>♂</Text>
                        <Text style={styles.genderAvatarLabel}>Boy</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Girl */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={genderSaving}
                    style={styles.genderAvatarBtn}
                    onPress={() => saveGenderSelection("Female")}
                  >
                    <LinearGradient
                      colors={["#6b0d3a", "#bf1a6e", "#ff4aaa"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.genderAvatarCard}
                    >
                      <View style={styles.genderAvatarImgWrap}>
                        <Image
                          source={{
                            uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Avatar/avatar5.webp",
                          }}
                          style={styles.genderAvatarImg}
                          contentFit="cover"
                        />
                        <View style={styles.genderAvatarGlowPink} />
                      </View>
                      <View style={styles.genderLabelRow}>
                        <Text style={styles.genderAvatarSign}>♀</Text>
                        <Text style={styles.genderAvatarLabel}>Girl</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Other option */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={genderSaving}
                  style={styles.genderOtherBtn}
                  onPress={() => saveGenderSelection("Other")}
                >
                  <Text style={styles.genderOtherText}>
                    {genderSaving ? "Saving…" : "Prefer not to say"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </View>
      </Modal>

      {/* ── Searched user profile ── */}
      <Modal
        visible={Boolean(searchProfile)}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchProfile(null)}
      >
        <View style={styles.searchProfileWrap}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSearchProfile(null)}
          />
          <View style={styles.searchProfileCard}>
            <LinearGradient
              colors={["#3d1a6e", "#7c4dff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchProfileHero}
            >
              {searchProfile?.avatar ? (
                <ProfileAvatarWithFrame
                  user={searchProfile}
                  avatarSource={toImageSource(searchProfile.avatar)}
                  frameSource={searchProfile.vipProfileFrameUrl}
                  size={110}
                  avatarStyle={styles.searchProfileAvatar}
                  {...(searchProfile.vipProfileFrameUrl
                    ? {
                      frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
                      frameResizeMode:
                        VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                      frameOffsetX: VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                      frameOffsetY: VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                      frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                      avatarBoost: VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
                      avatarOffsetY: VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                    }
                    : {})}
                />
              ) : (
                <Text style={styles.searchProfileEmoji}>👤</Text>
              )}
              {searchProfile?.isOnline && (
                <View style={styles.searchProfileOnlineDot} />
              )}
            </LinearGradient>

            <TouchableOpacity
              style={styles.searchProfileClose}
              onPress={() => setSearchProfile(null)}
            >
              <Text style={styles.searchProfileCloseTxt}>✕</Text>
            </TouchableOpacity>

            <View style={styles.searchProfileBody}>
              <View style={styles.searchProfileNameRow}>
                <Text style={styles.searchProfileName} numberOfLines={1}>
                  {searchProfile?.name ?? "User"}
                </Text>
                {searchProfile?.vip && (
                  <Text style={styles.searchProfileVip}>👑 VIP</Text>
                )}
                {searchProfile?.decorationBadgeUrl && (
                  <Image
                    source={{ uri: searchProfile.decorationBadgeUrl }}
                    style={styles.searchProfileDecorationBadge}
                    contentFit="contain"
                  />
                )}
              </View>

              <View style={styles.searchProfileMetaRow}>
                {searchProfile?.level != null && (
                  <View style={styles.searchProfileBadge}>
                    <Text style={styles.searchProfileBadgeTxt}>
                      Lv {searchProfile.level}
                    </Text>
                  </View>
                )}
                {searchProfile?.status && (
                  <View style={styles.searchProfileBadge}>
                    <Text style={styles.searchProfileBadgeTxt}>
                      {searchProfile.status}
                    </Text>
                  </View>
                )}
                {searchProfileLoading && (
                  <ActivityIndicator size="small" color="#a78bfa" />
                )}
              </View>

              {searchProfile?.bio ? (
                <Text style={styles.searchProfileBio} numberOfLines={3}>
                  {searchProfile.bio}
                </Text>
              ) : null}

              <TouchableOpacity
                style={styles.searchProfileMsgBtn}
                onPress={handleMessageSearchProfile}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#7c4dff", "#a855f7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.searchProfileMsgGradient}
                >
                  <Text style={styles.searchProfileMsgTxt}>Send Message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // ── Searched user profile modal ──
  searchProfileWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 28,
  },
  searchProfileCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1a0a2e",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  searchProfileHero: {
    width: "100%",
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  searchProfileAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
  },
  searchProfileEmoji: { fontSize: 70 },
  searchProfileOnlineDot: {
    position: "absolute",
    bottom: 20,
    right: "37%",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#00e676",
    borderWidth: 3,
    borderColor: "#1a0a2e",
  },
  searchProfileClose: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchProfileCloseTxt: { color: "white", fontSize: 15, fontWeight: "700" },
  searchProfileBody: { padding: 18, gap: 10 },
  searchProfileNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchProfileName: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
    flexShrink: 1,
  },
  searchProfileVip: { color: "#ffd700", fontSize: 13, fontWeight: "800" },
  searchProfileDecorationBadge: {
    height: 16,
    width: 16 * (438 / 179),
  },
  searchProfileMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchProfileBadge: {
    backgroundColor: "rgba(124,77,255,0.3)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  searchProfileBadgeTxt: { color: "#c4b5fd", fontSize: 11, fontWeight: "700" },
  searchProfileBio: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 19,
  },
  searchProfileMsgBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  searchProfileMsgGradient: { paddingVertical: 13, alignItems: "center" },
  searchProfileMsgTxt: { color: "white", fontSize: 15, fontWeight: "800" },

  // ── Gender picker modal ──
  genderOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  genderCard: {
    width: "100%",
    maxWidth: 370,
    borderRadius: 28,
    overflow: "hidden",
    paddingTop: 36,
    paddingBottom: 10,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.35)",
    // Outer card shadow (Android elevation)
    elevation: 24,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
  },
  // Purple glow blob at the top of the card
  genderGlow: {
    position: "absolute",
    top: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(124,77,255,0.18)",
    alignSelf: "center",
  },
  genderHeaderTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  genderHeaderSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  genderAvatarRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginBottom: 18,
  },
  genderAvatarBtn: {
    flex: 1,
    borderRadius: 22,
    // Card shadow
    elevation: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  genderAvatarCard: {
    borderRadius: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
  },
  genderAvatarImgWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  genderAvatarImg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
  },
  // Blue halo behind boy avatar
  genderAvatarGlowBlue: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(74,127,255,0.28)",
    zIndex: -1,
  },
  // Pink halo behind girl avatar
  genderAvatarGlowPink: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,74,170,0.28)",
    zIndex: -1,
  },
  genderLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  genderAvatarSign: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: "300",
  },
  genderAvatarLabel: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  genderOtherBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 6,
  },
  genderOtherText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  countryPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "rgba(124,77,255,0.18)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  countryPickerBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  countryPickerArrow: {
    color: "#a78bfa",
    fontSize: 11,
    marginLeft: 8,
  },
  countryDropdown: {
    width: "100%",
    backgroundColor: "rgba(20,8,40,0.95)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
    marginBottom: 14,
    overflow: "hidden",
  },
  countrySearchWrap: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,77,255,0.2)",
    paddingHorizontal: 12,
  },
  countrySearchInput: {
    color: "white",
    fontSize: 14,
    paddingVertical: 10,
  },
  countryList: {
    maxHeight: 190,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  countryRowSelected: {
    backgroundColor: "rgba(124,77,255,0.22)",
  },
  countryRowText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  countryRowTextSelected: {
    color: "#c4b5fd",
    fontWeight: "700",
  },
  countryRowCheck: {
    color: "#a78bfa",
    fontSize: 15,
    fontWeight: "800",
  },

  // Background orbs (same as login)
  // Background orbs (same as login)
  orbPink: {
    position: "absolute",
    width: 300,
    height: 300,
    top: -80,
    left: -80,
    borderRadius: 150,
    backgroundColor: "rgba(255,0,128,0.18)",
    // backgroundColor: "rgba(253, 131, 74, 0.88)",
    // shadowColor: "#ff0080",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },
  orbPurple: {
    position: "absolute",
    width: 350,
    height: 350,
    bottom: -120,
    right: -120,
    borderRadius: 175,
    backgroundColor: "rgba(138,43,226,0.22)",
    // backgroundColor: "rgba(43, 226, 141, 0.22)",
    shadowColor: "#8a2be2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },

  topAmbientGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 0,
  },

  // ── NEW HEADER ROW ──────────────────────────────────────────────
  newHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: vs(8),
    zIndex: 1,
  },
  headerAvatarWrap: {
    overflow: "visible",
  },
  newHeaderAvatar: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  newAppName: {
    fontSize: ms(22),
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.5,
    marginLeft: s(8),
  },
  newDiamondPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
    borderRadius: s(22),
    paddingHorizontal: s(10),
    paddingVertical: vs(5.5),
    borderWidth: 1.5,
    borderColor: "#E2D3FE",
    gap: s(5),
  },
  newDiamondIcon: {
    width: s(24),
    height: s(24),
  },
  newDiamondCount: {
    color: "#581C87",
    fontSize: ms(14),
    fontWeight: "800",
    maxWidth: s(95),
  },
  newDiamondPlusBtn: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  newDiamondPlusText: {
    color: "white",
    fontSize: ms(13),
    fontWeight: "900",
    lineHeight: ms(15),
  },
  newBellBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: s(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  newBellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(3),
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  newBellBadgeText: {
    color: "white",
    fontSize: ms(9),
    fontWeight: "800",
  },

  // ── ACTIVE NOW PILL ──────────────────────────────────────────────
  activeNowPill: {
    marginHorizontal: 16,
    marginTop: vs(6),
    marginBottom: vs(14),
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  activeNowGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: vs(10),
    paddingHorizontal: s(14),
    borderRadius: 30,
  },
  activeNowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  activeNowAvatarWrap: {
    width: s(36),
    height: s(36),
    position: "relative",
  },
  activeNowAvatar: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  activeNowGreenDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#FF1493",
  },
  activeNowWaves: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5,
  },
  activeNowWaveBar: {
    width: 3,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 2,
  },
  activeNowTextCol: {
    marginLeft: s(2),
  },
  activeNowNumber: {
    color: "white",
    fontSize: ms(15),
    fontWeight: "900",
    lineHeight: ms(18),
  },
  activeNowLabel: {
    color: "rgba(255,255,255,0.92)",
    fontSize: ms(11),
    fontWeight: "600",
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: vs(7),
    paddingHorizontal: s(16),
    gap: 3,
  },
  joinBtnText: {
    color: "#FF1493",
    fontSize: ms(13.5),
    fontWeight: "900",
  },

  // ── VOICE PARTY HERO BANNER ──────────────────────────────────────
  vpBanner: {
    marginHorizontal: 16,
    marginBottom: vs(14),
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#380D77",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  vpBannerGradient: {
    flexDirection: "row",
    height: vs(195),
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  vpLeft: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: s(18),
    paddingVertical: vs(16),
    zIndex: 2,
  },
  vpLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,45,85,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,45,85,0.45)",
    borderRadius: 12,
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    alignSelf: "flex-start",
    gap: s(5),
  },
  vpLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF2D55",
  },
  vpLiveTxt: {
    color: "white",
    fontSize: ms(11),
    fontWeight: "800",
  },
  vpTitle: {
    color: "white",
    fontSize: ms(28),
    fontWeight: "900",
    letterSpacing: -0.3,
    marginTop: vs(6),
  },
  vpSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: ms(12),
    fontWeight: "500",
    marginTop: vs(4),
    marginBottom: vs(16),
  },
  vpJoinBtn: {
    borderRadius: 22,
    alignSelf: "flex-start",
    overflow: "hidden",
    shadowColor: "#FF007A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  vpJoinBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(9),
    paddingHorizontal: s(16),
    gap: 4,
  },
  vpJoinBtnText: {
    color: "white",
    fontSize: ms(13),
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  vpRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: s(175),
    overflow: "hidden",
  },
  vpHeroArt: {
    width: "100%",
    height: "100%",
  },
  vpHeroArtFade: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
  },

  // ── 3-COLUMN FEATURE CARDS ───────────────────────────────────────
  featureCardsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: vs(16),
  },
  featureCard: {
    flex: 1,
    height: vs(138),
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  featureCardGradient: {
    flex: 1,
    padding: s(10),
    justifyContent: "space-between",
    position: "relative",
  },
  featureCardImgWrap: {
    width: s(48),
    height: s(48),
    borderRadius: s(16),
    overflow: "hidden",
  },
  featureCardImg: {
    width: "100%",
    height: "100%",
  },
  featureCardBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  featureCardTextCol: {
    flex: 1,
  },
  featureCardTitle: {
    color: "white",
    fontSize: ms(13),
    fontWeight: "900",
    lineHeight: ms(16),
  },
  featureCardSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: ms(9.5),
    fontWeight: "500",
    marginTop: 2,
  },
  featureCardArrowWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  // ── SECTION COMMON ───────────────────────────────────────────────
  sectionWrap: {
    marginBottom: vs(16),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: vs(10),
  },
  sectionTitle: {
    color: "#111827",
    fontSize: ms(16.5),
    fontWeight: "800",
    marginLeft: 6,
  },
  sectionSeeAll: {
    color: "#7C3AED",
    fontSize: ms(13),
    fontWeight: "700",
  },

  // ── PLAY & CONNECT ───────────────────────────────────────────────
  playHeaderIcon: {
    width: s(22),
    height: vs(18),
  },
  playCardsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: s(8),
  },
  playCard: {
    flex: 1,
    height: vs(78),
    borderRadius: s(18),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  playCardGradient: {
    flex: 1,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: s(6),
    paddingRight: s(6),
    paddingVertical: vs(6),
  },
  playCardImgWrap: {
    width: s(38),
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  playCardImg: {
    width: "100%",
    height: "100%",
  },
  playCardContent: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-start",
    paddingLeft: s(2),
    paddingRight: s(14),
    paddingTop: vs(4),
  },
  playCardTitle: {
    color: "#FFFFFF",
    fontSize: ms(11.5),
    fontWeight: "900",
    lineHeight: ms(14),
    letterSpacing: -0.2,
  },
  playCardArrow: {
    position: "absolute",
    bottom: vs(7),
    right: s(7),
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  // ── POPULAR ROOMS ────────────────────────────────────────────────
  filterPillsScroll: { marginBottom: vs(12) },
  filterPillsContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: "center",
  },
  filterPillGlobal: {
    backgroundColor: "#6D28D9",
    borderRadius: 16,
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
  },
  filterPillGlobalTxt: {
    color: "white",
    fontSize: ms(12),
    fontWeight: "800",
  },
  filterTabItem: {
    paddingVertical: vs(4),
    paddingHorizontal: s(4),
  },
  filterTabTxt: {
    color: "#64748B",
    fontSize: ms(13),
    fontWeight: "600",
  },
  filterTabTxtActive: {
    color: "#6D28D9",
    fontWeight: "900",
  },
  roomsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 6,
  },
  roomCard: {
    width: s(124),
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: s(10),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  roomRing: {
    width: s(82),
    height: s(82),
    borderRadius: s(41),
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  roomCardImg: {
    width: "100%",
    height: "100%",
    borderRadius: s(39),
  },
  roomLiveBadge: {
    position: "absolute",
    top: 2,
    right: -4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  roomLiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "white",
  },
  roomLiveTxt: {
    color: "white",
    fontSize: ms(9),
    fontWeight: "900",
  },
  roomCardName: {
    color: "#0F172A",
    fontSize: ms(12.5),
    fontWeight: "800",
    textAlign: "center",
    marginTop: vs(8),
  },
  roomCardCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: vs(3),
  },
  roomCardCount: {
    color: "#64748B",
    fontSize: ms(11),
    fontWeight: "600",
  },
  roomCardRegionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: vs(2),
  },
  roomCardRegion: {
    color: "#6D28D9",
    fontSize: ms(10.5),
    fontWeight: "600",
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Per-tab loading / empty state
  feedStateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  feedStateEmoji: { fontSize: 44, marginBottom: 14 },
  feedStateTitle: {
    color: "rgba(0,0,0,0.55)",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  feedStateSubtitle: {
    color: "rgba(0,0,0,0.55)",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },

  // 2×2 Action grid — all equal size
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
    paddingHorizontal: H_PAD,
    marginBottom: 25,
    justifyContent: "center",
  },
  actionCard: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.12,
    borderRadius: 20,
    overflow: "hidden",
  },
  actionCardGradient: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
  },
  cardTitle: {
    color: "white",
    fontSize: ms(15),
    fontWeight: "800",
    lineHeight: ms(20),
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(11),
    fontWeight: "500",
    marginTop: vs(2),
    marginBottom: vs(4),
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 8,
  },
  waveBar: {
    width: 4,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 2,
  },
  cardIllustration: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: CARD_SIZE * 0.48,
    height: CARD_SIZE * 0.48,
  },

  // Icon row
  iconContainer: { marginBottom: 20 },
  iconScroll: {
    paddingHorizontal: 15,
    gap: 14,
  },
  iconItem: {
    alignItems: "center",
    width: s(72),
  },
  iconBox: {
    width: s(64),
    height: s(64),
    borderRadius: s(18),
    alignItems: "center",
    justifyContent: "center",
  },
  iconImg: { width: s(40), height: s(40) },
  iconLabel: {
    color: "rgba(0, 0,  0, 0.9)",
    fontSize: ms(11),
    marginTop: vs(6),
    textAlign: "center",
    lineHeight: ms(14),
  },

  // Tabs
  tabsBar: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 20,
  },
  tabsScroll: {
    gap: 20,
  },
  tabItem: {
    alignItems: "center",
    // paddingBottom: 2,
  },
  tabText: {
    color: "rgba(0,0,0,0.45)",
    fontSize: ms(15),
    fontWeight: "500",
  },
  tabActive: {
    color: "black",
    fontWeight: "800",
    fontSize: ms(16),
  },
  tabUnderline: {
    width: "100%",
    height: 2.5,
    backgroundColor: "#7c4dff",
    borderRadius: 3,
    marginTop: 8,
  },

  // Active now panel (unused legacy — kept for reference)
  activePanel: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: H_PAD,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(78,255,145,0.2)",
  },

  // Feed
  feed: {
    paddingHorizontal: H_PAD,
    gap: 10,
  },
  // Outer wrapper for FlatList feed items (provides horizontal padding)
  postOuter: {
    paddingHorizontal: H_PAD,
  },
  postCard: {
    backgroundColor: "rgba(194, 26, 26, 0.09)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  postAvatar: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
  },
  postAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  postImage: {
    width: "100%",
    borderRadius: 12,
    marginBottom: 10,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    position: "relative",
  },
  galleryPage: { width: SCREEN_WIDTH - H_PAD * 2 - 24, height: "100%" },
  galleryCountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  galleryCountText: { color: "white", fontSize: 11, fontWeight: "700" },
  galleryDots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  galleryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  galleryDotActive: {
    backgroundColor: "white",
    width: 12,
  },
  postName: {
    color: "black",
    fontSize: ms(14),
    fontWeight: "700",
    flex: 1,
  },
  followBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  followBtnActive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#7c4dff",
  },
  followBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  followBtnTextActive: {
    color: "#b388ff",
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  postFooterLeft: {
    flex: 1,
  },
  postFooterRight: {
    flexDirection: "row",
    gap: 8,
  },
  postLikeCount: {
    color: "rgba(0,0,0,0.9)",
    fontSize: 12,
  },
  postActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  postActionBtnLiked: {
    backgroundColor: "rgba(255,78,163,0.12)",
    borderColor: "rgba(255,78,163,0.35)",
  },
  postActionEmoji: {
    fontSize: 14,
  },
  postActionLabel: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  moreBtn: { paddingHorizontal: 4 },
  moreBtnText: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 18,
    letterSpacing: 1,
  },
  postText: {
    color: "rgba(0,0,0,0.82)",
    fontSize: ms(13),
    lineHeight: ms(20),
    marginBottom: vs(10),
  },
  moreText: {
    color: "#7c4dff",
    fontWeight: "600",
  },
  videoBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: "white",
    fontSize: 20,
    marginLeft: 3,
  },
  videoDuration: {
    position: "absolute",
    bottom: 10,
    right: 12,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },

  // Recommend users
  recommendSection: {
    // paddingHorizontal: H_PAD,
    marginBottom: 16,
    marginTop: 10,
  },
  recommendTitle: {
    color: "black",
    fontSize: ms(16),
    fontWeight: "700",
    marginBottom: vs(12),
    paddingHorizontal: 20,
  },
  recommendScroll: {
    gap: 15,
    paddingHorizontal: 10,
  },
  recommendItem: {
    alignItems: "center",
    width: s(76),
  },
  recommendAvatarWrap: {
    width: s(60),
    height: s(60),
    borderRadius: s(34),
    marginBottom: vs(8),
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  recommendAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: s(36),
  },
  recommendAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendInitial: {
    color: "white",
    fontSize: ms(22),
    fontWeight: "800",
  },
  recommendName: {
    color: "black",
    fontSize: ms(12),
    textAlign: "center",
    fontWeight: "500",
    flexShrink: 1,
  },
  recommendNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    maxWidth: s(76),
  },
  recommendLevelBadge: {
    height: 10,
    width: 10 * (142 / 149),
  },
  recommendVipBadge: {
    height: 10,
    width: 10,
  },

  // Banner Slider
  bannerWrapper: {
    marginHorizontal: H_PAD,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerSlide: {
    width: SCREEN_WIDTH - H_PAD * 2,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerImg: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bannerTitle: {
    color: "#ffd700",
    fontSize: ms(18),
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.09)",
  },
  bannerDotActive: {
    width: 20,
    backgroundColor: "#7c4dff",
  },

  // ── SEARCH MODAL ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  searchPanel: {
    marginHorizontal: 14,
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  searchPanelTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  searchCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchCloseTxt: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "700",
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 20,
  },
  searchInputIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  searchClearBtn: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  searchSuggestSection: { marginBottom: 18 },
  searchSuggestLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  searchSuggestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  searchChip: {
    borderRadius: 20,
    overflow: "hidden",
  },
  searchChipGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.4)",
  },
  searchChipText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
  trendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  trendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7c4dff",
  },
  trendingTag: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── NOTIFICATION MODAL ──
  notifOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  notifBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  notifPanel: {
    height: "85%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
  },
  notifTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  notifHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notifMarkAll: {
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  notifMarkAllText: {
    color: "#a47dff",
    fontSize: 12,
    fontWeight: "600",
  },
  notifCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifCloseTxt: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "700",
  },
  notifDivider: {
    height: 1,
    marginBottom: 6,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  notifItemUnread: {
    backgroundColor: "rgba(124,77,255,0.07)",
  },
  unreadDot: {
    position: "absolute",
    left: 8,
    top: "62%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffff",
  },
  notifAvatarWrapper: {
    width: 50,
    height: 50,
    position: "relative",
    marginLeft: 2,
  },
  notifAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(124,77,255,0.5)",
  },
  notifIconBubble: {
    position: "absolute",
    bottom: -2,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F08000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.4)",
  },
  notifIconBubbleTxt: { fontSize: 12, textAlign: "center" },
  notifSystemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTextCol: { flex: 1 },
  notifRightImageWrap: {
    width: 46,
    height: 46,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(124,77,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    marginLeft: 6,
  },
  notifRightImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  notifItemTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  notifItemSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  notifTime: {
    color: "#7c4dff",
    fontSize: 11,
    fontWeight: "600",
  },
  notifStateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    gap: 10,
  },
  notifStateEmoji: {
    fontSize: 36,
  },
  notifStateText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // ── SEARCH RESULTS ──
  searchResultsSection: {
    marginBottom: 18,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  resultIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultIcon: {
    fontSize: 20,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  resultTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  resultLevelBadge: {
    height: 13,
    width: 13 * (142 / 149),
  },
  resultVipBadge: {
    height: 13,
    width: 13,
  },
  resultSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noResultsText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  noResultsSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 18,
  },

  // ── GIFT MODAL ──
  giftsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  giftBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  giftsPanel: {
    height: "90%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  giftsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
  },
  giftsTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  giftCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftCloseTxt: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "700",
  },
  freeGiftBanner: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 16,
    overflow: "hidden",
  },
  freeGiftGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  freeGiftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  freeGiftEmoji: {
    fontSize: 32,
  },
  freeGiftText: {
    flex: 1,
  },
  freeGiftTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  freeGiftSubtitle: {
    color: "rgba(0,0,0,0.7)",
    fontSize: 12,
    fontWeight: "500",
  },
  giftsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  giftsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  giftCard: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 1,
  },
  giftCardGradient: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  giftEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  giftName: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  giftValue: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  giftDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 8,
  },
  freeTag: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  freeTagText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
});
