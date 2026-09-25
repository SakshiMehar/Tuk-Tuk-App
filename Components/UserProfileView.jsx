import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  MoreHorizontal,
  Copy,
  Flag,
  UserX,
  UserPlus,
  UserCheck,
  Tag,
} from "lucide-react-native";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";
import ReportReasonModal from "./ReportReasonModal";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import {
  VIP_PROFILE_FRAME_LAYOUT,
  VIP_TIER_THRESHOLDS,
  resolveVipTierFromAssetUrl,
} from "../src/constants/vip";
import { DECORATION_FRAME_LAYOUT } from "../src/constants/decorations";
import { loadPublicProfile, toggleFollowUser } from "../src/services/publicProfileService";
import { fetchVipProfileFrameForUser } from "../src/services/vipService";
import { fetchUserDecorations } from "../src/services/decorationsService";
import { blockUser, loadFollowing, isSameUser } from "../src/services/relationshipService";
import { reportUser } from "../src/api/postApi";
import { openUserChat } from "../src/utils/chatNavigation";
import { resolveLocalLevelBadge } from "../src/utils/levelBadge";
import { resolveImageSource } from "../src/utils/videoSource";
import { s } from "../src/utils/responsive";

// Same per-tier VIP "logo" crest already used as the VIP badge everywhere
// else it appears (VipCenterPanel's tier carousel / "VIP Badge" privilege).
const VIP_LOGO_BY_TIER = Object.fromEntries(
  VIP_TIER_THRESHOLDS.map(({ tier, assets }) => [tier, assets?.logo ?? null])
);

