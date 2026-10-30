import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export const GiftOverlay = memo(function GiftOverlay({ activeGift }) {
  if (!activeGift) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.banner}>
        <Text style={styles.icon}>{activeGift.icon || '🎁'}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.sender}>
            {activeGift.senderName || 'Someone'}{' '}
            <Text style={styles.action}>sent a</Text>{' '}
            <Text style={styles.giftName}>{activeGift.name || 'Gift'}</Text>
          </Text>
          <Text style={styles.receiver}>to {activeGift.receiverName || 'Room'}</Text>
        </View>
        <Text style={styles.combo}>x{activeGift.combo || 1}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 120,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 100,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 27, 75, 0.9)',
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  icon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  sender: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  action: {
    color: colors.text.secondary,
    fontWeight: typography.weights.regular,
  },
  giftName: {
    color: colors.brand.amber,
  },
  receiver: {
    color: colors.text.muted,
    fontSize: 10,
  },
  combo: {
    color: colors.brand.amber,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    marginLeft: spacing.sm,
  },
});

export default GiftOverlay;
