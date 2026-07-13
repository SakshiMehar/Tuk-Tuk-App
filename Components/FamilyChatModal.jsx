import { useState, useRef, useEffect, useCallback } from "react";
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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ArrowLeft, Send, UserPlus, AtSign } from "lucide-react-native";
import { useKeyboardInset } from "../src/hooks/useKeyboardInset";
import { wsService } from "../src/services/websocket";
import { getAppUserId } from "../src/utils/sessionUser";
import {
  enterFamilyChatSession,
  exitFamilyChatSession,
  markFamilyMessagesRead,
} from "../src/services/familyService";
import AddFamilyMembersModal from "./AddFamilyMembersModal";

const { width: W } = Dimensions.get("window");

const mapFamilyMessage = (m, currentUserId) => ({
  id: String(m.id ?? m.messageId ?? `family-msg-${Date.now()}`),
  text: m.message ?? m.content ?? m.text ?? "",
  senderName: m.senderName ?? m.userName ?? null,
  fromMe: String(m.senderId ?? m.userId) === String(currentUserId),
  time: m.createdAt || m.timestamp ? new Date(m.createdAt ?? m.timestamp) : new Date(),
});

export default function FamilyChatModal({ visible, family, onClose }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [myUserId, setMyUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const { composerBottom, keyboardHeight, isKeyboardVisible, safeBottom } = useKeyboardInset();
  const scrollRef = useRef(null);
  const [composerHeight, setComposerHeight] = useState(72);

  const familyId = family?.id;

  useEffect(() => {
    if (!visible || !familyId) return undefined;
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      try {
        const currentUserId = await getAppUserId().catch(() => null);
        if (cancelled) return;
        setMyUserId(currentUserId);

        const history = await enterFamilyChatSession(familyId);
        if (cancelled) return;
        setMessages(history.map((m) => mapFamilyMessage(m, currentUserId)));
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);

        markFamilyMessagesRead(familyId).catch(() => {});
      } catch (error) {
        console.error("[FamilyChatModal] Failed to load family chat", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
      exitFamilyChatSession(familyId);
    };
  }, [visible, familyId]);

  useEffect(() => {
    if (!visible || !familyId) return undefined;

    const unsub = wsService.onFamilyChat(String(familyId), (payload) => {
      const mapped = mapFamilyMessage(payload, myUserId);

      setMessages((prev) => {
        if (prev.some((m) => m.id === mapped.id)) return prev;
        const filtered = mapped.fromMe
          ? prev.filter((m) => !(m._pending && m.text === mapped.text))
          : prev;
        return [...filtered, mapped];
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      if (!mapped.fromMe) {
        markFamilyMessagesRead(familyId).catch(() => {});
      }
    });

    return unsub;
  }, [visible, familyId, myUserId]);

  useEffect(() => {
    if (!isKeyboardVisible) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(timer);
  }, [isKeyboardVisible, messageText]);

  const roster = family?.roster ?? [];

  const insertMention = useCallback((member) => {
    setMessageText((prev) => {
      const needsSpace = prev.length > 0 && !/\s$/.test(prev);
      return `${prev}${needsSpace ? " " : ""}@${member.name} `;
    });
    setShowMentionPicker(false);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = messageText.trim();
    if (!text || !familyId) return;

    // Best-effort: tell the backend which roster members were @mentioned.
    // Harmless if it ignores the field; needed if you want server-side
    // mention notifications/highlighting for other clients.
    const mentions = roster
      .filter((m) => text.includes(`@${m.name}`))
      .map((m) => m.userId);

    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, text, fromMe: true, senderName: null, time: new Date(), _pending: true },
    ]);
    setMessageText("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      await wsService.sendFamilyMessage(String(familyId), text, mentions.length ? { mentions } : {});
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Send failed", error?.message || "WebSocket not connected.");
    }
  }, [messageText, familyId, roster]);

  if (!family) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0720" />

        <LinearGradient colors={["#160d30", "#0f0720"]} style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8} onPress={onClose}>
            <ArrowLeft size={22} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerName} numberOfLines={1}>{family.name}</Text>
            <Text style={styles.headerMeta}>{family.members} members</Text>
          </View>
          {family.owner ? (
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.8}
              onPress={() => setShowAddMembers(true)}
            >
              <UserPlus size={20} color="#a78bfa" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </LinearGradient>

        <ScrollView
          ref={scrollRef}
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: composerHeight + keyboardHeight + safeBottom + 12,
            paddingTop: 12,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {family.announcement ? (
            <View style={styles.announcementWrap}>
              <Text style={styles.announcementLabel}>📢 Announcement</Text>
              <Text style={styles.announcementText}>{family.announcement}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>Loading messages…</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet — say hi to the family!</Text>
            </View>
          ) : (
            <View style={styles.messagesList}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.msgRow, msg.fromMe ? styles.msgRowMe : styles.msgRowThem]}
                >
                  <View style={[styles.msgBubble, msg.fromMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
                    {msg.fromMe ? (
                      <LinearGradient
                        colors={["#5b21b6", "#7c4dff"]}
                        style={styles.msgBubbleGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.msgTextMe}>{msg.text}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.msgBubbleThemInner}>
                        {msg.senderName ? (
                          <Text style={styles.msgSenderName}>{msg.senderName}</Text>
                        ) : null}
                        <Text style={styles.msgTextThem}>{msg.text}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View
          style={[styles.composer, { bottom: composerBottom }]}
          onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}
        >
          <TouchableOpacity
            style={styles.mentionBtn}
            activeOpacity={0.8}
            onPress={() => setShowMentionPicker(true)}
          >
            <AtSign size={20} color="#a78bfa" />
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Message the family..."
              placeholderTextColor="rgba(167,139,250,0.4)"
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
          </View>
          <TouchableOpacity
            style={styles.sendBtn}
            activeOpacity={0.8}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <LinearGradient
              colors={
                messageText.trim()
                  ? ["#7c4dff", "#4a6cf7"]
                  : ["rgba(124,77,255,0.25)", "rgba(74,108,247,0.25)"]
              }
              style={styles.sendBtnGrad}
            >
              <Send size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showMentionPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMentionPicker(false)}
        >
          <TouchableOpacity
            style={styles.mentionOverlay}
            activeOpacity={1}
            onPress={() => setShowMentionPicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.mentionSheet, { bottom: composerBottom + (isKeyboardVisible ? 60 : 76) }]}
              onPress={() => {}}
            >
              <Text style={styles.mentionSheetTitle}>Mention someone</Text>
              {roster.length === 0 ? (
                <Text style={styles.mentionEmptyText}>
                  No member list available yet — the family detail response doesn't
                  include a member roster.
                </Text>
              ) : (
                <ScrollView style={styles.mentionList} keyboardShouldPersistTaps="handled">
                  {roster.map((m) => (
                    <TouchableOpacity
                      key={String(m.userId)}
                      style={styles.mentionRow}
                      activeOpacity={0.8}
                      onPress={() => insertMention(m)}
                    >
                      {m.avatarUrl ? (
                        <Image source={{ uri: m.avatarUrl }} style={styles.mentionAvatar} />
                      ) : (
                        <View style={styles.mentionAvatarFallback}>
                          <Ionicons name="person" size={16} color="#a78bfa" />
                        </View>
                      )}
                      <Text style={styles.mentionName} numberOfLines={1}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <AddFamilyMembersModal
          visible={showAddMembers}
          family={family}
          onClose={() => setShowAddMembers(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0720" },
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
  headerTitleWrap: { flex: 1, alignItems: "center" },
  headerName: { color: "white", fontSize: 17, fontWeight: "700" },
  headerMeta: { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 },

  body: { flex: 1 },

  announcementWrap: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  announcementLabel: { color: "#a78bfa", fontSize: 12, fontWeight: "700", marginBottom: 4 },
  announcementText: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 18 },

  emptyChat: { alignItems: "center", justifyContent: "center", paddingTop: 60, paddingHorizontal: 30 },
  emptyChatText: { color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" },

  messagesList: { paddingHorizontal: 14, gap: 10 },
  msgRow: { flexDirection: "row" },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowThem: { justifyContent: "flex-start" },
  msgBubble: { maxWidth: W * 0.72 },
  msgBubbleMe: {},
  msgBubbleThem: {},
  msgBubbleGrad: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleThemInner: {
    backgroundColor: "rgba(124,77,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgSenderName: { color: "#a78bfa", fontSize: 11, fontWeight: "700", marginBottom: 2 },
  msgTextMe: { color: "white", fontSize: 14, lineHeight: 20 },
  msgTextThem: { color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 20 },

  composer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.1)",
    backgroundColor: "#0f0720",
    zIndex: 20,
    elevation: 20,
  },
  inputRow: {
    flex: 1,
    backgroundColor: "rgba(124,77,255,0.1)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  input: { color: "white", fontSize: 14, maxHeight: 80, padding: 0 },
  mentionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: { width: 42, height: 42 },
  sendBtnGrad: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  mentionOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  mentionSheet: {
    position: "absolute",
    left: 12,
    right: 12,
    maxHeight: 280,
    backgroundColor: "#170b2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.24)",
    padding: 12,
  },
  mentionSheetTitle: { color: "white", fontSize: 13, fontWeight: "700", marginBottom: 8 },
  mentionEmptyText: { color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 17, paddingVertical: 8 },
  mentionList: { maxHeight: 220 },
  mentionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  mentionAvatar: { width: 30, height: 30, borderRadius: 15 },
  mentionAvatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(124,77,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  mentionName: { color: "white", fontSize: 14, fontWeight: "600", flex: 1 },
});
