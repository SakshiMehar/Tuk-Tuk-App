import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export const PartyHeader = memo(function PartyHeader({
  room,
  onlineCount = 0,
  onExitPress,
  onFollowPress,
}) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>👑</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {room?.title || 'Party Room'}
          </Text>
          <Text style={styles.subtitle}>
            Host: {room?.hostName || 'Anonymous'} • {onlineCount} online
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onFollowPress && (
          <TouchableOpacity style={styles.followBtn} onPress={onFollowPress}>
            <Text style={styles.followText}>+ Follow</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.exitBtn} onPress={onExitPress}>
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.overlay.glass,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  followBtn: {
    backgroundColor: colors.brand.secondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
  },
  followText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  exitBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});

export default PartyHeader;
