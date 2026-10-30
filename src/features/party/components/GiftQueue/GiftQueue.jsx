import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export const GiftQueue = memo(function GiftQueue({ queue = [] }) {
  if (!queue.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>{queue.length} gifts in queue</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 90,
    right: spacing.lg,
  },
  badge: {
    backgroundColor: colors.background.elevated,
    color: colors.brand.amber,
    fontSize: typography.sizes.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});

export default GiftQueue;
