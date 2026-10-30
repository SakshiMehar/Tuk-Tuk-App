import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Avatar } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { MessageBubble } from '../components/MessageBubble/MessageBubble';
import { ChatInput } from '../components/ChatInput/ChatInput';
import { useChatMessages } from '../hooks/useChatMessages';
import { ROUTES } from '@navigation/navigationConstants';

export function ChatBoxScreen({ route, navigation }) {
  const chatId = route?.params?.chatId || 'c1';
  const name = route?.params?.name || 'Chat';
  const avatar = route?.params?.avatar;

  const { messages, send } = useChatMessages(chatId);

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Avatar uri={avatar} name={name} size={36} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => navigation.navigate(ROUTES.SCREENS.CALL, { callId: `call_${chatId}`, name })}
        >
          <Text style={styles.callIcon}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Message List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} isMe={item.isMe} />
        )}
        contentContainerStyle={styles.messageList}
      />

      {/* Chat Input */}
      <ChatInput onSendMessage={send} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: {
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
  },
  backText: {
    color: colors.text.primary,
    fontSize: 32,
    lineHeight: 32,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  headerStatus: {
    color: colors.state.success,
    fontSize: typography.sizes.xs,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: {
    fontSize: 18,
  },
  messageList: {
    padding: spacing.md,
    flexGrow: 1,
  },
});

export default ChatBoxScreen;
