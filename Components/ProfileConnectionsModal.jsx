import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { loadFollowing, loadFollowers } from "../src/services/relationshipService";
import { loadProfileVisitsList } from "../src/services/profileStatsService";
import { openUserChat } from "../src/utils/chatNavigation";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";
import { VIP_PROFILE_FRAME_LAYOUT } from "../src/constants/vip";

const TITLES = {
  following: "Following",
  followers: "Followers",
  visitors: "Visitors",
};

const LOADERS = {
  following: loadFollowing,
  followers: loadFollowers,
  visitors: loadProfileVisitsList,
};

const EMPTY_COPY = {
  following: { title: "Not following anyone yet", sub: "People you follow will appear here" },
  followers: { title: "No followers yet", sub: "When someone follows you, they'll show up here" },
  visitors: { title: "No profile visitors yet", sub: "People who view your profile will appear here" },
};

export default function ProfileConnectionsModal({ visible, type, onClose }) {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async () => {
    if (!type) return;
    setLoading(true);
    setError(null);
    try {
      const loader = LOADERS[type];
      const list = await loader();
      setUsers(list);
      
    } catch (err) {
      
      setError(err?.message || "Could not load list.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (visible && type) fetchList();
    if (!visible) {
      setUsers([]);
      setError(null);
    }
  }, [visible, type, fetchList]);

  const handleUserPress = async (user) => {
    await openUserChat(router, user);
    onClose?.();
  };

  const empty = type ? EMPTY_COPY[type] : EMPTY_COPY.following;

  const renderItem = ({ item }) => {
    const userId = item.userId ?? item.id;
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        onPress={() => handleUserPress(item)}
      >
        <View style={styles.avatarWrap}>
          {item.avatar ? (
            <ProfileAvatarWithFrame
              avatarSource={{ uri: item.avatar }}
              frameSource={item.vipProfileFrameUrl}
              size={48}
              avatarStyle={styles.avatarImg}
              {...(item.vipProfileFrameUrl
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
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={22} color="#a78bfa" />
            </View>
          )}
          {item.online && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.rowInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {item.verified && <Text style={styles.verified}>✓</Text>}
          </View>
          {item.handle ? (
            <Text style={styles.handle} numberOfLines={1}>{item.handle}</Text>
          ) : (
            <Text style={styles.handle}>ID: {userId}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e"]}
          locations={[0, 0.3, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>{type ? TITLES[type] : ""}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#a78bfa" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchList} activeOpacity={0.85}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => String(item.userId ?? item.id)}
              renderItem={renderItem}
              contentContainerStyle={users.length === 0 ? styles.emptyList : styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>
                    {type === "visitors" ? "👀" : type === "followers" ? "🫂" : "⭐"}
                  </Text>
                  <Text style={styles.emptyTitle}>{empty.title}</Text>
                  <Text style={styles.emptySub}>{empty.sub}</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0618" },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSpacer: { width: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  loadingText: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  errorText: { color: "#f87171", fontSize: 14, textAlign: "center" },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.35)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  retryText: { color: "white", fontWeight: "700" },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  emptyList: { flexGrow: 1, paddingHorizontal: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
  },
  avatarWrap: { position: "relative", marginRight: 12 },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(124,77,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#00e676",
    borderWidth: 2,
    borderColor: "#0d0618",
  },
  rowInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "white", fontSize: 15, fontWeight: "700", flexShrink: 1 },
  verified: { color: "#4ade80", fontSize: 13, fontWeight: "800" },
  handle: { color: "rgba(255,255,255,0.45)", fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: "white", fontSize: 17, fontWeight: "800", textAlign: "center" },
  emptySub: { color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center", lineHeight: 20 },
});
