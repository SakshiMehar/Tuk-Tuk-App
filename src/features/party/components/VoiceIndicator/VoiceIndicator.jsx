import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii } from '@shared/theme';

export const VoiceIndicator = memo(function VoiceIndicator({ isSpeaking = false }) {
  if (!isSpeaking) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.bar, styles.bar1]} />
      <View style={[styles.bar, styles.bar2]} />
      <View style={[styles.bar, styles.bar3]} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 12,
    gap: 2,
  },
  bar: {
    width: 2.5,
    backgroundColor: colors.party.speakingRing,
    borderRadius: radii.full,
  },
  bar1: { height: 6 },
  bar2: { height: 12 },
  bar3: { height: 8 },
});

export default VoiceIndicator;
