import { ListMusic, Minus, Pause, Play, Plus, SkipForward, Volume1, Volume2, VolumeX, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, PanResponder, Animated as RNAnimated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const MiniMusicPlayer = ({
  isPlaying,
  volume = 80,
  onVolumeChange,
  onTogglePlay,
  onNext,
  onOpenPlaylist,
  onClose,
}) => {
  const rotation = useSharedValue(0);
  const [showVolume, setShowVolume] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);
  const localVolumeRef = useRef(volume);
  localVolumeRef.current = localVolume;

  const isInteractingWithVolume = useRef(false);
  const [sliderWidth, setSliderWidth] = useState(105);
  const sliderWidthRef = useRef(105);
  sliderWidthRef.current = sliderWidth;

  const touchStartX = useRef(0);
  const touchStartVol = useRef(localVolume);

  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  const updateVolume = useCallback((val) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setLocalVolume(clamped);
    if (onVolumeChange) {
      onVolumeChange(clamped);
    }
  }, [onVolumeChange]);

  const handleStep = useCallback((delta) => {
    updateVolume(localVolumeRef.current + delta);
  }, [updateVolume]);

  const lastNonZeroVol = useRef(volume > 0 ? volume : 80);
  const handleToggleMute = useCallback(() => {
    if (localVolumeRef.current > 0) {
      lastNonZeroVol.current = localVolumeRef.current;
      updateVolume(0);
    } else {
      updateVolume(lastNonZeroVol.current || 80);
    }
  }, [updateVolume]);

  // Volume slider PanResponder
  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        isInteractingWithVolume.current = true;
        touchStartX.current = evt.nativeEvent.pageX;
        touchStartVol.current = localVolumeRef.current;
        const width = sliderWidthRef.current || 105;
        if (evt.nativeEvent.locationX != null) {
          const directVol = Math.max(0, Math.min(100, Math.round((evt.nativeEvent.locationX / width) * 100)));
          touchStartVol.current = directVol;
          updateVolume(directVol);
        }
      },
      onPanResponderMove: (evt) => {
        const width = sliderWidthRef.current || 105;
        const deltaX = evt.nativeEvent.pageX - touchStartX.current;
        const deltaVol = (deltaX / width) * 100;
        const nextVol = Math.max(0, Math.min(100, Math.round(touchStartVol.current + deltaVol)));
        updateVolume(nextVol);
      },
      onPanResponderRelease: () => {
        setTimeout(() => {
          isInteractingWithVolume.current = false;
        }, 150);
      },
      onPanResponderTerminate: () => {
        isInteractingWithVolume.current = false;
      },
    })
  ).current;

  // Dragging logic for the mini player
  const pan = useRef(new RNAnimated.ValueXY()).current;
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        if (isInteractingWithVolume.current) return false;
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
      {/* Volume Control Popup (Slow & Tez Buttons + Smooth Slider) */}
      {showVolume && (
        <View style={styles.volumePopup}>
          {/* Mute / Unmute */}
          <TouchableOpacity
            style={styles.volStepBtn}
            onPress={handleToggleMute}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          >
            {localVolume === 0 ? (
              <VolumeX size={16} color="#ff5722" />
            ) : localVolume < 50 ? (
              <Volume1 size={16} color="#bbb" />
            ) : (
              <Volume2 size={16} color="#bbb" />
            )}
          </TouchableOpacity>

          {/* Slow / Decrease Volume */}
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => handleStep(-10)}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          >
            <Minus size={13} color="white" />
          </TouchableOpacity>

          {/* Volume Slider Bar */}
          <View
            style={styles.sliderTrackWrapper}
            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
            {...sliderPanResponder.panHandlers}
          >
            <View style={styles.sliderTrackBg}>
              <View style={[styles.sliderTrackFill, { width: `${localVolume}%` }]} />
            </View>
            <View
              style={[
                styles.sliderThumb,
                { left: `${Math.max(0, Math.min(100, localVolume))}%` }
              ]}
            />
          </View>

          {/* Tez / Increase Volume */}
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => handleStep(10)}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          >
            <Plus size={13} color="white" />
          </TouchableOpacity>

          {/* Percentage */}
          <Text style={styles.volumeText}>{localVolume}%</Text>
        </View>
      )}

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
            <Pause size={22} color="white" fill="white" />
          ) : (
            <Play size={22} color="white" fill="white" />
          )}
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onNext}>
          <SkipForward size={22} color="white" fill="white" />
        </TouchableOpacity>

        {/* Volume Button (Slow / Tez toggle) */}
        <TouchableOpacity
          style={[styles.iconButton, showVolume && styles.iconButtonActive]}
          onPress={() => setShowVolume((prev) => !prev)}
          activeOpacity={0.7}
        >
          {localVolume === 0 ? (
            <VolumeX size={20} color="#ff5722" />
          ) : localVolume < 50 ? (
            <Volume1 size={20} color={showVolume ? "#ff5722" : "white"} />
          ) : (
            <Volume2 size={20} color={showVolume ? "#ff5722" : "white"} />
          )}
        </TouchableOpacity>

        {/* Playlist/Queue Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onOpenPlaylist}>
          <ListMusic size={22} color="white" />
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
  volumePopup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 28, 38, 0.95)',
    borderRadius: 22,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 8,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 6,
    gap: 8,
  },
  volStepBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrackWrapper: {
    width: 105,
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBg: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: '#ff5722',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ff5722',
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 4,
  },
  volumeText: {
    color: '#ff5722',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 34,
    textAlign: 'right',
  },
  playerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 40, 50, 0.85)',
    borderRadius: 40,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 12,
    paddingRight: 20,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255, 87, 34, 0.25)',
    borderWidth: 1,
    borderColor: '#ff5722',
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
