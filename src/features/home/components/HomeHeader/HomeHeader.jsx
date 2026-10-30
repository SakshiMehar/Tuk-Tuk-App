import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export const HomeHeader = memo(function HomeHeader({ onNotificationPress, onWalletPress }) {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Text style={styles.logo}>🛺</Text>
        <Text style={styles.title}>Tuk-Tuk</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={onWalletPress}>
          <Text style={styles.iconText}>💎</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress}>
          <Text style={styles.iconText}>🔔</Text>
        </TouchableOpacity>
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
    backgroundColor: colors.background.primary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    fontSize: 26,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
});

export default HomeHeader;
