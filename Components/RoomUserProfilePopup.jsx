import React, { useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertCircle,
  Gift,
  Home,
  MessageCircle,
  UserCheck,
  UserPlus
} from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ms, s, vs } from "react-native-size-matters";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { resolveImageSource } from "../src/utils/videoSource";
import { resolveLocalLevelBadge } from "../src/utils/levelBadge";
import { fetchUserDecorations } from "../src/services/decorationsService";
import { fetchVipProfileFrameForUser } from "../src/services/vipService";
import { VIP_TIER_THRESHOLDS, resolveVipTierFromAssetUrl } from "../src/constants/vip";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";

const { width: W } = Dimensions.get("window");

const NEW_START_BADGE = { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Batches/newstart-batch.png" };
const VERIFIED_BADGE = { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Batches/verified-batch.png" };

const VIP_LOGO_BY_TIER = Object.fromEntries(
  VIP_TIER_THRESHOLDS.map(({ tier, assets }) => [tier, assets?.logo ?? null])
);

const PROFILE_BADGE_HEIGHT = s(32);
const PROFILE_BADGE_ASPECT = {
  level: 142 / 149,
  newStar: 456 / 174,
  verified: 438 / 179,
  vip: 1,
};

const AVATAR_SIZE = s(74);

function ProfileBadge({ source, aspectRatio = 1, style }) {
  if (!source) return null;
  const imageSource = typeof source === "string" ? resolveImageSource(source) : source;
  if (!imageSource) return null;
  return (
    <Image
      source={imageSource}
      style={[
        { height: PROFILE_BADGE_HEIGHT, width: PROFILE_BADGE_HEIGHT * aspectRatio },
        style,
      ]}
      resizeMode="contain"
    />
  );
}

export default function RoomUserProfilePopup({
  visible,
  user,
  level = null,
  avatarSource = null,
  frameSource = null,
  frameLayout = null,
  logoSource = null,
  badgeSource = null,
  levelBadgeSource = null,
  loading = false,
  isFollowing = false,
  followLoading = false,
  isSelf = false,
  isOwner = false,
  role = null,
  countryFlag = null,
  onClose,
  onFollowToggle,
  onChat,
  onSendGift,
  onReport,
}) {
  const insets = useSafeAreaInsets();
  const [fetchedBadgeUrl, setFetchedBadgeUrl] = useState(null);
  const [fetchedVipFrameUrl, setFetchedVipFrameUrl] = useState(null);

  const displayName = user?.name ?? user?.displayName ?? user?.username ?? "User";
  const username = user?.username ?? user?.handle ?? displayName;
  const userId = user?.id ?? user?.userId ?? "—";
  const userAge = user?.age != null ? user?.age : null;
  const rawGender = user?.gender ? String(user?.gender).trim() : null;
  const userGender = (rawGender ?? "male").toLowerCase();
  const isFemale = userGender === "female";
  const genderDisplayText = rawGender
    ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()
    : "Male";
  const genderIcon = isFemale ? "♀" : "♂";
  const userLevel = level ?? user?.level ?? user?.userLevel ?? 1;
  const isUserOwner = Boolean(isOwner || user?.isOwner || role?.toLowerCase() === "owner");
  const displayRole = role ?? (isUserOwner ? "Owner" : user?.role ?? "Owner");
  const flagUrl = user?.flagUrl ?? null;
  const countryName = user?.countryName ?? null;

  // Auto-fetch badges & VIP frame for other users if not already provided
  useEffect(() => {
    let active = true;
    if (!visible || !userId || userId === "—") {
      setFetchedBadgeUrl(null);
      setFetchedVipFrameUrl(null);
      return;
    }

    if (!badgeSource && !user?.badgeUrl && !user?.decorationBadgeUrl) {
      fetchUserDecorations(userId)
        .then((res) => {
          if (active && res?.badgeUrl) {
            setFetchedBadgeUrl(res.badgeUrl);
          }
        })
        .catch(() => {});
    }

    if (!logoSource && !user?.vipLogo && !user?.vipProfileFrameUrl && !frameSource) {
      fetchVipProfileFrameForUser(userId)
        .then((url) => {
          if (active && url) {
            setFetchedVipFrameUrl(url);
          }
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [
    visible,
    userId,
    badgeSource,
    logoSource,
    user?.badgeUrl,
    user?.decorationBadgeUrl,
    user?.vipLogo,
    user?.vipProfileFrameUrl,
    frameSource,
  ]);

  const frameUrlString =
    typeof frameSource === "string" ? frameSource : frameSource?.uri ?? null;
  const resolvedVipLogo =
    logoSource ??
    user?.vipLogo ??
    (user?.vipTier ? VIP_LOGO_BY_TIER[Number(user.vipTier)] : null) ??
    (user?.vip ? VIP_LOGO_BY_TIER[Number(user.vip)] : null) ??
    (user?.vipLevel ? VIP_LOGO_BY_TIER[Number(user.vipLevel)] : null) ??
    (frameUrlString ? VIP_LOGO_BY_TIER[resolveVipTierFromAssetUrl(frameUrlString)] : null) ??
    (user?.vipProfileFrameUrl ? VIP_LOGO_BY_TIER[resolveVipTierFromAssetUrl(user.vipProfileFrameUrl)] : null) ??
    (fetchedVipFrameUrl ? VIP_LOGO_BY_TIER[resolveVipTierFromAssetUrl(fetchedVipFrameUrl)] : null) ??
    null;

  const resolvedBadgeSource =
    badgeSource ??
    user?.badgeUrl ??
    user?.decorationBadgeUrl ??
    fetchedBadgeUrl ??
    null;

  const hasNewStar = Boolean(
    user?.hasNewUserFrame ||
    user?.newUserFrameUrl ||
    user?.newUserFrameSource
  );

  const resolvedAvatarSource =
    avatarSource ??
    (() => {
      const source = resolveProfileAvatarSource({
        avatarId: user?.avatarId,
        avatar: user?.avatar,
        avatarUrl: user?.avatarUrl,
        profilePicUrl: user?.profilePicUrl,
        profileImageUrl: user?.profileImageUrl,
        profileImage: user?.profileImage,
      });
      if (!source) return null;
      return source?.uri ? resolveImageSource(source.uri) : source;
    })();

  const handleCopyId = async () => {
    if (!userId || userId === "—") return;
    try {
      await Clipboard.setStringAsync(String(userId));
      Alert.alert("Copied!", `User ID (${userId}) copied to clipboard.`);
    } catch {
      // safe fallback
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdropWrap}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, vs(16)) + vs(8),
            },
          ]}
        >
          {/* Centered Overlapping Avatar: Half outer and half inside modal at top center */}
          <View style={styles.avatarOverlapContainer}>
            <View style={styles.avatarGlowWrapper}>
              <ProfileAvatarWithFrame
                user={user}
                avatarSource={resolvedAvatarSource}
                frameSource={frameSource}
                size={AVATAR_SIZE}
                avatarStyle={styles.avatarImage}
                placeholderStyle={styles.avatarFallback}
                initialStyle={styles.avatarInitial}
                placeholderInitial={displayName?.[0]?.toUpperCase() ?? "?"}
                imageComponent={Image}
                {...(frameLayout
                  ? {
                    frameScale: frameLayout.frameScale,
                    frameResizeMode: frameLayout.frameResizeMode,
                    frameOffsetX: frameLayout.frameOffsetX,
                    frameOffsetY: frameLayout.frameOffsetY,
                    frameBleed: frameLayout.frameBleed,
                    avatarBoost: frameLayout.avatarBoost,
                    avatarOffsetY: frameLayout.avatarOffsetY,
                  }
                  : {})}
              />
            </View>
          </View>

          {/* Top Actions: Left (Report Button Only) */}
          <View style={styles.topActionsRow}>
            <TouchableOpacity
              style={styles.circleActionBtn}
              activeOpacity={0.75}
              onPress={onReport ?? onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AlertCircle size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {loading && !user ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#7C3AED" />
            </View>
          ) : (
            <>
              {/* Name (Blue checkmark removed) */}
              <View style={styles.nameRow}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {displayName}
                </Text>
                {!!countryFlag && (
                  <Text style={styles.countryFlag}>{countryFlag}</Text>
                )}
              </View>

              {/* User ID (Copyable) */}
              <TouchableOpacity
                style={styles.userIdRow}
                activeOpacity={0.7}
                onPress={handleCopyId}
              >
                <Text style={styles.userIdText}>ID:{userId}</Text>
              </TouchableOpacity>

              {/* Row 1: Attribute & Role Badges */}
              <View style={styles.badgePillsRow}>
                {/* Role Pill: ONLY displayed if user is the room owner */}
                {isUserOwner && (
                  <View style={styles.rolePill}>
                    <Home size={12} color="#D97706" />
                    <Text style={styles.rolePillText}>{displayRole}</Text>
                  </View>
                )}

                {/* Gender & Age Pill (displays icon + gender text) */}
                <View
                  style={[
                    styles.genderPill,
                    isFemale && styles.genderPillFemale,
                  ]}
                >
                  <Text style={styles.genderIconText}>{genderIcon}</Text>
                  <Text style={styles.genderValueText}>{genderDisplayText}</Text>
                  {userAge != null && (
                    <Text style={styles.genderAgeText}>{userAge}</Text>
                  )}
                </View>

                {/* Level Pill */}
                <LinearGradient
                  colors={["#60A5FA", "#3B82F6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientPill}
                >
                  <Text style={styles.gradientPillText}>Lv.{userLevel}</Text>
                </LinearGradient>

                {/* Country Flag & Name Pill */}
                {(Boolean(flagUrl) || Boolean(countryName)) && (
                  <View style={styles.countryPill}>
                    {flagUrl ? (
                      <Image
                        source={resolveImageSource(flagUrl)}
                        style={styles.countryFlagImage}
                        resizeMode="contain"
                      />
                    ) : null}
                    {countryName ? (
                      <Text style={styles.countryPillText} numberOfLines={1}>
                        {countryName}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>

              {/* Row 2: User Badges (Level badge + New Star badge + VIP Logo + Decoration Badge + Verified badge) */}
              <View style={styles.userBadgesRow}>
                <ProfileBadge
                  source={levelBadgeSource ?? resolveLocalLevelBadge(userLevel ?? 1)}
                  aspectRatio={PROFILE_BADGE_ASPECT.level}
                />
                {hasNewStar && (
                  <ProfileBadge
                    source={NEW_START_BADGE}
                    aspectRatio={PROFILE_BADGE_ASPECT.newStar}
                  />
                )}
                {resolvedVipLogo && (
                  <ProfileBadge
                    source={resolvedVipLogo}
                    aspectRatio={PROFILE_BADGE_ASPECT.vip}
                  />
                )}
                {resolvedBadgeSource && (
                  <ProfileBadge
                    source={resolvedBadgeSource}
                    aspectRatio={PROFILE_BADGE_ASPECT.verified}
                  />
                )}
                <ProfileBadge
                  source={VERIFIED_BADGE}
                  aspectRatio={PROFILE_BADGE_ASPECT.verified}
                />
              </View>

              {/* Bottom Actions Row: Follow, Chat, Send Gifts */}
              <View style={styles.bottomButtonsRow}>
                {/* Follow Button */}
                {!isSelf ? (
                  <TouchableOpacity
                    style={styles.actionButtonWrapper}
                    activeOpacity={0.85}
                    onPress={onFollowToggle}
                    disabled={followLoading}
                  >
                    <LinearGradient
                      colors={
                        isFollowing
                          ? ["#94A3B8", "#64748B"]
                          : ["#00E5FF", "#00B0FF", "#0284C7"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      {followLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          {isFollowing ? (
                            <UserCheck size={16} color="#FFFFFF" />
                          ) : (
                            <UserPlus size={16} color="#FFFFFF" />
                          )}
                          <Text style={styles.actionButtonText}>
                            {isFollowing ? "Following" : "Follow"}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : null}

                {/* Chat Button */}
                <TouchableOpacity
                  style={styles.actionButtonWrapper}
                  activeOpacity={0.85}
                  onPress={onChat}
                >
                  <LinearGradient
                    colors={["#C084FC", "#A855F7", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                  >
                    <MessageCircle size={16} color="#FFFFFF" fill="rgba(255,255,255,0.3)" />
                    <Text style={styles.actionButtonText}>Chat</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Send Gifts Button */}
                <TouchableOpacity
                  style={[styles.actionButtonWrapper, styles.sendGiftsWrapper]}
                  activeOpacity={0.85}
                  onPress={onSendGift}
                >
                  <LinearGradient
                    colors={["#FB923C", "#F97316", "#EA580C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                  >
                    <Gift size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Send Gifts</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdropWrap: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  sheetContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: s(28),
    borderTopRightRadius: s(28),
    paddingTop: AVATAR_SIZE / 2 + vs(16),
    paddingBottom: Platform.OS === "ios" ? vs(20) : vs(12),
    paddingHorizontal: s(16),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    position: "relative",
  },
  avatarOverlapContainer: {
    position: "absolute",
    top: -(AVATAR_SIZE / 2),
    alignSelf: "center",
    zIndex: 20,
  },
  avatarGlowWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: "#FBBF24",
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FBBF24",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: ms(28),
    fontWeight: "800",
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    position: "absolute",
    top: vs(12),
    left: s(16),
    zIndex: 10,
  },
  circleActionBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    paddingVertical: vs(40),
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    maxWidth: W - s(48),
    gap: s(4),
  },
  nameText: {
    color: "#0F172A",
    fontSize: ms(18),
    fontWeight: "800",
    textAlign: "center",
  },
  userIdRow: {
    marginTop: vs(1),
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
  },
  countryFlag: {
    fontSize: ms(16),
  },
  vipLogo: {
    width: s(22),
    height: s(22),
    flexShrink: 0,
  },
  userIdText: {
    color: "#64748B",
    fontSize: ms(12),
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  badgePillsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: s(6),
    marginTop: vs(8),
    width: "100%",
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(12),
  },
  rolePillText: {
    color: "#D97706",
    fontSize: ms(11),
    fontWeight: "800",
  },
  genderPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(3),
    backgroundColor: "#00E5FF",
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(12),
  },
  genderPillFemale: {
    backgroundColor: "#F472B6",
  },
  genderIconText: {
    color: "#FFFFFF",
    fontSize: ms(12),
    fontWeight: "900",
  },
  genderValueText: {
    color: "#FFFFFF",
    fontSize: ms(11),
    fontWeight: "800",
  },
  genderAgeText: {
    color: "#FFFFFF",
    fontSize: ms(11),
    fontWeight: "800",
    marginLeft: s(2),
  },
  countryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: s(7),
    paddingVertical: vs(3),
    borderRadius: s(12),
  },
  countryFlagImage: {
    width: s(16),
    height: vs(12),
    borderRadius: s(2),
  },
  countryPillText: {
    color: "#475569",
    fontSize: ms(11),
    fontWeight: "700",
  },
  gradientPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(3),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(12),
  },
  userBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: s(6),
    marginTop: vs(8),
    marginBottom: vs(2),
  },
  bottomButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: s(8),
    marginTop: vs(12),
    width: "100%",
  },
  actionButtonWrapper: {
    flex: 1,
    height: vs(42),
    borderRadius: vs(21),
    overflow: "hidden",
  },
  sendGiftsWrapper: {
    flex: 1.18,
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
    paddingHorizontal: s(8),
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: ms(13),
    fontWeight: "800",
  },
});
