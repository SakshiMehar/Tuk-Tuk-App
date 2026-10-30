import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export const PartyControls = memo(function PartyControls({
  isMuted = false,
  onToggleMute,
  onOpenChat,
  onOpenGifts,
  onOpenPk,
  onOpenTreasure,
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.chatTrigger}
        onPress={onOpenChat}
        activeOpacity={0.7}
      >
        <Text style={styles.chatTriggerText}>Say something...</Text>
      </TouchableOpacity>

      <View style={styles.buttonsGroup}>
        {onToggleMute && (
          <TouchableOpacity
            style={[styles.circleBtn, isMuted && styles.mutedBtn]}
            onPress={onToggleMute}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
          </TouchableOpacity>
        )}

        {onOpenPk && (
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={onOpenPk}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>⚔️</Text>
          </TouchableOpacity>
        )}

        {onOpenTreasure && (
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={onOpenTreasure}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>🎁</Text>
          </TouchableOpacity>
        )}

        {onOpenGifts && (
          <TouchableOpacity
            style={[styles.circleBtn, styles.giftBtn]}
            onPress={onOpenGifts}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>💎</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.overlay.glass,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  chatTrigger: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
  },
  chatTriggerText: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
  },
  buttonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedBtn: {
    backgroundColor: colors.state.error,
  },
  giftBtn: {
    backgroundColor: colors.brand.secondary,
  },
  btnIcon: {
    fontSize: 20,
  },
});

export default PartyControls;
