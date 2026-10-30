import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@shared/theme';
import { formatCompactNumber } from '@shared/utils';

export const UserStats = memo(function UserStats({ followers = 0, following = 0, diamonds = 0 }) {
  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <Text style={styles.value}>{formatCompactNumber(followers)}</Text>
        <Text style={styles.label}>Followers</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statBox}>
        <Text style={styles.value}>{formatCompactNumber(following)}</Text>
        <Text style={styles.label}>Following</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statBox}>
        <Text style={styles.value}>{formatCompactNumber(diamonds)}</Text>
        <Text style={styles.label}>Diamonds</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    marginVertical: spacing.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  label: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.light,
  },
});

export default UserStats;
