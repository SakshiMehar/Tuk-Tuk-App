import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Screen, Button } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { ROUTES } from '@navigation/navigationConstants';
import { isValidPhoneNumber } from '@shared/utils';
import { useAuth } from '../hooks/useAuth';

export function MobileScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const { sendOtp, loading } = useAuth();

  const handleNext = async () => {
    if (!isValidPhoneNumber(phone)) return;
    const ok = await sendOtp(phone);
    if (ok) {
      navigation.navigate(ROUTES.AUTH.OTP, { phone });
    }
  };

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Enter Mobile Number</Text>
        <Text style={styles.subtitle}>We will send a 6-digit verification code</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="98765 43210"
            placeholderTextColor={colors.text.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
            autoFocus
          />
        </View>

        <Button
          title="Send OTP"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!isValidPhoneNumber(phone)}
          onPress={handleNext}
          style={styles.submitBtn}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    height: 52,
  },
  countryCode: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
  },
  submitBtn: {
    marginTop: spacing.xl,
  },
});

export default MobileScreen;
