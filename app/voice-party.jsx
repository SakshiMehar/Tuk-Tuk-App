import { useState, useRef } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
  LayoutGrid,
} from "lucide-react-native";

const { width: W, height: H } = Dimensions.get("window");

const micSeats = [
  { id: 1, user: null, locked: true },
  {
    id: 2,
    user: {
      name: "T|0|...",
      avatar: "https://randomuser.me/api/portraits/men/11.jpg",
      badge: "🍁",
      rank: 5,
      active: true,
    },
  },
  { id: 3, user: null },
  {
    id: 4,
    user: {
      name: "ziddi_sheh...",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
      badge: "💗",
    },
  },
  {
    id: 5,
    user: {
      name: "Broken 💔...",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      badge: "💗",
    },
  },
  { id: 6, user: null },
  { id: 7, user: null },
  { id: 8, user: null },
  { id: 9, user: null },
  { id: 10, user: null },
];

const initialMessages = [
  {
    id: 1,
    system: true,
    text: "🔥 • T|O|M • 🔥 cleaned the chat",
  },
  {
    id: 2,
    user: "ziddi_shehzadi_99",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
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

export default function VoiceParty() {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef(null);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        level: 3,
        text: inputText.trim(),
        coins: 0,
        diamonds: 0,
      },
    ]);
    setInputText("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── BACKGROUND ── */}
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400" }}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={styles.bgOverlay} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.plusBtn}>
            <Plus size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn}>
              <Share2 size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <MoreVertical size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <Power size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── BADGES ROW ── */}
        <View style={styles.badgesRow}>
          <View style={styles.trophyBadge}>
            <Text style={styles.trophyText}>🏆 9 ›</Text>
          </View>
        </View>

        {/* ── MIC SEATS GRID ── */}
        <View style={styles.seatsGrid}>
          {micSeats.map((seat) => (
            <TouchableOpacity key={seat.id} style={styles.seatItem} activeOpacity={0.8}>
              {seat.user ? (
                <View style={styles.seatUserWrap}>
                  {seat.user.active && (
                    <LinearGradient
                      colors={["#ffd700", "#ff8c00"]}
                      style={styles.activeRing}
                    />
                  )}
                  <Image source={{ uri: seat.user.avatar }} style={styles.seatAvatar} />
                  {seat.user.rank && (
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{seat.user.rank}</Text>
                    </View>
                  )}
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
                  {seat.user.badge} {seat.user.name}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CHAT + RIGHT PANEL ── */}
        <View style={styles.chatArea}>
          <View style={styles.chatLeft}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {messages.map((msg) =>
                msg.system ? (
                  <View key={msg.id} style={styles.systemMsg}>
                    <Text style={styles.systemMsgText}>{msg.text}</Text>
                  </View>
                ) : (
                  <View key={msg.id} style={styles.chatMsg}>
                    <Image source={{ uri: msg.avatar }} style={styles.chatAvatar} />
                    <View style={styles.chatBubble}>
                      <View style={styles.chatMeta}>
                        <Text style={styles.chatUser}>{msg.user}</Text>
                        <View style={styles.lvBadge}>
                          <Text style={styles.lvText}>Lv.{msg.level}</Text>
                        </View>
                        {msg.coins > 0 && <Text style={styles.chatCoin}>🪙 {msg.coins}</Text>}
                        {msg.diamonds > 0 && <Text style={styles.chatDiamond}>💎 {msg.diamonds}</Text>}
                      </View>
                      <Text style={styles.chatText}>{msg.text}</Text>
                    </View>
                  </View>
                )
              )}
            </ScrollView>
          </View>

          {/* Right panel */}
          <View style={styles.chatRight}>
            <TouchableOpacity style={styles.rightIconBtn}>
              <Text style={styles.rightIconEmoji}>🎁</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rightBannerBtn}>
              <Text style={styles.rightBannerText}>🎪</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rightIconBtn}>
              <MessageSquare size={22} color="white" />
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>25</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.takeMicBtn}>
              <Text style={styles.takeMicEmoji}>🎤</Text>
              <Text style={styles.takeMicText}>Take Mic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── BOTTOM BAR ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomIconBtn}
            onPress={() => setIsMuted((v) => !v)}
          >
            {isMuted ? (
              <MicOff size={22} color="white" />
            ) : (
              <Volume2 size={22} color="white" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIconBtn}>
            <Smile size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIconBtn}>
            <MessageSquare size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bottomIconBtn, styles.giftShortcutHighlight]}>
            <Text style={styles.giftShortcutEmoji}>💰</Text>
            <Text style={styles.giftShortcutLabel}>Recharge{"\n"}Bonus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIconBtn}>
            <LayoutGrid size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* ── CHAT INPUT ── */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Say something..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0a2e" },
  bgImage: { position: "absolute", width: W, height: H },
  bgOverlay: {
    position: "absolute",
    width: W,
    height: H,
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
  ownerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#ff4ea3",
  },
  ownerName: { color: "white", fontSize: 13, fontWeight: "700" },
  ownerId: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  plusBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#7c4dff",
    alignItems: "center",
    justifyContent: "center",
  },
  audienceRow: { flexDirection: "row", alignItems: "center" },
  audienceAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1a0a2e",
  },
  audienceCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
  },
  audienceCountText: { color: "white", fontSize: 11, fontWeight: "700" },
  headerRight: { flexDirection: "row", gap: 6 },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 10,
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
  seatItem: { width: SEAT_SIZE, alignItems: "center", gap: 4 },
  seatUserWrap: {
    position: "relative",
    width: SEAT_SIZE - 4,
    height: SEAT_SIZE - 4,
    alignItems: "center",
    justifyContent: "center",
  },
  activeRing: {
    position: "absolute",
    width: SEAT_SIZE - 2,
    height: SEAT_SIZE - 2,
    borderRadius: (SEAT_SIZE - 2) / 2,
  },
  seatAvatar: {
    width: SEAT_SIZE - 10,
    height: SEAT_SIZE - 10,
    borderRadius: (SEAT_SIZE - 10) / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
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
  chatArea: { flex: 1, flexDirection: "row", paddingHorizontal: 12, gap: 8 },
  chatLeft: { flex: 1, maxHeight: 200 },
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
  chatBubble: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    padding: 8,
    flex: 1,
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
  chatCoin: { fontSize: 11, color: "#ffd700" },
  chatDiamond: { fontSize: 11, color: "#4dc8ff" },
  chatText: { color: "white", fontSize: 13 },
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
  rightIconEmoji: { fontSize: 22 },
  rightBannerBtn: {
    width: 44,
    height: 60,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
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
  giftBadgeText: { color: "white", fontSize: 9, fontWeight: "700" },
  takeMicBtn: {
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.7)",
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
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.3)",
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
    backgroundColor: "rgba(124,77,255,0.5)",
    width: 56,
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  giftShortcutEmoji: { fontSize: 18 },
  giftShortcutLabel: {
    color: "#ffd700",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  sendBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 26,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: { color: "white", fontWeight: "700", fontSize: 16 },
});
