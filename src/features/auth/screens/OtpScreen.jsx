import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Screen, Button } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { isValidOtp } from '@shared/utils';
import { useAuth } from '../hooks/useAuth';

export function OtpScreen({ route }) {
  const phone = route?.params?.phone || '';
  const [otp, setOtp] = useState('');
  const { verifyOtp, loading, error } = useAuth();

  const handleVerify = async () => {
    if (!isValidOtp(otp, 6)) return;
    await verifyOtp(phone, otp);
  };

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>Sent to +91 {phone}</Text>

        <TextInput
          style={styles.otpInput}
          placeholder="123456"
          placeholderTextColor={colors.text.muted}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          title="Verify & Continue"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!isValidOtp(otp, 6)}
          onPress={handleVerify}
          style={styles.verifyBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  otpInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.highlight,
    height: 54,
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: typography.weights.bold,
  },
  errorText: {
    color: colors.state.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  verifyBtn: {
    marginTop: spacing.xl,
  },
});

export default OtpScreen;
