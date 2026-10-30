import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radii } from '@shared/theme';

export const LevelBadge = memo(function LevelBadge({ level = 1 }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Lv.{level}</Text>
    </View>
  );
});

export const VipBadge = memo(function VipBadge({ isVip = false, vipLevel = 1 }) {
  if (!isVip) return null;

  return (
    <View style={styles.vipBadge}>
      <Text style={styles.vipText}>VIP {vipLevel}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  text: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  vipBadge: {
    backgroundColor: colors.brand.amber,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginLeft: 6,
  },
  vipText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
  },
});
