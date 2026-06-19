import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  InteractionManager,
  ActivityIndicator,
  Share,
  Linking,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight } from "lucide-react-native";
import * as homeService from "../../src/services/homeService";
import {
  followUser,
  unfollowUser,
  blockUser,
  loadFollowing,
  loadFollowers,
  isSameUser,
} from "../../src/services/relationshipService";
import { getAppUserId, isOwnContent } from "../../src/utils/sessionUser";
import { getUser } from "../../src/store/authStore";
import { resolveProfileAvatarSource } from "../../src/utils/profileAvatar";
import {
  createPost,
  deletePost,
  likePost,
  unlikePost,
  getPostComments,
  addComment,
  markInterested,
  markNotInterested,
  reportUser,
  shareUser,
} from "../../src/api/postApi";
import * as ImagePicker from "expo-image-picker";
import Toast from "../../Components/Toast";
import ComingSoonModal from "../../Components/ComingSoonModal";
import { getDeviceCoordinates } from "../../src/utils/deviceLocation";
import { openUserChat } from "../../src/utils/chatNavigation";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const H_PAD = 14;
const CARD_GAP = 10;
const CARD_SIZE = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2 * 0.88;
const BANNER_SLIDE_WIDTH = SCREEN_WIDTH - H_PAD * 2;

// Stable arrays at module level — never recreated on re-renders
const WAVE_HEIGHTS = [8, 14, 10, 18, 12];
const MATCH_WAVE_HEIGHTS = [5, 10, 7, 13, 9, 6, 11];

const actionCards = [
  {
    title: "Voice Party",
    subtitle: "Join a live room",
    colors: ["#362407ff", "#f76b1c"],
    img: require("../../assets/images/TM1.png"),
    partyRandom: true,
    showWave: true,
    imgSize: CARD_SIZE * 0.80,
    gifDelay: 0,
  },
  {
    title: "Find Friends",
    subtitle: "Meet new people",
    colors: ["#180c3aff", "#a647eaff"],
    img: require("../../assets/images/ofcchat.gif"),
    route: "/find-friends",
    imgSize: CARD_SIZE * 0.88,
    gifDelay: 400,
  },
  {
    title: "Nearby",
    subtitle: "People around you",
    colors: ["#143238ff", "#0077b6"],
    img: require("../../assets/images/TM3.gif"),
    route: "/nearby",
    imgSize: CARD_SIZE * 0.90,
    gifDelay: 800,
  },
  {
    title: "Blind Pick",
    subtitle: "Mystery match",
    colors: ["#dc62bcff", "#351743ff"],
    img: require("../../assets/images/TM2B.gif"),
    route: "/(tabs)/blind-pick",
    imgSize: CARD_SIZE * 0.80,
    gifDelay: 1200,
  },
];

const iconItems = [
  {
    label: "Voice Call",
    img: require("../../assets/images/officialchat.png"),
    colors: ["#cf91b6ff", "#180a31ff"],
    imgSize: 70,
  },
  {
    label: "Personality Test",
    img: require("../../assets/images/blindpick.png"),
    colors: ["#080334ff", "#ac4dffff"],
    imgSize: 60,
  },
  {
    label: "Truth & Dare",
    img: require("../../assets/images/truthdare.png"),
    colors: ["#15072dff", "#486ba8ff"],
    imgSize: 150,
    comingSoon: true,
  },
  {
    label: "Invitation\nRewards",
    img: require("../../assets/images/invitationReward.png"),
    colors: ["#76093fff", "#ba741eff"],
    imgSize: 80,
  },
  {
    label: "Ludo",
    img: require("../../assets/images/ludo.jpg"),
    colors: ["#041e04ff", "#175726ff"],
    imgSize: 70,
    comingSoon: true,
  },
  {
    label: "Snakes & ladders",
    img: require("../../assets/images/SnakesAndLadders.jpg"),
    colors: ["#0c250cff", "#d2ec23cf"],
    imgSize: 50,
    comingSoon: true,
  },
  {
    label: "Draw & Guess",
    img: require("../../assets/images/draw n guess.jpg"),
    colors: ["#5f0909ff", "#9e4c3eff"],
    imgSize: 50,
    comingSoon: true,
  },
];

const TABS = ["For You", "Online", "Following", "New"];

// Per-tab empty-state copy shown when a tab has no content yet.
const TAB_EMPTY_COPY = {
  "For You":   { emoji: "✨", title: "Nothing here yet",        subtitle: "Posts picked for you will show up here." },
  "Online":    { emoji: "🟢", title: "No one's online",          subtitle: "Active people will appear here when they come online." },
  "Following": { emoji: "👥", title: "No posts from following",  subtitle: "Follow people to see their latest posts here." },
  "New":       { emoji: "🆕", title: "No new posts",             subtitle: "Fresh posts will appear here as they're shared." },
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
  return <Image source={source} style={style} contentFit={contentFit ?? "contain"} />;
});

// ── More-menu constants ───────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { id: "whatsapp",  label: "WhatsApp",  bg: "#25D366", emoji: "💬" },
  { id: "telegram",  label: "Telegram",  bg: "#2CA5E0", emoji: "✈️" },
  { id: "instagram", label: "Instagram", bg: "#E1306C", emoji: "📸" },
  { id: "facebook",  label: "Facebook",  bg: "#1877F2", emoji: "📘" },
  { id: "twitter",   label: "X / Twitter", bg: "#14171A", emoji: "🐦" },
  { id: "more",      label: "More",      bg: "#7c4dff", emoji: "⋯"  },
];

const MENU_ACTIONS = [
  { id: "interested",     label: "Interested",    emoji: "👍", color: "#7c4dff" },
  { id: "not_interested", label: "Not Interested", emoji: "👎", color: "#ff4ea3" },
  { id: "report",         label: "Report",         emoji: "🚩", color: "#ff6b35" },
  { id: "block",          label: "Block User",      emoji: "🚫", color: "#ff3f72" },
];

