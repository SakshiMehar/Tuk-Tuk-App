import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MoreHorizontal } from "lucide-react-native";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";
import { VIP_PROFILE_FRAME_LAYOUT } from "../src/constants/vip";

// Absolute date (matches the reference design) rather than a relative
// "2h ago" style — only shown when the post actually carries a timestamp,
// never a fabricated one.
const formatPostDate = (post) => {
  const raw = post?.createdAt ?? post?.timestamp ?? post?.postedAt ?? post?.date ?? null;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
};

/**
 * Full-screen viewer for a feed post's photo(s) — opened by tapping an
 * image in the feed. Shows the whole picture uncropped (contentFit="contain"
 * has no downside here, unlike the feed thumbnail, since a dedicated viewer
 * is expected to have letterbox padding around the photo), swipes between
 * photos for multi-photo posts, plus the same author / follow / like /
 * comment affordances as the feed card so the viewer doesn't lose context.
 */
export default function PostImageViewer({
  visible,
  data,
  isFollowing,
  isLiked,
  onClose,
  onFollowToggle,
  onLikeToggle,
  onCommentPress,
  onMore,
  onAvatarPress,
}) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const post = data?.post ?? null;
  const imageUrls = data?.imageUrls?.length
    ? data.imageUrls
    : post?.imageUrl
      ? [post.imageUrl]
      : post?._localMediaUri
        ? [post._localMediaUri]
        : [];
  const startIndex = Math.min(data?.startIndex ?? 0, Math.max(0, imageUrls.length - 1));

  // Component stays mounted across opens (only `visible` toggles), so reset
  // to the tapped photo — without an animated scroll flash — every time a
  // (possibly different) post is opened, rather than carrying over whatever
  // page the previous post was left on. Keyed on post?.id rather than the
  // whole `post` object on purpose — reacting to every new object reference
  // (not just an actual post change) would re-jump the scroll unnecessarily.
  useEffect(() => {
    if (!visible || !post) return;
    setActiveIndex(startIndex);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: startIndex * screenWidth, animated: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, post?.id, startIndex, screenWidth]);

  if (!visible || !post) return null;

  const postDate = formatPostDate(post);
  const commentCount = post.commentCount ?? post.commentsCount ?? post.totalComments ?? 0;
  const { avatarSource, frameSource, isOwnVipFrame, isOwnPost } = data;

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {imageUrls.length > 1 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const w = e.nativeEvent.layoutMeasurement.width || 1;
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / w));
          }}
          style={StyleSheet.absoluteFill}
        >
          {imageUrls.map((uri) => (
            <Image
              key={uri}
              source={{ uri }}
              style={{ width: screenWidth, height: "100%" }}
              contentFit="contain"
              transition={150}
            />
          ))}
        </ScrollView>
      ) : imageUrls[0] ? (
        <Image
          source={{ uri: imageUrls[0] }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={150}
        />
      ) : null}

      <LinearGradient
        colors={["rgba(0,0,0,0.75)", "transparent"]}
        style={[styles.topScrim, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={onClose}>
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.pager}>{activeIndex + 1}/{imageUrls.length || 1}</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => onMore?.(post)}>
          <MoreHorizontal size={20} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={[styles.bottomScrim, { paddingBottom: insets.bottom + 14 }]}
      >
        <View style={styles.userRow}>
          <TouchableOpacity style={styles.userInfo} activeOpacity={0.8} onPress={onAvatarPress}>
            {avatarSource ? (
              <ProfileAvatarWithFrame
                avatarSource={avatarSource}
                frameSource={frameSource}
                size={40}
                avatarStyle={styles.avatar}
                imageComponent={Image}
                {...(isOwnVipFrame
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
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {(post.name ?? "?")[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.username} numberOfLines={1}>{post.name ?? "User"}</Text>
              {postDate && <Text style={styles.date}>{postDate}</Text>}
            </View>
          </TouchableOpacity>

          {!isOwnPost && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              activeOpacity={0.85}
              onPress={() => onFollowToggle?.(post.userId)}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                {isFollowing ? "✓ Following" : "👤 Follow"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => onLikeToggle?.(post.id)}
          >
            <Text style={styles.actionEmoji}>{isLiked ? "❤️" : "🤍"}</Text>
            <Text style={styles.actionCount}>{post.likeCount ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => onCommentPress?.(post.id)}
          >
            <Text style={styles.actionEmoji}>💬</Text>
            <Text style={styles.actionCount}>{commentCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sayBar}
            activeOpacity={0.8}
            onPress={() => onCommentPress?.(post.id)}
          >
            <Text style={styles.sayText}>Say something</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 50,
    elevation: 50,
  },
  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  pager: { color: "white", fontSize: 15, fontWeight: "700" },
  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 30,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: { color: "white", fontSize: 15, fontWeight: "700" },
  username: { color: "white", fontSize: 15, fontWeight: "800" },
  date: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  followBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  followBtnActive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#7c4dff",
  },
  followBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
  followBtnTextActive: { color: "#b388ff" },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  actionEmoji: { fontSize: 16 },
  actionCount: { color: "white", fontSize: 13, fontWeight: "600" },
  sayBar: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  sayText: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
});
