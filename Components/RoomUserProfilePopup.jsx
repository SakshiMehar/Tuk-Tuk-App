import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { X, UserPlus, UserCheck } from "lucide-react-native";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { resolveImageSource } from "../src/utils/videoSource";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";

export default function RoomUserProfilePopup({
  visible,
  user,
  avatarSource = null,
  loading = false,
  isFollowing = false,
  followLoading = false,
  isSelf = false,
  onClose,
  onFollowToggle,
}) {
  if (!visible) return null;

  const displayName = user?.name ?? user?.displayName ?? "User";
  const username = user?.username ?? user?.handle ?? displayName;
  const userId = user?.id ?? user?.userId ?? "—";
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

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <X size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {loading && !user ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#a78bfa" />
            </View>
          ) : (
            <>
              <View style={styles.avatarWrap}>
                <ProfileAvatarWithFrame
                  user={user}
                  avatarSource={resolvedAvatarSource}
                  size={80}
                  avatarStyle={styles.avatar}
                  placeholderStyle={styles.avatarFallback}
                  initialStyle={styles.avatarInitial}
                  placeholderInitial={displayName?.[0]?.toUpperCase() ?? "?"}
                  imageComponent={Image}
                />
              </View>

              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.username} numberOfLines={1}>
                @{username}
              </Text>
              <Text style={styles.userId}>ID: {userId}</Text>

              {!isSelf && userId !== "—" ? (
                <TouchableOpacity
                  style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                  onPress={onFollowToggle}
                  disabled={followLoading}
                  activeOpacity={0.85}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      {isFollowing ? (
                        <UserCheck size={16} color="white" />
                      ) : (
                        <UserPlus size={16} color="white" />
                      )}
                      <Text style={styles.followBtnText}>
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 300,
    backgroundColor: "#1a0f2e",
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  avatarWrap: {
    marginBottom: 14,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(167,139,250,0.5)",
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(167,139,250,0.5)",
  },
  avatarInitial: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
  },
  name: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    maxWidth: "100%",
  },
  username: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    maxWidth: "100%",
  },
  userId: {
    color: "rgba(167,139,250,0.85)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 18,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7c4dff",
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 22,
    minWidth: 140,
    minHeight: 42,
  },
  followBtnActive: {
    backgroundColor: "rgba(124,77,255,0.35)",
    borderWidth: 1,
    borderColor: "#7c4dff",
  },
  followBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});
