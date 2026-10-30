import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export const RoomStatus = memo(function RoomStatus({ status = 'CONNECTED' }) {
  const isOk = status === 'CONNECTED';

  return (
    <View style={styles.container}>
      <View style={[styles.dot, isOk ? styles.dotOk : styles.dotWarn]} />
      <Text style={styles.text}>{status}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.overlay.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginVertical: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    marginRight: 4,
  },
  dotOk: {
    backgroundColor: colors.state.success,
  },
  dotWarn: {
    backgroundColor: colors.state.warning,
  },
  text: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
});

export default RoomStatus;
