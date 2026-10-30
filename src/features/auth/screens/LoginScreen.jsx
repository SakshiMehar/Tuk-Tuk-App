import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Button } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { ROUTES } from '@navigation/navigationConstants';

export function LoginScreen({ navigation }) {
  return (
    <Screen backgroundColor={colors.background.primary} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.brandBox}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🛺</Text>
          </View>
          <Text style={styles.appName}>Tuk-Tuk</Text>
          <Text style={styles.tagline}>Voice Parties • Live Battles • Connections</Text>
        </View>

        <View style={styles.actionBox}>
          <Button
            title="Continue with Mobile"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate(ROUTES.AUTH.MOBILE)}
            style={styles.mobileBtn}
          />
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service & Privacy Policy
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  brandBox: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: radii.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    fontSize: 44,
  },
  appName: {
    color: colors.text.primary,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.heavy,
    letterSpacing: 1,
  },
  tagline: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionBox: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  mobileBtn: {
    width: '100%',
  },
  termsText: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default LoginScreen;
