import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Seat } from '../Seat/Seat';
import { spacing } from '@shared/theme';

/**
 * SeatGrid - Displays room seats in a 4x2 grid
 * Memoized container that delegates individual seat updates to memoized Seat components.
 */
export const SeatGrid = memo(function SeatGrid({
  seats = [],
  speakingUsers = {},
  onPressSeat,
}) {
  return (
    <View style={styles.grid}>
      {seats.map((seat) => {
        const isSpeaking = seat.userId ? Boolean(speakingUsers[seat.userId]) : false;
        const volume = seat.userId ? speakingUsers[seat.userId] || 0 : 0;

        return (
          <Seat
            key={seat.index}
            seat={seat}
            isSpeaking={isSpeaking}
            volume={volume}
            onPressSeat={onPressSeat}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    justifyContent: 'space-around',
  },
});

export default SeatGrid;
