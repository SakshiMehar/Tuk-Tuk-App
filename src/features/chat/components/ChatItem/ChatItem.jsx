import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';

export const ChatItem = memo(function ChatItem({ item, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.container}
      onPress={() => onPress(item)}
    >
      <Avatar uri={item.avatar} name={item.name} size={50} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  time: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessage: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.brand.primary,
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: spacing.xs,
  },
  badgeText: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: typography.weights.heavy,
  },
});

export default ChatItem;
