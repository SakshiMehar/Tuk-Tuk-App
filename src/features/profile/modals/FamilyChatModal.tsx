import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { wsService } from '../../../services/websocket';

interface FamilyChatModalProps {
  visible: boolean;
  family: any;
  onClose: () => void;
}

export const FamilyChatModal: React.FC<FamilyChatModalProps> = ({
  visible,
  family,
  onClose,
}) => {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'welcome',
      text: `Welcome to ${family?.name ?? 'the family'} chat! Say hello to your family members.`,
      senderName: 'System',
      fromMe: false,
      time: new Date(),
    },
  ]);
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    if (visible && family?.id) {
      wsService.connect();
    }
  }, [visible, family?.id]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      text,
      senderName: 'Me',
      fromMe: true,
      time: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageText('');

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a0a2e', '#16082a', '#0d0618']}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safe}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.familyName} numberOfLines={1}>
                {family?.name ?? 'Family Chat'}
              </Text>
              <Text style={styles.familyMembers}>
                {family?.members ?? 1} members • Lv.{family?.level ?? 1}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.msgRow,
                  m.fromMe ? styles.msgRowRight : styles.msgRowLeft,
                ]}
              >
                {!m.fromMe && (
                  <Text style={styles.senderLabel}>{m.senderName}</Text>
                )}
                <View
                  style={[
                    styles.bubble,
                    m.fromMe ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      m.fromMe ? styles.bubbleTextRight : styles.bubbleTextLeft,
                    ]}
                  >
                    {m.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Composer */}
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Type a family message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={messageText}
              onChangeText={setMessageText}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim()}
              style={[
                styles.sendBtn,
                !messageText.trim() && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0618' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  familyName: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  familyMembers: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 2,
  },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  msgRow: {
    maxWidth: '80%',
    gap: 3,
  },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end' },
  senderLabel: {
    color: 'rgba(167,139,250,0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleLeft: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.15)',
  },
  bubbleRight: {
    backgroundColor: '#7c4dff',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextLeft: { color: 'white' },
  bubbleTextRight: { color: 'white' },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(13,6,24,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.25)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7c4dff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});

export default FamilyChatModal;
