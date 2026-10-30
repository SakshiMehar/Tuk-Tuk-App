import React, { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, radii } from '@shared/theme';

export const Avatar = memo(function Avatar({
  uri,
  name = '?',
  size = 48,
  isSpeaking = false,
  isMuted = false,
  showStatus = false,
  style,
}) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const ringStyle = isSpeaking
    ? [styles.ring, styles.speakingRing, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]
    : null;

  return (
    <View style={[styles.wrapper, style]}>
      {ringStyle && <View style={ringStyle} />}
      <View style={[styles.avatarBox, containerStyle]}>
        {uri ? (
          <Image source={{ uri }} style={[styles.image, containerStyle]} />
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        )}
      </View>
      {showStatus && isMuted && (
        <View style={styles.mutedBadge}>
          <Text style={styles.mutedText}>✕</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBox: {
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  speakingRing: {
    borderColor: colors.party.speakingRing,
  },
  mutedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.state.error,
    borderRadius: radii.full,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    color: colors.text.primary,
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
});

export default Avatar;
