import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';
import Avatar from '@shared/components/Avatar/Avatar';

/**
 * Seat component
 * Memoized so only the seat whose user/speaking state changed re-renders!
 */
export const Seat = memo(
  function Seat({
    seat,
    isSpeaking = false,
    volume = 0,
    onPressSeat,
  }) {
    const { index, userId, userName, userAvatar, isMuted, isLocked, isHost } = seat;
    const isEmpty = !userId;

    const handlePress = () => {
      if (onPressSeat) {
        onPressSeat(seat);
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.container}
      >
        <View style={styles.seatWrapper}>
          {isEmpty ? (
            <View style={[styles.emptySeat, isLocked && styles.lockedSeat]}>
              <Text style={styles.emptyIcon}>{isLocked ? '🔒' : '+'}</Text>
            </View>
          ) : (
            <Avatar
              uri={userAvatar}
              name={userName || `User ${index + 1}`}
              size={54}
              isSpeaking={isSpeaking}
              isMuted={isMuted}
              showStatus
            />
          )}

          {isHost && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>HOST</Text>
            </View>
          )}

          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {isEmpty ? (isLocked ? 'Locked' : 'Take Seat') : userName}
        </Text>
      </TouchableOpacity>
    );
  },
  (prev, next) => {
    // Only re-render if seat data, speaking state or volume changed
    return (
      prev.seat.userId === next.seat.userId &&
      prev.seat.isMuted === next.seat.isMuted &&
      prev.seat.isLocked === next.seat.isLocked &&
      prev.seat.userName === next.seat.userName &&
      prev.seat.userAvatar === next.seat.userAvatar &&
      prev.isSpeaking === next.isSpeaking &&
      prev.volume === next.volume
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '25%',
    paddingVertical: spacing.sm,
  },
  seatWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  emptySeat: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.party.seatBorder,
    backgroundColor: colors.party.emptySeat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedSeat: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.state.error,
  },
  emptyIcon: {
    color: colors.text.muted,
    fontSize: 20,
    fontWeight: typography.weights.bold,
  },
  hostBadge: {
    position: 'absolute',
    top: -4,
    backgroundColor: colors.brand.amber,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  hostBadgeText: {
    color: colors.text.inverse,
    fontSize: 8,
    fontWeight: typography.weights.heavy,
  },
  indexBadge: {
    position: 'absolute',
    bottom: -2,
    left: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: radii.full,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: colors.text.muted,
    fontSize: 8,
    fontWeight: typography.weights.bold,
  },
  name: {
    marginTop: spacing.xxs,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    maxWidth: 70,
    textAlign: 'center',
  },
});

export default Seat;
