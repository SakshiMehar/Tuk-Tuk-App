import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Screen } from '@shared/components';
import { colors, typography, spacing } from '@shared/theme';
import { ROUTES } from '@navigation/navigationConstants';
import { ChatItem } from '../components/ChatItem/ChatItem';

const MOCK_CHATS = [
  { id: 'c1', name: 'Zoya Khan', lastMessage: 'Are you joining the voice party?', time: '12:45 PM', unreadCount: 2, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 'c2', name: 'Tuk-Tuk Official', lastMessage: 'You received 500 Diamonds bonus!', time: 'Yesterday', unreadCount: 0, avatar: null },
  { id: 'c3', name: 'Kabir Singhania', lastMessage: 'See you in the PK battle tonight.', time: 'Oct 28', unreadCount: 0, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
];

export function ChatListScreen({ navigation }) {
  const handleChatPress = (chat) => {
    navigation.navigate(ROUTES.SCREENS.CHAT_BOX, {
      chatId: chat.id,
      name: chat.name,
      avatar: chat.avatar,
    });
  };

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem item={item} onPress={handleChatPress} />
        )}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  list: {
    paddingVertical: spacing.sm,
  },
});

export default ChatListScreen;
