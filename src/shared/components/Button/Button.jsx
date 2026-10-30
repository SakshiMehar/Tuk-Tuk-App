import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) {
  const getContainerStyle = () => {
    const base = [styles.button, styles[`size_${size}`]];
    if (disabled || loading) {
      base.push(styles.disabled);
    } else {
      base.push(styles[`variant_${variant}`]);
    }
    return base;
  };

  const getTextStyle = () => {
    return [
      styles.text,
      styles[`textSize_${size}`],
      styles[`textVariant_${variant}`],
      textStyle,
    ];
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.brand.primary : colors.text.primary}
        />
      ) : (
        <>
          {icon ? icon : null}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  // Variants
  variant_primary: {
    backgroundColor: colors.brand.primary,
  },
  variant_secondary: {
    backgroundColor: colors.background.elevated,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: colors.background.tertiary,
    opacity: 0.6,
  },
  // Sizes
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 34,
  },
  size_md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 46,
  },
  size_lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    height: 54,
  },
  // Text
  text: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  textVariant_primary: {
    color: colors.text.primary,
  },
  textVariant_secondary: {
    color: colors.text.primary,
  },
  textVariant_outline: {
    color: colors.brand.primary,
  },
  textVariant_ghost: {
    color: colors.text.secondary,
  },
  textSize_sm: {
    fontSize: typography.sizes.sm,
  },
  textSize_md: {
    fontSize: typography.sizes.md,
  },
  textSize_lg: {
    fontSize: typography.sizes.lg,
  },
});

export default Button;
