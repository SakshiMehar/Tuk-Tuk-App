import { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  UserPlus,
  MoreHorizontal,
  X,
  Smile,
  Send,
  Mic,
  ImageIcon,
  HelpCircle,
  Gift,
  Phone,
  Lock,
  MapPin,
  Shield,
  ChevronRight,
  Heart,
} from "lucide-react-native";

const { width: W } = Dimensions.get("window");

const LOCKED_PHOTO_W = (W - 80) / 3 - 6;

export default function ChatBox({ user = {}, onBack }) {
  const {
    name = "User",
    avatar = "https://randomuser.me/api/portraits/men/34.jpg",
    matchPercent = 95,
    interests = ["TV shows"],
    location = "Indore",
    likeCount = 0,
  } = user;

  const [showBanner, setShowBanner] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likedCount, setLikedCount] = useState(likeCount);
  const scrollRef = useRef(null);

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text, fromMe: true, time: new Date() },
    ]);
    setMessage("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0720" />

      {/* ── HEADER ── */}
      <LinearGradient colors={["#160d30", "#0f0720"]} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8} onPress={onBack}>
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8}>
            <UserPlus size={20} color="#a78bfa" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8}>
            <MoreHorizontal size={22} color="rgba(167,139,250,0.8)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          {/* ── NOTIFICATION BANNER ── */}
          {showBanner && (
            <View style={styles.bannerWrap}>
              <LinearGradient
                colors={["rgba(124,77,255,0.18)", "rgba(74,108,247,0.15)"]}
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
                  <X size={13} color="rgba(167,139,250,0.55)" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* ── MATCH CARD ── */}
          <View style={styles.matchCardWrap}>
            <LinearGradient
              colors={["#1a0a3e", "#2d1065", "#1a0a3e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.matchCard}
            >
              {/* Top row: avatar + match % */}
              <View style={styles.matchTopRow}>
                <LinearGradient
                  colors={["#7c4dff", "#4a6cf7"]}
                  style={styles.matchAvatarRing}
                >
                  <Image source={{ uri: avatar }} style={styles.matchAvatar} />
                </LinearGradient>
                <View style={styles.matchPercWrap}>
                  <Text style={styles.matchPercNum}>{matchPercent}%</Text>
                  <Text style={styles.matchPercLabel}> Match</Text>
                </View>
                {/* Heart */}
                <TouchableOpacity
                  style={styles.matchHeart}
                  activeOpacity={0.8}
                  onPress={() => {
                    setLiked((v) => !v);
                    setLikedCount((c) => (liked ? c - 1 : c + 1));
                  }}
                >
                  <Heart
                    size={22}
                    color={liked ? "#ff4ea3" : "rgba(255,255,255,0.35)"}
                    fill={liked ? "#ff4ea3" : "none"}
                  />
                  <Text style={[styles.matchHeartCount, liked && { color: "#ff4ea3" }]}>
                    {likedCount}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tags row */}
              <View style={styles.matchTagsRow}>
                <View style={styles.matchTagItem}>
                  <Shield size={13} color="#a78bfa" />
                  {interests.map((t) => (
                    <View key={t} style={styles.matchTag}>
                      <Text style={styles.matchTagText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.matchTagItem}>
                  <MapPin size={13} color="#a78bfa" />
                  <View style={styles.matchTag}>
                    <Text style={styles.matchTagText}>
                      Living in <Text style={{ color: "white", fontWeight: "700" }}>{location}</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Locked photos row */}
              <View style={styles.matchPhotosRow}>
                {[0, 1, 2].map((i) => (
                  <TouchableOpacity key={i} activeOpacity={0.8} style={styles.matchPhotoCard}>
                    <LinearGradient
                      colors={["#1e0a3c", "#3a1575"]}
                      style={styles.matchPhotoGrad}
                    >
                      <View style={styles.matchLockCircle}>
                        <Lock size={16} color="#a78bfa" />
                      </View>
                      <Text style={styles.matchUnlockText}>Unlock Pass</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* ── SAFE MODE BANNER ── */}
          <View style={styles.safeBannerWrap}>
            <LinearGradient
              colors={["rgba(74,108,247,0.15)", "rgba(124,77,255,0.15)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.safeBanner}
            >
              <View style={styles.safeIconWrap}>
                <Shield size={18} color="#7c4dff" />
              </View>
              <Text style={styles.safeText}>Safe mode protect your information.</Text>
              <TouchableOpacity style={styles.safeArrow} activeOpacity={0.8}>
                <ChevronRight size={14} color="#7c4dff" />
                <ChevronRight size={14} color="#7c4dff" style={{ marginLeft: -8 }} />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* ── MESSAGES AREA ── */}
          {messages.length === 0 ? (
            <View style={styles.emptyChat} />
          ) : (
            <View style={styles.messagesList}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.msgRow,
                    msg.fromMe ? styles.msgRowMe : styles.msgRowThem,
                  ]}
                >
                  {!msg.fromMe && (
                    <Image source={{ uri: avatar }} style={styles.msgAvatar} />
                  )}
                  <View
                    style={[
                      styles.msgBubble,
                      msg.fromMe ? styles.msgBubbleMe : styles.msgBubbleThem,
                    ]}
                  >
                    {msg.fromMe ? (
                      <LinearGradient
                        colors={["#5b21b6", "#7c4dff"]}
                        style={styles.msgBubbleGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.msgTextMe}>{msg.text}</Text>
                        <Text style={styles.msgTime}>{formatTime(msg.time)}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.msgBubbleThemInner}>
                        <Text style={styles.msgTextThem}>{msg.text}</Text>
                        <Text style={[styles.msgTime, { color: "rgba(255,255,255,0.35)" }]}>
                          {formatTime(msg.time)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* ── INPUT BAR ── */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.safeInputIcon} activeOpacity={0.8}>
            <Shield size={20} color="#7c4dff" />
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message"
              placeholderTextColor="rgba(167,139,250,0.4)"
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity style={styles.emojiBtn} activeOpacity={0.8}>
              <Smile size={22} color="rgba(167,139,250,0.55)" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, message.trim() && styles.sendBtnActive]}
            activeOpacity={0.8}
            onPress={sendMessage}
          >
            <LinearGradient
              colors={message.trim() ? ["#7c4dff", "#4a6cf7"] : ["rgba(124,77,255,0.25)", "rgba(74,108,247,0.25)"]}
              style={styles.sendBtnGrad}
            >
              <Send size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── BOTTOM ACTION BAR ── */}
        <View style={styles.actionBar}>
          {[
            { icon: <Mic size={22} color="rgba(167,139,250,0.55)" />, label: "" },
            { icon: <ImageIcon size={22} color="rgba(167,139,250,0.55)" />, label: "" },
            { icon: <HelpCircle size={22} color="#7c4dff" />, label: "" },
            { icon: <Gift size={22} color="#ff7043" />, label: "" },
            { icon: <Phone size={22} color="rgba(167,139,250,0.55)" />, label: "" },
          ].map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.actionBtn} activeOpacity={0.8}>
              {item.icon}
            </TouchableOpacity>
          ))}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0720" },

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
    backgroundColor: "rgba(124,77,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
  },
  headerName: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
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
    borderColor: "rgba(167,139,250,0.18)",
    borderRadius: 14,
  },
  bannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(124,77,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerIconEmoji: { fontSize: 20 },
  bannerText: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 17 },
  bannerBtn: {
    backgroundColor: "#7c4dff",
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
    borderColor: "rgba(167,139,250,0.2)",
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
  matchAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#0f0720",
  },
  matchPercWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
  },
  matchPercNum: {
    color: "#a78bfa",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  matchPercLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 16,
    fontWeight: "600",
  },
  matchHeart: {
    alignItems: "center",
    gap: 2,
  },
  matchHeartCount: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "600",
  },

  // Tags
  matchTagsRow: { gap: 7 },
  matchTagItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  matchTag: {
    backgroundColor: "rgba(124,77,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  matchTagText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "500" },

  // Locked photos
  matchPhotosRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  matchPhotoCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    height: 80,
  },
  matchPhotoGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  matchLockCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(124,77,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchUnlockText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "600",
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
    borderColor: "rgba(124,77,255,0.25)",
    borderRadius: 14,
  },
  safeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(124,77,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  safeText: { flex: 1, color: "#a78bfa", fontSize: 12, fontWeight: "600" },
  safeArrow: { flexDirection: "row", alignItems: "center" },

  // Empty chat
  emptyChat: { height: 120 },

  // Messages
  messagesList: { paddingHorizontal: 14, paddingTop: 16, gap: 12 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowThem: { justifyContent: "flex-start" },
  msgAvatar: { width: 32, height: 32, borderRadius: 16 },
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
    backgroundColor: "rgba(124,77,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  msgTextMe: { color: "white", fontSize: 14, lineHeight: 20 },
  msgTextThem: { color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 20 },
  msgTime: { color: "rgba(255,255,255,0.45)", fontSize: 10, alignSelf: "flex-end" },

  // Input
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.1)",
    backgroundColor: "#0f0720",
  },
  safeInputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.1)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 14,
    maxHeight: 80,
    padding: 0,
  },
  emojiBtn: { paddingLeft: 8 },
  sendBtn: { width: 42, height: 42 },
  sendBtnActive: {},
  sendBtnGrad: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom action bar
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 24,
    backgroundColor: "#0f0720",
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.06)",
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(124,77,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
