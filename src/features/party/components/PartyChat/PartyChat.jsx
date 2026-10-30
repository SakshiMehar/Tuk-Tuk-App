import React, { memo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export const PartyChat = memo(function PartyChat({ messages = [] }) {
  const renderItem = ({ item }) => (
    <View style={styles.messageBubble}>
      <Text style={styles.senderName}>{item.senderName || 'Guest'}: </Text>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        inverted
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 180,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-end',
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  messageBubble: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginVertical: 2,
    alignSelf: 'flex-start',
  },
  senderName: {
    color: colors.brand.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  messageText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
  },
});

export default PartyChat;
