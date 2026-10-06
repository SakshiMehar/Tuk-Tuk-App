import { ListMusic, Pause, Play, SkipForward, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Dimensions, PanResponder, Animated as RNAnimated, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const MiniMusicPlayer = ({ isPlaying, onTogglePlay, onNext, onOpenPlaylist, onClose }) => {
  const rotation = useSharedValue(0);

  // Dragging logic
  const pan = useRef(new RNAnimated.ValueXY()).current;
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        // Only start dragging if user moves finger a bit (prevents blocking taps)
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: RNAnimated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();

        // Optional: you can add boundaries here if you want it to snap to edges
        // Or just let them drop it wherever.
      }
    })
  ).current;

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying]);

  const animatedVinylStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <RNAnimated.View
      style={[
        styles.container,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.playerInner}>
        {/* Vinyl Record */}
        <Animated.View style={[styles.vinylContainer, animatedVinylStyle]}>
          <View style={styles.vinylBorder}>
            <View style={styles.vinylCenter} />
          </View>
        </Animated.View>

        {/* Play/Pause Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onTogglePlay}
        >
          {isPlaying ? (
            <Pause size={24} color="white" fill="white" />
          ) : (
            <Play size={24} color="white" fill="white" />
          )}
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onNext}>
          <SkipForward size={24} color="white" fill="white" />
        </TouchableOpacity>

        {/* Playlist/Queue Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onOpenPlaylist}>
          <ListMusic size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <X size={14} color="white" />
      </TouchableOpacity>
    </RNAnimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    zIndex: 100,
  },
  playerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 16,
    paddingRight: 24,
  },
  vinylContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  vinylBorder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff5722', // Label color
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000', // Hole
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default MiniMusicPlayer;
