import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@shared/theme';

export function Loader({ message = 'Loading...', size = 'large' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.brand.primary} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  text: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
  },
});

export default Loader;
