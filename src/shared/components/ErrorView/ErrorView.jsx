import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@shared/theme';
import Button from '../Button/Button';

export function ErrorView({
  title = 'Something went wrong',
  message = 'Please check your connection and try again.',
  onRetry,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="primary"
          size="md"
          style={styles.retryBtn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.state.error,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.xl,
    minWidth: 140,
  },
});

export default ErrorView;
