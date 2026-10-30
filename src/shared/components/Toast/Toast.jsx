import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export function Toast({ message, type = 'info' }) {
  if (!message) return null;

  const bgStyle = type === 'error'
    ? { backgroundColor: colors.state.error }
    : type === 'success'
    ? { backgroundColor: colors.state.success }
    : { backgroundColor: colors.background.elevated };

  return (
    <View style={[styles.container, bgStyle]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  text: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});

export default Toast;
