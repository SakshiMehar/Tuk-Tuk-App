import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Avatar } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';

export function CallScreen({ route, navigation }) {
  const name = route?.params?.name || 'User';
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEndCall = () => {
    navigation.goBack();
  };

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.topInfo}>
          <Text style={styles.status}>Connected</Text>
          <Text style={styles.timer}>{formatDuration(callDuration)}</Text>
        </View>

        <View style={styles.avatarBox}>
          <Avatar name={name} size={110} />
          <Text style={styles.callerName}>{name}</Text>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.mutedBtn]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Text style={styles.btnIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
            <Text style={styles.endIcon}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn}>
            <Text style={styles.btnIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  topInfo: {
    alignItems: 'center',
  },
  status: {
    color: colors.state.success,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  timer: {
    color: colors.text.secondary,
    fontSize: typography.sizes.lg,
    marginTop: spacing.xs,
  },
  avatarBox: {
    alignItems: 'center',
  },
  callerName: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedBtn: {
    backgroundColor: colors.state.error,
  },
  btnIcon: {
    fontSize: 24,
  },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: radii.full,
    backgroundColor: colors.state.error,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
  endIcon: {
    fontSize: 28,
  },
});

export default CallScreen;