const VERIFIED_BADGE = { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Batches/verified-batch.png" };
const BADGE_HEIGHT = 20;
const BADGE_ASPECT = { level: 142 / 149, verified: 438 / 179 };

const BOTTOM_TABS = ["Moment", "Profile", "Honor", "Gift"];

function Badge({ source, aspectRatio }) {
  return (
    <Image
      source={source}
      style={{ height: BADGE_HEIGHT, width: BADGE_HEIGHT * aspectRatio }}
      resizeMode="contain"
    />
  );
}

export default function UserProfileView({ user, onBack }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [vipProfileFrameUrl, setVipProfileFrameUrl] = useState(null);
  const [decorations, setDecorations] = useState({ badgeUrl: null, frameUrl: null });
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Moment");
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [remarksVisible, setRemarksVisible] = useState(false);
  const [remarksText, setRemarksText] = useState("");

  const userId = user?.userId ? String(user.userId) : null;

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    try {
      const [{ profile: loaded, status, posts: loadedPosts }, frameUrl, userDecorations, followingList] = await Promise.all([
        loadPublicProfile(userId),
        fetchVipProfileFrameForUser(userId),
        fetchUserDecorations(userId),
        loadFollowing().catch(() => []),
      ]);
      setProfile(loaded);
      setPosts(Array.isArray(loadedPosts) ? loadedPosts : []);
      setVipProfileFrameUrl(frameUrl);
      setDecorations(userDecorations);
      const followsFromList =
        Array.isArray(followingList) &&
        followingList.some((u) => isSameUser(u?.userId ?? u?.id, userId));
      setIsFollowing(Boolean(status?.following) || followsFromList);
      if (!loaded) setLoadFailed(true);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleFollowToggle = async () => {
    if (!userId || followLoading) return;
    const wasFollowing = isFollowing;
    setFollowLoading(true);
    setIsFollowing(!wasFollowing);
    try {
      await toggleFollowUser(userId, wasFollowing);
    } catch {
      setIsFollowing(wasFollowing);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleChat = () => {
    if (!userId) return;
    openUserChat(router, {
      userId,
      name: profile?.name ?? user?.name,
      avatar: profile?.avatarUrl ?? user?.avatar,
    });
  };

  const handleCopyId = async () => {
    if (!userId) return;
    await Clipboard.setStringAsync(userId);
    Alert.alert("Copied!", "User ID copied to clipboard.");
  };

  const handleBlock = () => {
    setMenuVisible(false);
    if (!userId) return;
    Alert.alert(
      "Block this user?",
      `You won't see ${displayName}'s posts or messages anymore.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser(userId);
              Alert.alert("Blocked", `${displayName} has been blocked.`);
              onBack?.();
            } catch (err) {
              Alert.alert("Block failed", err?.message || "Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleOpenRemarks = () => {
    setMenuVisible(false);
    setRemarksText("");
    setRemarksVisible(true);
  };

  // No backend endpoint exists yet for saving a per-contact custom remark/
  // nickname, so this can't persist anything real — surfacing that instead
  // of silently pretending it saved.
  const handleSaveRemarks = () => {
    setRemarksVisible(false);
    Alert.alert(
      "Not available yet",
      "Setting a custom remark for this user isn't supported by the server yet."
    );
  };

  const handleReportSubmit = async (reason) => {
    if (!userId) return;
    try {
      await reportUser(userId, reason);
      setReportVisible(false);
      Alert.alert("Report submitted", "Thank you for letting us know.");
    } catch (err) {
      throw new Error(err?.message || "Could not submit report. Please try again.");
    }
  };

  const displayName = profile?.name ?? user?.name ?? "User";
  const avatarUrl = profile?.avatarUrl ?? user?.avatar ?? null;
  const avatarSource = resolveProfileAvatarSource({ profilePicUrl: avatarUrl });
  const levelBadge = profile?.level != null ? resolveLocalLevelBadge(profile.level) : null;
  const vipTier = resolveVipTierFromAssetUrl(vipProfileFrameUrl);
  const vipLogo = vipTier != null ? VIP_LOGO_BY_TIER[vipTier] : null;
  // A user-specific decoration frame (backend-assigned, independent of VIP
  // tier) takes priority over the VIP frame when both are present.
  const profileFrameSource = decorations?.frameUrl ?? vipProfileFrameUrl;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f5fb" />
      <LinearGradient
        colors={["#faf8ff", "#f3eeff", "#ffffff"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={onBack}>
          <ArrowLeft size={20} color="#2d1b4e" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.8}
          onPress={() => setMenuVisible((v) => !v)}
        >
          <MoreHorizontal size={20} color="#2d1b4e" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 14 }]}>
            <LinearGradient
              colors={["#ffffff", "#faf8ff", "#f3eeff"]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={["#7c4dff", "#ff4ea3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topGlow}
            />
            <View style={styles.sheetHandle} />

            <View style={styles.sheetCard}>
              <TouchableOpacity
                style={styles.sheetItem}
                activeOpacity={0.75}
                onPress={() => {
                  setMenuVisible(false);
                  setReportVisible(true);
                }}
              >
                <Flag size={18} color="#7c4dff" />
                <Text style={styles.sheetItemText}>Report User</Text>
              </TouchableOpacity>
              <View style={styles.sheetDivider} />
              <TouchableOpacity style={styles.sheetItem} activeOpacity={0.75} onPress={handleBlock}>
                <UserX size={18} color="#e11d48" />
                <Text style={[styles.sheetItemText, { color: "#e11d48" }]}>Block User</Text>
              </TouchableOpacity>
              <View style={styles.sheetDivider} />
              <TouchableOpacity style={styles.sheetItem} activeOpacity={0.75} onPress={handleOpenRemarks}>
                <Tag size={18} color="#7c4dff" />
                <Text style={styles.sheetItemText}>Set Remarks</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sheetCancelBtnStandalone}
              activeOpacity={0.8}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={remarksVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRemarksVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setRemarksVisible(false)}
          />
          <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 14 }]}>
            <LinearGradient
              colors={["#ffffff", "#faf8ff", "#f3eeff"]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={["#7c4dff", "#ff4ea3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topGlow}
            />
            <View style={styles.sheetHandle} />
            <Text style={styles.remarksTitle}>Set Remarks</Text>
            <Text style={styles.remarksSubtitle}>
              Give {displayName} a private nickname only you can see.
            </Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Enter a remark..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={remarksText}
              onChangeText={setRemarksText}
              maxLength={40}
            />
            <View style={styles.remarksBtnRow}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                activeOpacity={0.8}
                onPress={() => setRemarksVisible(false)}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.remarksSaveBtnWrap}
                activeOpacity={0.85}
                onPress={handleSaveRemarks}
              >
                <LinearGradient
                  colors={["#7c4dff", "#ff4ea3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.remarksSaveBtn}
                >
                  <Text style={styles.remarksSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#a78bfa" />
        </View>
      ) : loadFailed ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.emptyText}>Could not load this profile</Text>
          <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={refresh}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* ── PROFILE CARD ── */}
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <ProfileAvatarWithFrame
                  avatarSource={avatarSource}
                  frameSource={profileFrameSource}
                  size={s(72)}
                  avatarStyle={styles.avatar}
                  placeholderInitial={displayName?.[0]?.toUpperCase() ?? "?"}
                  {...(decorations?.frameUrl
                    ? {
                        frameResizeMode: "contain",
                      }
                    : profileFrameSource
                    ? {
                        frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
                        frameResizeMode: VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                        frameOffsetX: VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                        frameOffsetY: VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                        frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                        innerRingRatio: VIP_PROFILE_FRAME_LAYOUT.innerRingRatio,
                        avatarOffsetY: VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                      }
                    : {})}
                />
                <View style={styles.cardInfoCol}>
                  <Text style={styles.name} numberOfLines={1}>{displayName}</Text>

                  <View style={styles.idRow}>
                    <Text style={styles.userId}>ID: {userId ?? "—"}</Text>
                    {userId && (
                      <TouchableOpacity onPress={handleCopyId} hitSlop={8} style={{ marginLeft: 6 }}>
                        <Copy size={13} color="#7c4dff" />
                      </TouchableOpacity>
                    )}
                    {profile?.gender && profile?.age != null && (
                      <View style={styles.genderPill}>
                        <Text style={styles.genderPillText}>
                          {profile.gender === "Male" ? "♂" : "♀"} {profile.age}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.badgeRow}>
                    {levelBadge && <Badge source={levelBadge} aspectRatio={BADGE_ASPECT.level} />}
                    {vipLogo && (
                      <Image
                        source={resolveImageSource(vipLogo)}
                        style={styles.vipBadge}
                        resizeMode="contain"
                      />
                    )}
                    {decorations?.badgeUrl && (
                      <Badge
                        source={resolveImageSource(decorations.badgeUrl)}
                        aspectRatio={BADGE_ASPECT.verified}
                      />
                    )}
                    {profile?.verified && (
                      <Badge source={VERIFIED_BADGE} aspectRatio={BADGE_ASPECT.verified} />
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* ── STATS ── */}
            {/* Sourced from GET /api/app/users/{id}/profile-details via
                loadPublicProfile — shown as "—" rather than a fake 0 if
                the field is missing from the response. */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile?.followingCount != null ? profile.followingCount.toLocaleString() : "—"}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile?.followersCount != null ? profile.followersCount.toLocaleString() : "—"}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile?.visitorCount != null ? profile.visitorCount.toLocaleString() : "—"}
                </Text>
                <Text style={styles.statLabel}>Visitors</Text>
              </View>
            </View>

            {/* ── INTRODUCTION ── */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Introduction</Text>
              <Text style={styles.bio}>{profile?.bio || "No introduction yet"}</Text>
            </View>

            {/* ── BOTTOM TABS ── */}
            <View style={styles.bottomTabsBar}>
              {BOTTOM_TABS.map((tab) => (
                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.bottomTabItem}>
                  <Text style={[styles.bottomTabText, activeTab === tab && styles.bottomTabActive]}>{tab}</Text>
                  {activeTab === tab && <View style={styles.bottomTabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* ── MOMENT ── */}
            {activeTab === "Moment" && (
              posts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📦</Text>
                  <Text style={styles.emptyText}>No posts yet</Text>
                </View>
              ) : (
                <View style={styles.postsGrid}>
                  {posts.map((post) => {
                    const imageUri = post.mediaUrl ?? post.imageUrl ?? post.mediaUrls?.[0] ?? null;
                    if (!imageUri) return null;
                    return (
                      <View key={post.id} style={styles.postThumb}>
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.postThumbImage}
                          resizeMode="cover"
                        />
                        {post.hasVideo && (
                          <View style={styles.videoOverlay}>
                            <Text style={styles.videoIcon}>▶</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )
            )}
            {activeTab === "Profile" && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>👤</Text>
                <Text style={styles.emptyText}>Profile stats are shown above</Text>
              </View>
            )}
            {activeTab === "Honor" && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏅</Text>
                <Text style={styles.emptyText}>Honor coming soon</Text>
              </View>
            )}
            {activeTab === "Gift" && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎁</Text>
                <Text style={styles.emptyText}>Gift history coming soon</Text>
              </View>
            )}
          </ScrollView>

          {/* ── STICKY BOTTOM ACTIONS ── */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable onPress={handleChat} style={styles.actionBtn}>
              {({ pressed, hovered }) => (
                <LinearGradient
                  colors={
                    pressed || hovered
                      ? ["#f3ecff", "#e9dcff"]
                      : ["#ffffff", "#f3ecff"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGrad}
                >
                  <View style={styles.actionIconBadge}>
                    <Image
                      source={{
                        uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/chat.png",
                      }}
                      style={styles.chatIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={styles.actionBtnText}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    Chat
                  </Text>
                </LinearGradient>
              )}
            </Pressable>
            <Pressable
              onPress={handleFollowToggle}
              disabled={followLoading}
              style={styles.actionBtn}
            >
              {({ pressed, hovered }) => (
                <LinearGradient
                  colors={
                    pressed || hovered
                      ? ["#f3ecff", "#e9dcff"]
                      : ["#ffffff", "#f3ecff"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGrad}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color="#7c4dff" />
                  ) : (
                    <>
                      <View style={styles.actionIconBadge}>
                        {isFollowing ? (
                          <UserCheck size={18} color="#7c4dff" />
                        ) : (
                          <UserPlus size={18} color="#7c4dff" />
                        )}
                      </View>
                      <Text
                        style={styles.actionBtnText}
                        numberOfLines={1}
                        allowFontScaling={false}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </>
      )}

      <ReportReasonModal
        visible={reportVisible}
        targetLabel={displayName}
        onClose={() => setReportVisible(false)}
        onSubmit={handleReportSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8ff" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(124,77,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  actionSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
    borderBottomWidth: 0,
  },
  topGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(124,77,255,0.25)",
    marginBottom: 16,
  },
  sheetCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.15)",
    overflow: "hidden",
    marginBottom: 12,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  sheetItemText: { color: "#2d1b4e", fontSize: 15, fontWeight: "600" },
  sheetDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)" },
  sheetCancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,77,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.18)",
  },
  // Same look as sheetCancelBtn but without flex:1 — this one sits alone in
  // the action sheet's column layout rather than a flexDirection:"row" pair,
  // so flex:1 there stretched it to fill the sheet's remaining height
  // instead of sizing to its label.
  sheetCancelBtnStandalone: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,77,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.18)",
    marginBottom: 14,
  },
  sheetCancelText: { color: "#2d1b4e", fontSize: 15, fontWeight: "700" },
  remarksTitle: { color: "#2d1b4e", fontSize: 19, fontWeight: "800", marginBottom: 6 },
  remarksSubtitle: {
    color: "rgba(45,27,78,0.6)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  remarksInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(124,77,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.25)",
    color: "#2d1b4e",
    fontSize: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  remarksBtnRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  remarksSaveBtnWrap: { flex: 1.4, borderRadius: 16, overflow: "hidden" },
  remarksSaveBtn: { paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  remarksSaveText: { color: "white", fontSize: 15, fontWeight: "700" },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.15)",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTopRow: { flexDirection: "row", gap: 14 },
  avatar: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    borderWidth: 2,
    borderColor: "rgba(124,77,255,0.35)",
  },
  cardInfoCol: { flex: 1, justifyContent: "center", gap: 6 },
  name: { color: "#2d1b4e", fontSize: 19, fontWeight: "800" },
  idRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  userId: { color: "#7c4dff", fontSize: 12, fontWeight: "600" },
  genderPill: {
    backgroundColor: "rgba(124,77,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  genderPillText: { color: "#7c4dff", fontSize: 11, fontWeight: "700" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  vipBadge: { width: BADGE_HEIGHT, height: BADGE_HEIGHT },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.15)",
    paddingVertical: 14,
    marginBottom: 14,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(124,77,255,0.15)" },
  statValue: { color: "#2d1b4e", fontSize: 17, fontWeight: "800" },
  statLabel: { color: "rgba(45,27,78,0.5)", fontSize: 12, marginTop: 2 },
  sectionTitle: { color: "#2d1b4e", fontSize: 15, fontWeight: "800", marginBottom: 8 },
  bio: { color: "rgba(45,27,78,0.7)", fontSize: 14, lineHeight: 20 },
  bottomTabsBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,77,255,0.12)",
    marginBottom: 8,
  },
  bottomTabItem: { marginRight: 22, paddingBottom: 10, position: "relative" },
  bottomTabText: { color: "rgba(45,27,78,0.4)", fontSize: 14, fontWeight: "600" },
  bottomTabActive: { color: "#2d1b4e", fontWeight: "800" },
  bottomTabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: "#7c4dff",
    borderRadius: 2,
  },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: "rgba(45,27,78,0.4)", fontSize: 14, fontWeight: "600" },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 4,
  },
  postThumb: {
    width: "32.5%",
    aspectRatio: 1,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(124,77,255,0.06)",
  },
  postThumbImage: { width: "100%", height: "100%" },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  videoIcon: { color: "white", fontSize: 22 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: "#7c4dff", fontSize: 14, fontWeight: "700" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(124,77,255,0.1)",
  },
  // Chat and Follow share this exact shape/gradient/text treatment so the
  // two footer buttons read as one consistent pair rather than two
  // differently-themed controls.
  actionBtn: { flex: 1, borderRadius: 24, overflow: "hidden" },
  actionBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.15)",
  },
  actionBtnText: { color: "#7c3aed", fontSize: 14, fontWeight: "700" },
  actionIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,77,255,0.12)",
  },
  chatIcon: { width: 18, height: 18 },
});