// ── Post more-menu bottom sheet ───────────────────────────────
const PostMoreMenu = memo(({ visible, post, friends, onClose, onBlock, onDelete, currentUserId }) => {
  // Show delete if: post was created by this user (flag), OR userId matches current user
  const isOwnPost = post?._isOwn === true || isOwnContent(post, currentUserId);
  const menuActions = isOwnPost
    ? MENU_ACTIONS.filter((action) => action.id !== "block")
    : MENU_ACTIONS;

  const handleSocialShare = useCallback(async (platform) => {
    const text = `Check this out on Tuk Tuk! "${(post?.text ?? "").slice(0, 100)}..."`;

    if (post?.userId) {
      shareUser(post.userId).catch(() => {});
    }

    if (platform.id === "more") {
      await Share.share({ message: text }).catch(() => {});
      onClose();
      return;
    }
    const deepLinks = {
      whatsapp:  `whatsapp://send?text=${encodeURIComponent(text)}`,
      telegram:  `tg://msg?text=${encodeURIComponent(text)}`,
      instagram: `instagram://`,
      facebook:  `fb://facewebmodal/f?href=${encodeURIComponent("https://tuktuk.app")}`,
      twitter:   `twitter://post?message=${encodeURIComponent(text)}`,
    };
    const url = deepLinks[platform.id];
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      await Share.share({ message: text }).catch(() => {});
    }
    onClose();
  }, [post, onClose]);

  const handleAction = useCallback(async (action) => {
    onClose();
    const targetUserId = post?.userId;
    switch (action.id) {
      case "block":
        onBlock(targetUserId, post?.name);
        break;
      case "interested":
        try {
          await markInterested(targetUserId);
        } catch (e) {
        }
        break;
      case "not_interested":
        try {
          await markNotInterested(targetUserId);
        } catch (e) {
        }
        break;
      case "report":
        try {
          await reportUser(targetUserId);
        } catch (e) {
        }
        break;
      case "delete":
        onDelete?.(post?.id);
        break;
      default:
        break;
    }
  }, [post, onClose, onBlock]);

  if (!post) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={moreMenuStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={moreMenuStyles.sheet}>
          <LinearGradient
            colors={["#1e0a3c", "#16082a", "#0d0618"]}
            style={StyleSheet.absoluteFill}
          />
          {/* Top border glow */}
          <LinearGradient
            colors={["#7c4dff", "#ff4ea3"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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
                <TouchableOpacity style={moreMenuStyles.friendItem} activeOpacity={0.8}>
                  <LinearGradient
                    colors={["#7c4dff", "#ff4ea3"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={moreMenuStyles.friendRing}
                  >
                    <Image
                      source={{ uri: item.avatar }}
                      style={moreMenuStyles.friendAvatar}
                      cachePolicy="memory-disk"
                    />
                  </LinearGradient>
                  <Text style={moreMenuStyles.friendName} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={moreMenuStyles.emptyFriends}>No friends to show</Text>
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
                <View style={[moreMenuStyles.platformIcon, { backgroundColor: p.bg }]}>
                  <Text style={moreMenuStyles.platformEmoji}>{p.emoji}</Text>
                </View>
                <Text style={moreMenuStyles.platformLabel}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <LinearGradient
            colors={["transparent", "rgba(124,77,255,0.4)", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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
                <View style={[moreMenuStyles.actionIconBox, { backgroundColor: action.color + "25" }]}>
                  <Text style={moreMenuStyles.actionEmoji}>{action.emoji}</Text>
                </View>
                <Text style={[
                  moreMenuStyles.actionLabel,
                  action.id === "block" && { color: "#ff3f72" },
                ]}>
                  {action.id === "block" && post?.name ? `Block ${post.name}` : action.label}
                </Text>
                <Text style={moreMenuStyles.actionChevron}>›</Text>
              </TouchableOpacity>
              {i < menuActions.length - 1 && <View style={moreMenuStyles.actionDivider} />}
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
                <View style={[moreMenuStyles.actionIconBox, { backgroundColor: "#ff3f7225" }]}>
                  <Text style={moreMenuStyles.actionEmoji}>🗑️</Text>
                </View>
                <Text style={[moreMenuStyles.actionLabel, { color: "#ff3f72" }]}>
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
});

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

// ── Post Create Sheet ─────────────────────────────────────────
const PostCreateSheet = memo(({ visible, onClose, onPost }) => {
  const [caption, setCaption]         = useState("");
  const [media, setMedia]             = useState(null);
  const [mediaType, setMediaType]     = useState(null);
  const [confirmed, setConfirmed]     = useState(false); // true after user taps "Attach"
  const [loading, setLoading]         = useState(false);
  const captionRef                    = useRef(null);
  const scrollRef                     = useRef(null);

  useEffect(() => {
    if (!visible) {
      setCaption("");
      setMedia(null);
      setMediaType(null);
      setConfirmed(false);
    }
  }, [visible]);

  const pickMedia = useCallback(async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Gallery access is required to attach a photo or video.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === "photo"
        ? ["images"]
        : ["videos"],
      allowsEditing: false,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets?.[0]) {
      setMedia(result.assets[0]);
      setMediaType(type);
      setConfirmed(true);
    }
  }, []);

  const openCamera = useCallback(async (type) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to take a photo or video.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: type === "photo"
        ? ["images"]
        : ["videos"],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      setMedia(result.assets[0]);
      setMediaType(type);
      setConfirmed(true);
    }
  }, []);

  // "Done" just confirms the media selection and reveals the caption input.
  // The actual API call happens in handlePost when the user taps "Post".
  const handleConfirmMedia = useCallback(() => {
    if (!media?.uri) return;
    setConfirmed(true);
  }, [media]);

  // Re-launch picker with crop enabled on the existing media URI
  const handleCrop = useCallback(async () => {
    if (!media?.uri) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,   // native crop UI
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      setMedia(result.assets[0]);
      setConfirmed(true);
    }
  }, [media]);

  const handlePost = useCallback(async () => {
    if (!caption.trim() && !media?.uri) return;
    setLoading(true);
    try {
      await onPost({ caption, media, mediaUri: media?.uri, mediaType });
      onClose();
    } catch (e) {
      Alert.alert(
        "Post failed",
        e?.message || "Could not create your post. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [caption, media, mediaType, onPost, onClose]);

  const canPost = caption.trim().length > 0 || Boolean(media?.uri);
  const showComposer = !media || confirmed;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={postCreateStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
          <View style={postCreateStyles.sheet}>
            <LinearGradient colors={["#1e0a3c", "#16082a", "#0d0618"]} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={["#7c4dff", "#ff4ea3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={postCreateStyles.topGlow} />
            <View style={postCreateStyles.handle} />

            {/* ── HEADER ── */}
            <View style={postCreateStyles.header}>
              <Text style={postCreateStyles.title}>Create Post</Text>
              <TouchableOpacity onPress={onClose} style={postCreateStyles.closeBtn}>
                <Text style={postCreateStyles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* ── STEP 1: media picker (hidden after confirmed) ── */}
              {!confirmed && (
                <>
                  <View style={postCreateStyles.mediaRow}>
                    <TouchableOpacity style={postCreateStyles.mediaCard} onPress={() => pickMedia("photo")} activeOpacity={0.8}>
                      <LinearGradient colors={["rgba(124,77,255,0.25)", "rgba(124,77,255,0.08)"]} style={postCreateStyles.mediaCardGrad}>
                        <Text style={postCreateStyles.mediaCardEmoji}>🖼️</Text>
                        <Text style={postCreateStyles.mediaCardLabel}>Gallery</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={postCreateStyles.mediaCard} onPress={() => openCamera("photo")} activeOpacity={0.8}>
                      <LinearGradient colors={["rgba(255,78,163,0.25)", "rgba(255,78,163,0.08)"]} style={postCreateStyles.mediaCardGrad}>
                        <Text style={postCreateStyles.mediaCardEmoji}>📷</Text>
                        <Text style={postCreateStyles.mediaCardLabel}>Camera</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={postCreateStyles.mediaCard} onPress={() => pickMedia("video")} activeOpacity={0.8}>
                      <LinearGradient colors={["rgba(255,107,53,0.25)", "rgba(255,107,53,0.08)"]} style={postCreateStyles.mediaCardGrad}>
                        <Text style={postCreateStyles.mediaCardEmoji}>🎬</Text>
                        <Text style={postCreateStyles.mediaCardLabel}>Video</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={postCreateStyles.mediaCard} onPress={() => openCamera("video")} activeOpacity={0.8}>
                      <LinearGradient colors={["rgba(0,180,216,0.25)", "rgba(0,180,216,0.08)"]} style={postCreateStyles.mediaCardGrad}>
                        <Text style={postCreateStyles.mediaCardEmoji}>🎥</Text>
                        <Text style={postCreateStyles.mediaCardLabel}>Record</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* ── FULL PREVIEW + BOTTOM ACTION BUTTONS ── */}
                  {media && (
                    <View style={postCreateStyles.confirmBlock}>
                      <View style={postCreateStyles.previewWrapper}>
                        <Image source={{ uri: media.uri }} style={postCreateStyles.preview} contentFit="cover" />
                        {mediaType === "video" && (
                          <View style={postCreateStyles.videoOverlay}>
                            <Text style={postCreateStyles.videoPlayIcon}>▶</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={postCreateStyles.removeBtn}
                          onPress={() => { setMedia(null); setMediaType(null); }}
                        >
                          <Text style={postCreateStyles.removeTxt}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      {/* ── BOTTOM ACTION BUTTONS: Crop · Rotate · Flip · Done ── */}
                      <View style={postCreateStyles.previewActions}>
                        <TouchableOpacity
                          style={postCreateStyles.previewActionBtn}
                          onPress={handleCrop}
                          activeOpacity={0.8}
                        >
                          <Text style={postCreateStyles.previewActionEmoji}>✂️</Text>
                          <Text style={postCreateStyles.previewActionLabel}>Crop</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={postCreateStyles.previewActionBtn} activeOpacity={0.8}>
                          <Text style={postCreateStyles.previewActionEmoji}>🔄</Text>
                          <Text style={postCreateStyles.previewActionLabel}>Rotate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={postCreateStyles.previewActionBtn} activeOpacity={0.8}>
                          <Text style={postCreateStyles.previewActionEmoji}>↔️</Text>
                          <Text style={postCreateStyles.previewActionLabel}>Flip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleConfirmMedia}
                          disabled={loading}
                          activeOpacity={0.85}
                          style={postCreateStyles.previewDoneBtn}
                        >
                          <LinearGradient
                            colors={["#7c4dff", "#a855f7"]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={postCreateStyles.previewDoneGrad}
                          >
                            {loading
                              ? <ActivityIndicator color="white" size="small" />
                              : <Text style={postCreateStyles.previewDoneTxt}>✓  Done</Text>
                            }
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* ── STEP 2: confirmed — show thumbnail + caption + post ── */}
              {confirmed && media && (
                <View style={postCreateStyles.confirmedRow}>
                  <View style={postCreateStyles.thumbWrapper}>
                    <Image source={{ uri: media.uri }} style={postCreateStyles.thumb} contentFit="cover" />
                    {mediaType === "video" && <Text style={postCreateStyles.thumbVideoIcon}>▶</Text>}
                    <View style={postCreateStyles.thumbTick}>
                      <Text style={postCreateStyles.thumbTickTxt}>✓</Text>
                    </View>
                  </View>
                  <View style={postCreateStyles.confirmedInfo}>
                    <Text style={postCreateStyles.confirmedLabel}>
                      {mediaType === "video" ? "🎬" : "📷"} {mediaType === "video" ? "Video" : "Photo"} attached
                    </Text>
                    <TouchableOpacity onPress={() => { setConfirmed(false); }}>
                      <Text style={postCreateStyles.changeMediaTxt}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── CAPTION + POST (text-only, or after media is confirmed) ── */}
              {showComposer && (
                <View style={postCreateStyles.inputWrapper}>
                  <TextInput
                    ref={captionRef}
                    style={postCreateStyles.captionInput}
                    placeholder="What's on your mind?"
                    placeholderTextColor="rgba(255,255,255,0.28)"
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    maxLength={500}
                  />
                  <Text style={postCreateStyles.charCount}>{caption.length}/500</Text>
                </View>
              )}

              {showComposer && (
                <TouchableOpacity
                  onPress={handlePost}
                  disabled={!canPost || loading}
                  activeOpacity={0.85}
                  style={postCreateStyles.postBtnOuter}
                >
                  <LinearGradient
                    colors={canPost ? ["#7c4dff", "#ff4ea3"] : ["#2a2a3e", "#2a2a3e"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={postCreateStyles.postBtnGrad}
                  >
                    {loading
                      ? <ActivityIndicator color="white" size="small" />
                      : <Text style={postCreateStyles.postBtnTxt}>✦  Post</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

const postCreateStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 16,
  },
  sheet: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 18,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  topGlow: { height: 2, width: "100%" },
  handle: {
    width: 42, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center", marginTop: 14, marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { color: "#ffffff", fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  closeTxt: { color: "rgba(255,255,255,0.7)", fontSize: 14 },

  // Media picker row
  mediaRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  mediaCard: {
    flex: 1, borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  mediaCardGrad: { paddingVertical: 14, alignItems: "center", gap: 6 },
  mediaCardEmoji: { fontSize: 24 },
  mediaCardLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },

  // Full preview (step 1)
  confirmBlock: { marginBottom: 4 },
  previewWrapper: { height: 220, borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  preview: { width: "100%", height: "100%", backgroundColor: "#1a0a2e" },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  videoPlayIcon: { fontSize: 36, color: "white" },
  removeBtn: {
    position: "absolute", top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  removeTxt: { color: "white", fontSize: 12 },

  // Bottom action bar on preview (Rotate · Flip · Done)
  previewActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
    gap: 10,
  },
  previewActionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    gap: 4,
  },
  previewActionEmoji: { fontSize: 20 },
  previewActionLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  previewDoneBtn: { flex: 2, borderRadius: 16, overflow: "hidden" },
  previewDoneGrad: {
    paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  previewDoneTxt: { color: "white", fontSize: 15, fontWeight: "800" },

  // Keep changeMediaTxt for the confirmed step
  changeMediaBtn: { alignItems: "center", paddingVertical: 8, marginBottom: 8 },
  changeMediaTxt: { color: "#b388ff", fontSize: 13 },

  // Confirmed thumbnail row (step 2)
  confirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  thumbWrapper: { width: 56, height: 56, borderRadius: 10, overflow: "hidden", position: "relative" },
  thumb: { width: 56, height: 56, backgroundColor: "#1a0a2e" },
  thumbVideoIcon: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    textAlign: "center", lineHeight: 56, fontSize: 18, color: "white",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  thumbTick: {
    position: "absolute", bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#22c55e",
    alignItems: "center", justifyContent: "center",
  },
  thumbTickTxt: { color: "white", fontSize: 10, fontWeight: "700" },
  confirmedInfo: { flex: 1, gap: 4 },
  confirmedLabel: { color: "#86efac", fontSize: 13, fontWeight: "600" },

  // Caption input
  inputWrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    marginBottom: 16,
    minHeight: 90,
  },
  captionInput: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 22,
    minHeight: 60,
    textAlignVertical: "top",
  },
  charCount: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },

  // Post button
  postBtnOuter: { borderRadius: 26, overflow: "hidden" },
  postBtnGrad: { height: 52, alignItems: "center", justifyContent: "center" },
  postBtnTxt: { color: "white", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});

// ── Floating Action Button ─────────────────────────────────────
const PostFAB = memo(({ onPress }) => (
  <TouchableOpacity
    style={fabStyles.fab}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <LinearGradient
      colors={["#7c4dff", "#ff4ea3"]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={fabStyles.gradient}
    >
      <Text style={fabStyles.icon}>+</Text>
    </LinearGradient>
  </TouchableOpacity>
));

const fabStyles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 90,
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    zIndex: 100,
  },
  gradient: {
    width: 56, height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    color: "white",
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 34,
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
  const [comments, setComments]     = useState([]);
  const [text, setText]             = useState("");
  const [loading, setLoading]       = useState(false);
  const [sending, setSending]       = useState(false);
  const [likedComments, setLiked]   = useState([]);
  const inputRef                    = useRef(null);

  // Load comments whenever sheet opens
  useEffect(() => {
    if (!visible || !postId) return;
    setComments([]);
    setText("");
    setLoading(true);
    getPostComments(postId)
      .then((data) => {

        let list = [];
        if (Array.isArray(data))                          list = data;
        else if (Array.isArray(data?.content))            list = data.content;
        else if (Array.isArray(data?.comments))           list = data.comments;
        else if (Array.isArray(data?.comments?.content))  list = data.comments.content;
        else if (Array.isArray(data?.data))               list = data.data;
        else if (Array.isArray(data?.data?.content))      list = data.data.content;
        else if (Array.isArray(data?.items))              list = data.items;
        else if (Array.isArray(data?.result))             list = data.result;

        setComments(list);
      })
      .finally(() => setLoading(false));
  }, [visible, postId]);

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
        prev.map((c) => c.id === temp.id ? { ...c, ...(saved ?? {}), _temp: false } : c)
      );
    } catch (e) {
      setComments((prev) => prev.filter((c) => c.id !== temp.id));
      setText(draft);
    } finally {
      setSending(false);
    }
  }, [text, sending, postId]);

  const handleQuickEmoji = useCallback((emoji) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const handleReply = useCallback((userName) => {
    setText(`@${userName} `);
    inputRef.current?.focus();
  }, []);

  const toggleCommentLike = useCallback((id) => {
    setLiked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const renderComment = useCallback(({ item }) => {
    const avatarUri   = item.user?.avatar ?? item.user?.avatarUrl ?? item.author?.avatar ?? null;
    const userName    = item.user?.name ?? item.user?.username ?? item.author?.name ?? item.userName ?? "User";
    const commentText = item.text ?? item.content ?? item.comment ?? item.body ?? "";
    const ts          = item.createdAt ?? item.timestamp ?? item.created_at ?? null;
    const isLikedC    = likedComments.includes(item.id);

    return (
      <View style={cs.row}>
        {/* Avatar with gradient ring */}
        <LinearGradient colors={["#7c4dff", "#ff4ea3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cs.ring}>
          <View style={cs.ringInner}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={cs.avatarImg} cachePolicy="memory-disk" />
              : <Text style={cs.avatarFallback}>👤</Text>
            }
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

        {/* Like heart */}
        <TouchableOpacity style={cs.heartBtn} onPress={() => toggleCommentLike(item.id)}>
          <Text style={[cs.heartIcon, isLikedC && cs.heartIconLiked]}>
            {isLikedC ? "❤️" : "🤍"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [likedComments, handleReply, toggleCommentLike]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Outer container anchors sheet to bottom */}
      <View style={cs.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={cs.sheet}>
          <LinearGradient colors={["#1e0a3c", "#16082a", "#0d0618"]} style={StyleSheet.absoluteFill} />

          {/* Top glow */}
          <LinearGradient colors={["#7c4dff", "#ff4ea3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cs.topGlow} />

          {/* Drag handle */}
          <View style={cs.handle} />

          {/* Header */}
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
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={cs.divider}
          />

          {/* Comment list — ScrollView avoids FlatList height-collapse on Android */}
          <ScrollView style={cs.list} showsVerticalScrollIndicator={false} nestedScrollEnabled>
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
                <View key={String(item.id ?? i)}>
                  {renderComment({ item })}
                </View>
              ))
            )}
          </ScrollView>

          {/* Quick emoji row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={cs.emojiBar}
            contentContainerStyle={cs.emojiBarContent}
          >
            {QUICK_EMOJIS.map((e) => (
              <TouchableOpacity key={e} style={cs.emojiBtn} onPress={() => handleQuickEmoji(e)} activeOpacity={0.7}>
                <Text style={cs.emojiTxt}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input row */}
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
                colors={text.trim() ? ["#7c4dff", "#ff4ea3"] : ["#2a2a3e", "#2a2a3e"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[cs.sendBtn, (!text.trim() || sending) && cs.sendBtnOff]}
              >
                {sending
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={cs.sendIcon}>➤</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={{ height: 14 }} />
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

const cs = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  topGlow: { height: 2 },
  handle: {
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center", marginTop: 12, marginBottom: 14,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 10,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  closeTxt: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  divider: { height: 1, marginBottom: 10 },

  loadingBox: { height: 160, alignItems: "center", justifyContent: "center" },
  list: { height: SCREEN_HEIGHT * 0.38 },
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
    flex: 1, borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1a0a2e",
    alignItems: "center", justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: { fontSize: 20 },
  bubble: { flex: 1, gap: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { color: "#e0ccff", fontSize: 13, fontWeight: "700" },
  timeText: { color: "rgba(255,255,255,0.35)", fontSize: 11 },
  commentText: { color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 20 },
  replyBtn: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 },
  heartBtn: { paddingTop: 2, paddingLeft: 4 },
  heartIcon: { fontSize: 16 },
  heartIconLiked: { fontSize: 16 },

  // Quick emoji bar
  emojiBar: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    marginTop: 4,
  },
  emojiBarContent: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 4,
  },
  emojiBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center", justifyContent: "center",
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(124,77,255,0.2)",
    alignItems: "center", justifyContent: "center",
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
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnOff: { opacity: 0.35 },
  sendIcon: { color: "#fff", fontSize: 15 },
});

const PostCard = memo(({ post, onMore, isFollowing, onFollowToggle, isLiked, onLikeToggle, onCommentPress, currentUserId, currentUserAvatarSource }) => {
  const isOwnPost = post?._isOwn === true || isOwnContent(post, currentUserId);
  const postAvatarSource =
    isOwnPost && currentUserAvatarSource
      ? currentUserAvatarSource
      : post.avatar
        ? { uri: post.avatar }
        : null;
  // Resolve media — prefer CDN URL, fall back to local URI picked from device
  const imageUri  = post.imageUrl      ?? post._localMediaUri ?? null;
  const hasImage  = imageUri && (post._mediaType !== "video" && !post.hasVideo);
  const hasVideo  = post.hasVideo || post._mediaType === "video";
  const videoUri  = hasVideo ? (post.videoUrl ?? post._localMediaUri ?? null) : null;

  return (
  <View style={styles.postOuter}>
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {postAvatarSource
          ? <Image source={postAvatarSource} style={styles.postAvatar} transition={200} cachePolicy="memory-disk" />
          : <View style={[styles.postAvatar, styles.postAvatarPlaceholder]}>
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                {(post.name ?? "?")[0].toUpperCase()}
              </Text>
            </View>
        }
        <Text style={styles.postName}>{post.name ?? "User"}</Text>
        {!isOwnPost && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={() => onFollowToggle?.(post.userId)}
            activeOpacity={0.75}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? "✓ Following" : "👤 Follow"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.moreBtn} onPress={() => onMore?.(post)}>
          <Text style={styles.moreBtnText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Text / caption */}
      {!!post.text && (
        <Text style={styles.postText} numberOfLines={4}>
          {post.text}{" "}
          <Text style={styles.moreText}>More</Text>
        </Text>
      )}

      {/* Image */}
      {hasImage && (
        <Image
          source={{ uri: imageUri }}
          style={styles.postImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      )}

      {/* Video */}
      {hasVideo && (
        <View style={styles.videoBox}>
          <View style={styles.playBtn}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
          {post.duration && <Text style={styles.videoDuration}>{post.duration}</Text>}
        </View>
      )}

      {/* ── POST FOOTER: Like + Comment ── */}
      <View style={styles.postFooter}>
        <View style={styles.postFooterLeft}>
          {(post.likeCount ?? 0) > 0 && (
            <Text style={styles.postLikeCount}>
              ❤️ {post.likeCount}
            </Text>
          )}
        </View>
        <View style={styles.postFooterRight}>
          <TouchableOpacity
            style={[styles.postActionBtn, isLiked && styles.postActionBtnLiked]}
            onPress={() => onLikeToggle?.(post.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.postActionEmoji}>{isLiked ? "❤️" : "🤍"}</Text>
            <Text style={[styles.postActionLabel, isLiked && { color: "#ff4ea3" }]}>Like</Text>
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
});

const RecommendedUserItem = memo(({ user }) => (
  <TouchableOpacity style={styles.recommendItem} activeOpacity={0.8}>
    <LinearGradient
      colors={["#7c4dff", "#ff4ea3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.recommendAvatarRing}
    >
      {user.avatar ? (
        <Image source={{ uri: user.avatar }} style={styles.recommendAvatar} cachePolicy="memory-disk" transition={150} />
      ) : (
        <View style={[styles.recommendAvatar, styles.recommendAvatarPlaceholder]}>
          <Text style={styles.recommendInitial}>{user.name?.[0]?.toUpperCase() ?? "?"}</Text>
        </View>
      )}
    </LinearGradient>
    <Text style={styles.recommendName} numberOfLines={1}>{user.name}</Text>
  </TouchableOpacity>
));

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
          const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_SLIDE_WIDTH);
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
            style={[styles.bannerDot, activeBanner === i && styles.bannerDotActive]}
          />
        ))}
      </View>
    </View>
  );
});

// All content above the feed — memoized so it only re-renders when
// its specific props change (e.g. diamonds update, tab switch)
const HomeHeader = memo(({
  userProfile,
  sessionAvatarSource,
  stats,
  unreadNotifications,
  recommendedUsers,
  selectedTab,
  tabScales,
  tabUnderlineScales,
  onTabPress,
  onSearchOpen,
  onNotifOpen,
  onGiftsOpen,
  onNearbyPress,
  onComingSoon,
  router,
}) => (
  <>
    {/* ── HEADER CARD ── */}
    <View style={styles.headerCard}>
      <View style={styles.headerTopRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={
              sessionAvatarSource ??
              (userProfile?.avatarUrl
                ? { uri: userProfile.avatarUrl }
                : require("../../assets/images/splash-icon.png"))
            }
            style={styles.headerAvatar}
            cachePolicy="memory-disk"
            contentFit="cover"
          />
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.headerTitleCol}>
          <View style={styles.appNameWrapper}>
            {/* Thin #7f3f89 outline — 8 directions at 1px */}
            {[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx, dy], i) => (
              <Text key={i} style={[styles.appName, styles.appNameOutline, { position: "absolute", left: dx, top: dy }]}>
                Tuk Tuk
              </Text>
            ))}
            {/* White text on top */}
            <Text style={styles.appName}>Tuk Tuk</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <View style={styles.diamondPill}>
            <Text style={styles.diamondEmoji}>💎</Text>
            <Text style={styles.diamondCount}>{userProfile?.diamonds?.toLocaleString() ?? "..."}</Text>
          </View>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.8} onPress={onGiftsOpen}>
            <Text style={styles.headerIconEmoji}>🎁</Text>
            <View style={[styles.headerIconBadge, { backgroundColor: "#ff3f72" }]}>
              <Text style={styles.headerIconBadgeText}>!</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.8} onPress={onNotifOpen}>
            <Text style={styles.headerIconEmoji}>🔔</Text>
            <View style={[styles.headerIconBadge, { backgroundColor: "#7c4dff" }]}>
              <Text style={styles.headerIconBadgeText}>{unreadNotifications.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.headerDivider} />

      <View style={styles.activeRow}>
        <TouchableOpacity
          style={styles.matchPill}
          activeOpacity={0.85}
          onPress={() => router.push("/chat")}
        >
          <Image
            source={{ uri: stats?.featuredUserAvatar ?? "https://randomuser.me/api/portraits/men/45.jpg" }}
            style={styles.matchAvatar}
            cachePolicy="memory-disk"
            transition={200}
          />
          <View style={styles.matchWaves}>
            {MATCH_WAVE_HEIGHTS.map((h, i) => (
              <View key={i} style={[styles.matchWaveBar, { height: h }]} />
            ))}
          </View>
          <View style={styles.activeTextCol}>
            <Text style={styles.activeNumber}>{stats?.activeUsers?.toLocaleString() ?? "..."}</Text>
            <Text style={styles.activeLabel}>Active now</Text>
          </View>
          <View style={styles.matchArrow}>
            <ChevronRight size={14} color="white" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8} onPress={onSearchOpen}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* ── 2×2 ACTION CARDS ── */}
    <View style={styles.actionGrid}>
      {actionCards.map((card) => (
        <TouchableOpacity
          key={card.title}
          style={styles.actionCard}
          activeOpacity={0.88}
          onPress={() => {
            if (card.partyRandom) {
              router.push({ pathname: "/voice-party", params: { party: "true" } });
            } else if (card.title === "Nearby" && onNearbyPress) {
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
            style={styles.actionCardGradient}
          >
            <Text style={styles.cardTitle}>{card.title}</Text>
            {card.subtitle && <Text style={styles.cardSubtitle}>{card.subtitle}</Text>}
            {card.showWave && (
              <View style={styles.waveRow}>
                {WAVE_HEIGHTS.map((h, wi) => (
                  <View key={wi} style={[styles.waveBar, { height: h }]} />
                ))}
              </View>
            )}
            <StaggeredImage
              source={typeof card.img === "string" ? { uri: card.img } : card.img}
              style={[styles.cardIllustration, card.imgSize && { width: card.imgSize, height: card.imgSize }]}
              contentFit="contain"
              delay={card.gifDelay}
            />
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>

    {/* ── ICON ROW ── */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.iconScroll}
      style={styles.iconContainer}
    >
      {iconItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.iconItem}
          activeOpacity={0.8}
          onPress={item.comingSoon ? () => onComingSoon?.(item.label.replace(/\n/g, " ")) : undefined}
        >
          <LinearGradient
            colors={item.colors}
            style={styles.iconBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image
              source={typeof item.img === "string" ? { uri: item.img } : item.img}
              style={[styles.iconImg, item.imgSize && { width: item.imgSize, height: item.imgSize }]}
              contentFit="contain"
            />
          </LinearGradient>
          <Text style={styles.iconLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>

    {/* ── TABS ── */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsScroll}
      style={styles.tabsBar}
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
              { transform: [{ scaleX: tabUnderlineScales[tab] }], opacity: tabUnderlineScales[tab] },
            ]}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>

    {/* ── RECOMMENDED USERS ── */}
    <View style={styles.recommendSection}>
      <Text style={styles.recommendTitle}>Recommend user in the room</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recommendScroll}
      >
        {recommendedUsers.map((user) => (
          <RecommendedUserItem key={user.id} user={user} />
        ))}
      </ScrollView>
    </View>
  </>
));

// ─────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("For You");
  const [activeBanner, setActiveBanner] = useState(0);

  // ── Data state ────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [stats, setStats] = useState(null);
  const [bannerSlides, setBannerSlides] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);

  // Ref keeps followingIds in sync for stable callbacks (avoids stale closures)
  const followingIdsRef = useRef([]);

  // ── Modal state ───────────────────────────────────────────
  const [searchVisible, setSearchVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [giftsVisible, setGiftsVisible] = useState(false);
  const [moreMenuPost, setMoreMenuPost] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);
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
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [sessionAvatarSource, setSessionAvatarSource] = useState(null);
  const [comingSoonFeature, setComingSoonFeature] = useState(null);

  const syncSessionAvatar = useCallback(async () => {
    try {
      const user = await getUser();
      setSessionAvatarSource(resolveProfileAvatarSource(user));
    } catch {
      setSessionAvatarSource(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncSessionAvatar();
    }, [syncSessionAvatar])
  );

  const handleNearbyPress = useCallback(async () => {
    const coords = await getDeviceCoordinates();
    if (!coords.ok) {
      if (coords.reason === "module_unavailable") {
        setToastMessage("Location unavailable. Rebuild the app: npx expo run:android");
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
    TABS.reduce((acc, t) => { acc[t] = new Animated.Value(1); return acc; }, {})
  ).current;
  const tabUnderlineScales = useRef(
    TABS.reduce((acc, t) => { acc[t] = new Animated.Value(t === "For You" ? 1 : 0); return acc; }, {})
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
      .catch(() => {});

    syncSessionAvatar();

    const task = InteractionManager.runAfterInteractions(() => {
      homeService.getHomeData()
        .then(async (data) => {
          let sessionUserId = currentUserId;
          try {
            sessionUserId = String(await getAppUserId());
            setCurrentUserId(sessionUserId);
          } catch {
            const profileId = data.userProfile?.userId ?? data.userProfile?.id ?? null;
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
            (data.feedPosts ?? []).map((post) => ({
              ...post,
              _isOwn: sessionUserId ? isOwnContent(post, sessionUserId) : false,
            }))
          );
          setFeedHasMore(data.feedHasMore ?? false);
          setNotifications(data.notifications);
          setGifts(data.gifts);
          setWallet(data.wallet);
          setSearchSuggestions(data.searchSuggestions);
          setTrendingTags(data.trendingTags);
          // Use server unreadCount when available, fall back to local filter
          if (data.unreadCount > 0) {
            setUnreadNotifications(
              (data.notifications ?? []).filter((n) => n.unread).map((n) => n.id)
            );
          } else {
            setUnreadNotifications([]);
          }
        })
        .catch(() => {});

      // Load following + followers in parallel after home data
      Promise.all([loadFollowing(), loadFollowers()])
        .then(([followingArr, followersArr]) => {
          const ids = followingArr.map((u) => u.userId ?? u.id).filter(Boolean);
          followingIdsRef.current = ids;
          setFollowingIds(ids);
          setFollowingList(followingArr);
          setFollowersList(followersArr);
        })
    });
    return () => task.cancel();
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
    console.log(`[Home] loading feed for tab: ${tab}`);
    try {
      const res = await homeService.refreshFeed(tab);
      const uid = currentUserIdRef.current;
      setFeedPosts(
        (res.posts ?? []).map((post) => ({
          ...post,
          _isOwn: uid ? isOwnContent(post, uid) : false,
        }))
      );
      setFeedHasMore(res.hasMore ?? false);
      console.log(`[Home] tab "${tab}" loaded ${res.posts?.length ?? 0} posts`);
    } catch (err) {
      console.log(`[Home] tab "${tab}" feed load failed:`, err?.message);
      setFeedPosts([]);
      setFeedHasMore(false);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const handleTabPress = useCallback((tab) => {
    const prev = selectedTabRef.current;
    if (tab === prev) return;
    Animated.timing(tabUnderlineScales[prev], { toValue: 0, duration: 150, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(tabScales[tab], { toValue: 0.82, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.spring(tabScales[tab], { toValue: 1, tension: 260, friction: 7, useNativeDriver: true }),
    ]).start();
    Animated.timing(tabUnderlineScales[tab], { toValue: 1, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }).start();
    setSelectedTab(tab);
    loadTabFeed(tab);
  }, [tabScales, tabUnderlineScales, loadTabFeed]);

  const handleMarkAllRead = useCallback(async () => {
    setUnreadNotifications([]);
    await homeService.markAllNotificationsRead().catch(() => {});
  }, []);

  const handleSearchQuery = useCallback((text) => {
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
      if (card.title.toLowerCase().includes(query) || card.subtitle.toLowerCase().includes(query)) {
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
        results.push({ id: item.label, title: item.label, type: "icon", colors: item.colors });
      }
    });
    searchSuggestions.forEach((suggestion) => {
      if (suggestion.toLowerCase().includes(query) && !results.some((r) => r.title === suggestion)) {
        results.push({ id: suggestion, title: suggestion, type: "suggestion" });
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
            colors: ["#3d1a6e", "#5b2d8e"],
          }));
        // Keep feature matches, replace any previous user rows.
        setSearchResults((prev) => [...prev.filter((r) => r.type !== "user"), ...userResults]);
      } catch (err) {
        console.log("[Home] people search failed:", err?.message);
      }
    }, 350);
  }, [searchSuggestions]);

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
      isOnline: Boolean(result.subtitle && result.subtitle.includes("Online")),
    });
    setSearchProfileLoading(true);
    try {
      const detail = await homeService.getUserDetailById(result.userId);
      setSearchProfile((prev) => ({
        ...prev,
        ...detail,
        userId: result.userId,
        name: detail?.name ?? prev?.name,
        avatar: detail?.avatar ?? prev?.avatar,
      }));
    } catch (err) {
      console.log("[Home] load search profile failed:", err?.message);
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
      setFeedPosts((prev) => [
        ...prev,
        ...(more.posts ?? []).map((post) => ({
          ...post,
          _isOwn: currentUserId ? isOwnContent(post, currentUserId) : false,
        })),
      ]);
      setFeedHasMore(more.hasMore ?? false);
      setFeedPage(nextPage);
    } catch (e) {
    } finally {
      setFeedLoading(false);
    }
  }, [feedHasMore, feedLoading, feedPage, selectedTab, currentUserId]);

  const handleMorePress = useCallback((post) => setMoreMenuPost(post), []);
  const handleMoreClose = useCallback(() => setMoreMenuPost(null), []);

  // Follow / Unfollow — optimistic toggle backed by ref so callback is stable
  const handleFollowToggle = useCallback(async (userId) => {
    if (!userId) return;
    if (isSameUser(userId, currentUserId)) return;

    const targetId = String(userId);
    const wasFollowing = followingIdsRef.current.some((id) => isSameUser(id, targetId));
    console.log(
      `[Home] follow toggle userId=${targetId} wasFollowing=${wasFollowing}`
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
      console.log(`[Home] follow toggle success userId=${targetId}`);
    } catch (e) {
      console.log(`[Home] follow toggle failed userId=${targetId}:`, e?.message);
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
  }, [currentUserId]);

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
    setFeedPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, likeCount: (p.likeCount ?? 0) + (wasLiked ? -1 : 1) }
        : p
    ));
    try {
      if (wasLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch (e) {
      // Revert on failure
      const reverted = wasLiked
        ? [...likedPostIdsRef.current, postId]
        : likedPostIdsRef.current.filter((id) => id !== postId);
      likedPostIdsRef.current = reverted;
      setLikedPostIds([...reverted]);
      setFeedPosts((prev) => prev.map((p) =>
        p.id === postId
          ? { ...p, likeCount: (p.likeCount ?? 0) + (wasLiked ? 1 : -1) }
          : p
      ));
    }
  }, []);

  const handleCommentPress = useCallback((postId) => {
    setCommentPostId(postId);
  }, []);

  const handlePostSubmit = useCallback(async ({ caption, media, mediaUri, mediaType }) => {
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
        }))
      );
      setFeedHasMore(fresh.hasMore ?? false);
      setFeedPage(1);
    };

    let newPost = null;
    try {
      newPost = await createPost({ caption, media, mediaUri, mediaType });
    } catch (e) {
      console.log("[Home] create post failed:", e?.message);
      await refreshFeed().catch(() => {});
      throw e;
    }

    // Normalize backend response so the optimistic item matches our feed shape
    let sessionUserId = currentUserId;
    try {
      sessionUserId = String(await getAppUserId());
    } catch {
      // keep existing currentUserId
    }

    const normalized = {
      id:        newPost?.id        ?? newPost?.postId  ?? `local-${Date.now()}`,
      userId:    newPost?.userId    ?? newPost?.authorId ?? sessionUserId ?? null,
      name:      newPost?.name      ?? newPost?.username  ?? newPost?.authorName ?? "You",
      avatar:    newPost?.avatar    ?? newPost?.profileImage ?? newPost?.authorAvatar ?? null,
      text:      newPost?.text      ?? newPost?.caption  ?? newPost?.content ?? caption ?? "",
      imageUrl:  newPost?.imageUrl  ?? newPost?.mediaUrl ?? newPost?.image ?? mediaUri ?? null,
      hasVideo:  mediaType === "video",
      duration:  newPost?.duration  ?? null,
      likeCount: newPost?.likeCount ?? newPost?.likes ?? 0,
      _localMediaUri: mediaUri ?? null,
      _mediaType:     mediaType ?? null,
      _isOwn:         true,
    };

    // Optimistically prepend so the post appears instantly while the refresh is in-flight
    setFeedPosts((prev) => [normalized, ...prev]);

    // Refresh GET /api/home/feed?tab=for_you&page=1&limit=10 — new post will be on top
    await refreshFeed().catch(() => {});
  }, [currentUserId]);

  // Block — removes user's posts from feed immediately
  const handleBlockUser = useCallback(async (userId, userName) => {
    if (!userId) return;
    if (isSameUser(userId, currentUserId)) return;
    console.log("[Home] block user:", String(userId), userName ?? "");
    try {
      const response = await blockUser(userId);
      console.log(
        "[Home] block success:",
        JSON.stringify(response, null, 2)
      );
      setFeedPosts((prev) => prev.filter((p) => p.userId !== userId));
    } catch (e) {
      console.log("[Home] block failed:", e?.message);
      Alert.alert("Block failed", e?.message || "Please try again.");
    }
  }, [currentUserId]);

  const handleDeletePost = useCallback(async (postId) => {
    if (!postId) return;
    // Optimistically remove from feed immediately
    setFeedPosts((prev) => prev.filter((p) => p.id !== postId));
    setMoreMenuPost(null);
    try {
      await deletePost(postId);
    } catch (e) {
      // If delete fails, we could re-fetch but for now the optimistic removal stays
    }
  }, []);

  const openSearch  = useCallback(() => setSearchVisible(true), []);
  const openNotif   = useCallback(() => setNotifVisible(true), []);
  const openGifts   = useCallback(() => setGiftsVisible(true), []);
  const closeSearch = useCallback(() => { setSearchVisible(false); setSearchQuery(""); }, []);
  const closeNotif  = useCallback(() => setNotifVisible(false), []);
  const closeGifts  = useCallback(() => setGiftsVisible(false), []);
  const handleBannerChange = useCallback((idx) => setActiveBanner(idx), []);

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

  const renderFeedItem = useCallback(({ item }) => {
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
        currentUserId={currentUserId}
        currentUserAvatarSource={sessionAvatarSource}
      />
    );
  }, [bannerSlides, activeBanner, handleBannerChange, handleMorePress, followingIds, handleFollowToggle, likedPostIds, handleLikeToggle, handleCommentPress, currentUserId, sessionAvatarSource]);

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
  const listHeader = useMemo(() => (
    <HomeHeader
      userProfile={userProfile}
      sessionAvatarSource={sessionAvatarSource}
      stats={stats}
      unreadNotifications={unreadNotifications}
      recommendedUsers={recommendedUsers}
      selectedTab={selectedTab}
      tabScales={tabScales}
      tabUnderlineScales={tabUnderlineScales}
      onTabPress={handleTabPress}
      onSearchOpen={openSearch}
      onNotifOpen={openNotif}
      onGiftsOpen={openGifts}
      onNearbyPress={handleNearbyPress}
      onComingSoon={setComingSoonFeature}
      router={router}
    />
  ), [userProfile, sessionAvatarSource, stats, unreadNotifications, recommendedUsers, selectedTab,
      handleTabPress, openSearch, openNotif, openGifts, handleNearbyPress, router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e", "#2d1b4e"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbPink} />
      <View style={styles.orbPurple} />

      {/* Outer FlatList gives true virtualization to the feed —
          only posts near the viewport are kept in memory */}
      <FlatList
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
          feedLoading
            ? <ActivityIndicator color="#7c4dff" style={{ marginVertical: 16 }} />
            : null
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
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeSearch} />
          {searchVisible && (
            <View style={styles.searchPanel}>
              <LinearGradient
                colors={["#1e0a3c", "#2d1b4e"]}
                style={StyleSheet.absoluteFill}
                borderRadius={24}
              />
              <View style={styles.searchHeader}>
                <Text style={styles.searchPanelTitle}>Search</Text>
                <TouchableOpacity onPress={closeSearch} style={styles.searchCloseBtn}>
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
                  <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                    <Text style={styles.searchClearBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {searchResults.length > 0 ? (
                <View style={styles.searchResultsSection}>
                  <Text style={styles.searchSuggestLabel}>Search Results</Text>
                  {searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.id}
                      style={styles.searchResultItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (result.type === "user") {
                          handleOpenSearchUser(result);
                        } else if (result.partyRandom) {
                          router.push({ pathname: "/voice-party", params: { party: "true" } });
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
                        <Image source={{ uri: result.avatar }} style={styles.resultIconBox} contentFit="cover" />
                      ) : (
                        <LinearGradient
                          colors={result.colors || ["#3d1a6e", "#5b2d8e"]}
                          style={styles.resultIconBox}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.resultIcon}>
                            {result.type === "action" ? "🎮" : result.type === "user" ? "👤" : "✨"}
                          </Text>
                        </LinearGradient>
                      )}
                      <View style={styles.resultTextCol}>
                        <Text style={styles.resultTitle}>{result.title}</Text>
                        {result.subtitle && <Text style={styles.resultSubtitle}>{result.subtitle}</Text>}
                      </View>
                      <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : searchQuery.length === 0 ? (
                <>
                  <View style={styles.searchSuggestSection}>
                    <Text style={styles.searchSuggestLabel}>Quick explore</Text>
                    <View style={styles.searchSuggestRow}>
                      {searchSuggestions.map((s) => (
                        <TouchableOpacity key={s} style={styles.searchChip} activeOpacity={0.8}>
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
                    <Text style={styles.searchSuggestLabel}>Trending now 🔥</Text>
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
                    Try searching for features like Voice Party, Games, or People
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
          <TouchableOpacity style={styles.giftBackdrop} activeOpacity={1} onPress={closeGifts} />
          {giftsVisible && (
            <SafeAreaView style={styles.giftsPanel}>
              <LinearGradient
                colors={["#1a0a2e", "#16082a", "#0d0618"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.giftsHeader}>
                <Text style={styles.giftsTitle}>Daily Gifts</Text>
                <TouchableOpacity onPress={closeGifts} style={styles.giftCloseBtn}>
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
                      <Text style={styles.freeGiftSubtitle}>Claim one free gift every 24 hours</Text>
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
                    <TouchableOpacity key={gift.id} style={styles.giftCard} activeOpacity={0.85}>
                      <LinearGradient
                        colors={gift.colors}
                        style={styles.giftCardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                        <Text style={styles.giftName}>{gift.name}</Text>
                        <Text style={styles.giftValue}>+{gift.value}</Text>
                        <Text style={styles.giftDescription}>{gift.description}</Text>
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
          <TouchableOpacity style={styles.notifBackdrop} activeOpacity={1} onPress={closeNotif} />
          {notifVisible && (
            <SafeAreaView style={styles.notifPanel}>
              <LinearGradient
                colors={["#1a0a2e", "#16082a", "#0d0618"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>Notifications</Text>
                <View style={styles.notifHeaderRight}>
                  <TouchableOpacity style={styles.notifMarkAll} onPress={handleMarkAllRead}>
                    <Text style={styles.notifMarkAllText}>Mark all read</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeNotif} style={styles.notifCloseBtn}>
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
                {notifications.map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      styles.notifItem,
                      unreadNotifications.includes(notif.id) && styles.notifItemUnread,
                    ]}
                    activeOpacity={0.8}
                  >
                    {unreadNotifications.includes(notif.id) && (
                      <View style={styles.unreadDot} />
                    )}
                    {notif.avatar ? (
                      <View style={styles.notifAvatarWrapper}>
                        <Image source={{ uri: notif.avatar }} style={styles.notifAvatar} cachePolicy="memory-disk" transition={150} />
                        <View style={styles.notifIconBubble}>
                          <Text style={styles.notifIconBubbleTxt}>{notif.icon}</Text>
                        </View>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={["#3d1a6e", "#7c4dff"]}
                        style={styles.notifSystemIcon}
                      >
                        <Text style={{ fontSize: 20 }}>{notif.icon}</Text>
                      </LinearGradient>
                    )}
                    <View style={styles.notifTextCol}>
                      <Text style={styles.notifItemTitle}>{notif.title}</Text>
                      <Text style={styles.notifItemSub} numberOfLines={1}>{notif.subtitle}</Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
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
        currentUserId={currentUserId}
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
                <Image source={{ uri: searchProfile.avatar }} style={styles.searchProfileAvatar} contentFit="cover" />
              ) : (
                <Text style={styles.searchProfileEmoji}>👤</Text>
              )}
              {searchProfile?.isOnline && <View style={styles.searchProfileOnlineDot} />}
            </LinearGradient>

            <TouchableOpacity style={styles.searchProfileClose} onPress={() => setSearchProfile(null)}>
              <Text style={styles.searchProfileCloseTxt}>✕</Text>
            </TouchableOpacity>

            <View style={styles.searchProfileBody}>
              <View style={styles.searchProfileNameRow}>
                <Text style={styles.searchProfileName} numberOfLines={1}>
                  {searchProfile?.name ?? "User"}
                </Text>
                {searchProfile?.vip && <Text style={styles.searchProfileVip}>👑 VIP</Text>}
              </View>

              <View style={styles.searchProfileMetaRow}>
                {searchProfile?.level != null && (
                  <View style={styles.searchProfileBadge}>
                    <Text style={styles.searchProfileBadgeTxt}>Lv {searchProfile.level}</Text>
                  </View>
                )}
                {searchProfile?.status && (
                  <View style={styles.searchProfileBadge}>
                    <Text style={styles.searchProfileBadgeTxt}>{searchProfile.status}</Text>
                  </View>
                )}
                {searchProfileLoading && <ActivityIndicator size="small" color="#a78bfa" />}
              </View>

              {searchProfile?.bio ? (
                <Text style={styles.searchProfileBio} numberOfLines={3}>{searchProfile.bio}</Text>
              ) : null}

              <TouchableOpacity style={styles.searchProfileMsgBtn} onPress={handleMessageSearchProfile} activeOpacity={0.85}>
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
    backgroundColor: "#0d0618",
  },

  // ── Searched user profile modal ──
  searchProfileWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 28 },
  searchProfileCard: { width: "100%", maxWidth: 360, backgroundColor: "#1a0a2e", borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(167,139,250,0.3)" },
  searchProfileHero: { width: "100%", height: 170, alignItems: "center", justifyContent: "center" },
  searchProfileAvatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: "rgba(255,255,255,0.25)" },
  searchProfileEmoji: { fontSize: 70 },
  searchProfileOnlineDot: { position: "absolute", bottom: 20, right: "37%", width: 16, height: 16, borderRadius: 8, backgroundColor: "#00e676", borderWidth: 3, borderColor: "#1a0a2e" },
  searchProfileClose: { position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  searchProfileCloseTxt: { color: "white", fontSize: 15, fontWeight: "700" },
  searchProfileBody: { padding: 18, gap: 10 },
  searchProfileNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchProfileName: { color: "white", fontSize: 20, fontWeight: "900", flexShrink: 1 },
  searchProfileVip: { color: "#ffd700", fontSize: 13, fontWeight: "800" },
  searchProfileMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchProfileBadge: { backgroundColor: "rgba(124,77,255,0.3)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(167,139,250,0.4)" },
  searchProfileBadgeTxt: { color: "#c4b5fd", fontSize: 11, fontWeight: "700" },
  searchProfileBio: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 19 },
  searchProfileMsgBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  searchProfileMsgGradient: { paddingVertical: 13, alignItems: "center" },
  searchProfileMsgTxt: { color: "white", fontSize: 15, fontWeight: "800" },

  // Background orbs (same as login)
  orbPink: {
    position: "absolute",
    width: 300,
    height: 300,
    top: -80,
    left: -80,
    borderRadius: 150,
    backgroundColor: "rgba(255,0,128,0.18)",
    shadowColor: "#ff0080",
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
    shadowColor: "#8a2be2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },

  // Header glass card
  headerCard: {
    marginTop: 20,
    marginHorizontal: H_PAD,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginTop: -8,
    marginBottom: -4,
  },
  headerAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#00e676",
    borderWidth: 2,
    borderColor: "#1a0a2e",
  },
  headerTitleCol: {
    flex: 1,
  },
  helloText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  appName: {
    fontSize: 22,
    fontWeight: "900",
    color: "white",
    lineHeight: 26,
  },
  appNameWrapper: {
    position: "relative",
    alignSelf: "flex-start",
  },
  appNameOutline: {
    color: "#7f3f89",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diamondPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(80,50,160,0.6)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.5)",
    gap: 3,
  },
  diamondEmoji: { fontSize: 12 },
  diamondCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconEmoji: { fontSize: 16 },
  headerIconBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: "#0d0618",
  },
  headerIconBadgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "800",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  // Active now row
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d63384",
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 7,
  },
  matchAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  matchWaves: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  matchWaveBar: {
    width: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 2,
  },
  activeTextCol: {
    flex: 1,
  },
  activeNumber: {
    color: "#4eff91",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
  },
  activeLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    lineHeight: 14,
  },
  matchArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: { fontSize: 18 },

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
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  feedStateSubtitle: {
    color: "rgba(255,255,255,0.55)",
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
    marginBottom: 14,
    justifyContent: "center",
  },
  actionCard: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.15,
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
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 4,
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
  iconContainer: { marginBottom: 14 },
  iconScroll: {
    paddingHorizontal: H_PAD,
    gap: 14,
  },
  iconItem: {
    alignItems: "center",
    width: 76,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImg: { width: 44, height: 44 },
  iconLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 14,
  },

  // Tabs
  tabsBar: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  tabsScroll: {
    paddingHorizontal: H_PAD,
    gap: 22,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: "center",
    paddingBottom: 2,
  },
  tabText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 15,
    fontWeight: "500",
  },
  tabActive: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  tabUnderline: {
    width: "100%",
    height: 3,
    backgroundColor: "#7c4dff",
    borderRadius: 3,
    marginTop: 6,
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
    backgroundColor: "rgba(255,255,255,0.04)",
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
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  postAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 10,
    marginTop: 8,
  },
  postName: {
    color: "white",
    fontSize: 14,
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
    paddingTop: 10,
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
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },
  postActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  postActionBtnLiked: {
    backgroundColor: "rgba(255,78,163,0.12)",
    borderColor: "rgba(255,78,163,0.35)",
  },
  postActionEmoji: {
    fontSize: 14,
  },
  postActionLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  moreBtn: { paddingHorizontal: 4 },
  moreBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 18,
    letterSpacing: 1,
  },
  postText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
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
    paddingHorizontal: H_PAD,
    marginBottom: 16,
    marginTop: 4,
  },
  recommendTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  recommendScroll: {
    gap: 16,
    paddingRight: 8,
  },
  recommendItem: {
    alignItems: "center",
    width: 76,
  },
  recommendAvatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    marginBottom: 8,
  },
  recommendAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 33,
  },
  recommendAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendInitial: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },
  recommendName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
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
    fontSize: 18,
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
    backgroundColor: "rgba(255,255,255,0.3)",
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
    top: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7c4dff",
  },
  notifAvatarWrapper: {
    width: 50,
    height: 50,
    position: "relative",
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
    backgroundColor: "#1a0a2e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.4)",
  },
  notifIconBubbleTxt: { fontSize: 12 },
  notifSystemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTextCol: { flex: 1 },
  notifItemTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  notifItemSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    marginBottom: 4,
  },
  notifTime: {
    color: "#7c4dff",
    fontSize: 11,
    fontWeight: "600",
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
  resultTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
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
