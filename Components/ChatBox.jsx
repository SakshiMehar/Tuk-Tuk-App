import { useState, useRef, useEffect } from "react";
import { Alert } from "react-native";
import { loadChatHistory, markChatAsRead, formatChatTime } from "../src/services/chatService";
import { wsService } from "../src/services/websocket";
import { getAppUserId } from "../src/utils/sessionUser";
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  StatusBar,
} from "react-native";
import { useKeyboardInset } from "../src/hooks/useKeyboardInset";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  UserPlus,
  MoreHorizontal,
  X,
  Send,
  Mic,
  ImageIcon,
  HelpCircle,
  Gift,
  Phone,
  Shield,
} from "lucide-react-native";

const { width: W } = Dimensions.get("window");
const LIMITED_EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "🤗", "😭", "😡", "👍", "🙏", "🎉", "❤️"];

export default function ChatBox({ user = {}, onBack }) {
  const {
    userId = null,
    name = "User",
    avatar = null,
    lastMsg = "",
  } = user;

  const [showBanner, setShowBanner] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [showEmojiBox, setShowEmojiBox] = useState(false);
  const { composerBottom, keyboardHeight, isKeyboardVisible, safeBottom } = useKeyboardInset();
  const scrollRef = useRef(null);
  const [composerHeight, setComposerHeight] = useState(136);

  const mapApiMessage = (m, currentUserId) => ({
    id: String(m.messageId ?? m.id ?? Date.now()),
    text: m.content ?? m.message ?? m.text ?? "",
    fromMe: String(m.senderId) === String(currentUserId),
    time: m.timestamp ? new Date(m.timestamp) : new Date(),
  });

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    const initChat = async () => {
      try {
        
        await wsService.connect();
        const currentUserId = await getAppUserId();
        if (cancelled) return;
        setMyUserId(currentUserId);

        const { messages: apiMessages } = await loadChatHistory(userId);
        if (cancelled) return;
        setMessages(apiMessages.map((m) => mapApiMessage(m, currentUserId)));
        
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);

        await markChatAsRead(userId);
      } catch {
        // APIs logged in chatApi
      }
    };

    initChat();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId || !myUserId) return undefined;

    const unsub = wsService.onMessage((payload) => {
      const senderId = payload?.senderId;
      const receiverId = payload?.receiverId;
      const peerId = String(userId);
      const isThisChat =
        String(senderId) === peerId ||
        String(receiverId) === peerId;

      if (!isThisChat) return;

      const text = payload?.content ?? payload?.message ?? "";
      if (!text) return;

      const id = String(payload?.messageId ?? payload?.id ?? `ws-${Date.now()}`);
      const fromMe = String(senderId) === String(myUserId);

      setMessages((prev) => {
        // Skip duplicate real IDs
        if (prev.some((m) => String(m.id) === id)) return prev;

        // If the server echoes our own message back, replace the optimistic
        // pending entry (same text, fromMe) rather than adding a duplicate.
        const filtered = fromMe
          ? prev.filter((m) => !(m._pending && m.text === text))
          : prev;

        return [
          ...filtered,
          {
            id,
            text,
            fromMe,
            time: payload?.timestamp ? new Date(payload.timestamp) : new Date(),
          },
        ];
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      if (String(senderId) === peerId) {
        markChatAsRead(userId).catch(() => {});
      }
    });

    return unsub;
  }, [userId, myUserId]);

  const sendMessageText = (rawText, { clearComposer = false } = {}) => {
    const text = String(rawText ?? "").trim();
    if (!text || !userId) return;

    // Optimistic update — show the message immediately so the user gets
    // instant feedback. The WS handler deduplicates server echoes later.
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, text, fromMe: true, time: new Date(), _pending: true },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      wsService.sendMessage(String(userId), text);
    } catch (err) {
      // Roll back the optimistic entry on send failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Send failed", err?.message || "WebSocket not connected.");
      return;
    }

    if (clearComposer) setMessage("");
    setShowEmojiBox(false);
  };

  const sendMessage = () => {
    sendMessageText(message, { clearComposer: true });
  };

  const handleEmojiPick = (emoji) => {
    sendMessageText(emoji);
  };
  const showComingSoon = (feature) => {
    Alert.alert("Coming soon", `${feature} will be available soon.`);
  };

  const formatTime = (date) => formatChatTime(date) || date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    if (!isKeyboardVisible) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [isKeyboardVisible, message]);

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

      <View style={styles.bodyWrap}>
        <Modal
          visible={showEmojiBox}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEmojiBox(false)}
        >
          <TouchableOpacity
            style={styles.emojiOverlay}
            activeOpacity={1}
            onPress={() => setShowEmojiBox(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.emojiSheet,
                { bottom: composerBottom + (isKeyboardVisible ? 72 : 126) },
              ]}
              onPress={() => {}}
            >
              <Text style={styles.emojiSheetTitle}>Emojis</Text>
              <View style={styles.emojiGrid}>
                {LIMITED_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiItem}
                    activeOpacity={0.8}
                    onPress={() => handleEmojiPick(emoji)}
                  >
                    <Text style={styles.emojiItemText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <ScrollView
          ref={scrollRef}
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: composerHeight + keyboardHeight + safeBottom + 12,
          }}
          keyboardShouldPersistTaps="handled"
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

          {/* ── USER PROFILE CARD ── */}
          <View style={styles.matchCardWrap}>
            <LinearGradient
              colors={["#1a0a3e", "#2d1065", "#1a0a3e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.matchCard}
            >
              <View style={styles.matchTopRow}>
                <LinearGradient
                  colors={["#7c4dff", "#4a6cf7"]}
                  style={styles.matchAvatarRing}
                >
                  {avatar ? (
                    <Image
                      source={/ngrok-free\.dev|ngrok\.io/i.test(avatar)
                        ? { uri: avatar, headers: { "ngrok-skip-browser-warning": "true" } }
                        : { uri: avatar }}
                      style={styles.matchAvatar}
                    />
                  ) : (
                    <View style={[styles.matchAvatar, styles.matchAvatarPlaceholder]}>
                      <Text style={styles.matchInitial}>{name?.[0]?.toUpperCase() ?? "?"}</Text>
                    </View>
                  )}
                </LinearGradient>
                <View style={styles.matchUserInfo}>
                  <Text style={styles.matchUserName}>{name}</Text>
                  {lastMsg ? (
                    <Text style={styles.matchLastMsg} numberOfLines={2}>{lastMsg}</Text>
                  ) : null}
                </View>
              </View>
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
                    avatar ? (
                      <Image
                        source={/ngrok-free\.dev|ngrok\.io/i.test(avatar)
                          ? { uri: avatar, headers: { "ngrok-skip-browser-warning": "true" } }
                          : { uri: avatar }}
                        style={styles.msgAvatar}
                      />
                    ) : (
                      <View style={[styles.msgAvatar, styles.msgAvatarPlaceholder]}>
                        <Text style={styles.msgInitial}>{name?.[0]?.toUpperCase() ?? "?"}</Text>
                      </View>
                    )
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

        {/* ── COMPOSER (floats above keyboard) ── */}
        <View
          style={[styles.composer, styles.composerFloating, { bottom: composerBottom }]}
          onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}
        >
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
              <TouchableOpacity
                style={styles.emojiBtn}
                activeOpacity={0.8}
                onPress={() => setShowEmojiBox((v) => !v)}
              >
                <Text style={styles.emojiBtnText}>😊</Text>
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

          {!isKeyboardVisible && (
            <View style={styles.actionBar}>
              {[
                { icon: <Mic size={22} color="rgba(167,139,250,0.55)" />, label: "Speaker" },
                { icon: <ImageIcon size={22} color="rgba(167,139,250,0.55)" />, label: "Gallery" },
                { icon: <HelpCircle size={22} color="#7c4dff" />, label: "Help" },
                { icon: <Gift size={22} color="#ff7043" />, label: "Gift" },
                { icon: <Phone size={22} color="rgba(167,139,250,0.55)" />, label: "Call" },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={() => showComingSoon(item.label)}
                >
                  {item.icon}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0720" },
  bodyWrap: { flex: 1, position: "relative" },
  emojiOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  emojiSheet: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "#170b2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.24)",
    padding: 12,
  },
  emojiSheetTitle: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiItem: {
    width: (W - 60) / 6,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,77,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.22)",
  },
  emojiItemText: { fontSize: 20 },
  composer: {
    backgroundColor: "#0f0720",
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.06)",
  },
  composerFloating: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },

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
  matchAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchInitial: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },
  matchUserInfo: {
    flex: 1,
    gap: 4,
  },
  matchUserName: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  matchLastMsg: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "500",
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
  msgAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  msgInitial: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
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
  emojiBtnText: { fontSize: 20 },
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
