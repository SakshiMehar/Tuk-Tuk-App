import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVoiceParty } from "../context/VoicePartyContext";

const PLAYER_SIZE = 66;
const BORDER_RADIUS = 14;
const DEFAULT_MARGIN = 14;

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400";

export default function FloatingVoiceParty() {
  const {
    activeRoomId,
    isMinimized,
    meta,
    floatingPosition,
    restoreRoom,
    updateFloatingPosition,
  } = useVoiceParty();

  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Clamping boundaries respecting Safe Area
  const minX = (insets?.left || 0) + DEFAULT_MARGIN;
  const maxX = Math.max(
    minX,
    windowWidth - (insets?.right || 0) - PLAYER_SIZE - DEFAULT_MARGIN,
  );
  const minY = (insets?.top || 0) + DEFAULT_MARGIN;
  // Position above bottom tab bar (~56dp + margin)
  const maxY = Math.max(
    minY,
    windowHeight - (insets?.bottom || 0) - PLAYER_SIZE - DEFAULT_MARGIN,
  );

  // Default initial position: bottom left, just above bottom tab bar
  const defaultInitialX = minX;
  const defaultInitialY = Math.max(
    minY,
    windowHeight - (insets?.bottom || 0) - PLAYER_SIZE - 64,
  );

  // Resolve starting coordinates
  const currentX =
    floatingPosition && typeof floatingPosition.x === "number"
      ? Math.max(minX, Math.min(maxX, floatingPosition.x))
      : defaultInitialX;
  const currentY =
    floatingPosition && typeof floatingPosition.y === "number"
      ? Math.max(minY, Math.min(maxY, floatingPosition.y))
      : defaultInitialY;

  const pan = useRef(new Animated.ValueXY({ x: currentX, y: currentY })).current;
  const currentPosRef = useRef({ x: currentX, y: currentY });
  const touchStartRef = useRef({ x: currentX, y: currentY, time: 0 });
  const isDraggingRef = useRef(false);

  // Synchronize pan with position state or screen bounds
  useEffect(() => {
    const startX =
      floatingPosition && typeof floatingPosition.x === "number"
        ? Math.max(minX, Math.min(maxX, floatingPosition.x))
        : defaultInitialX;
    const startY =
      floatingPosition && typeof floatingPosition.y === "number"
        ? Math.max(minY, Math.min(maxY, floatingPosition.y))
        : defaultInitialY;
    currentPosRef.current = { x: startX, y: startY };
    pan.setValue({ x: startX, y: startY });
  }, [minX, maxX, minY, maxY, floatingPosition]);

  // Animated 3-bar vertical equalizer soundwave
  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(12)).current;
  const bar3 = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    if (!activeRoomId || !isMinimized) return;

    const isSpeaking = Boolean(meta?.isSpeaking);
    const speed = isSpeaking ? 220 : 360;
    const minH1 = isSpeaking ? 7 : 5;
    const maxH1 = isSpeaking ? 18 : 13;
    const minH2 = isSpeaking ? 11 : 8;
    const maxH2 = isSpeaking ? 24 : 19;
    const minH3 = isSpeaking ? 6 : 4;
    const maxH3 = isSpeaking ? 16 : 11;

    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar1, {
          toValue: maxH1,
          duration: speed,
          useNativeDriver: false,
        }),
        Animated.timing(bar1, {
          toValue: minH1,
          duration: speed * 1.05,
          useNativeDriver: false,
        }),
      ]),
    );

    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar2, {
          toValue: minH2,
          duration: speed * 1.15,
          useNativeDriver: false,
        }),
        Animated.timing(bar2, {
          toValue: maxH2,
          duration: speed * 0.95,
          useNativeDriver: false,
        }),
      ]),
    );

    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar3, {
          toValue: maxH3,
          duration: speed * 0.9,
          useNativeDriver: false,
        }),
        Animated.timing(bar3, {
          toValue: minH3,
          duration: speed * 1.1,
          useNativeDriver: false,
        }),
      ]),
    );

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [activeRoomId, isMinimized, meta?.isSpeaking]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.hypot(gesture.dx, gesture.dy) > 4,
        onPanResponderGrant: () => {
          touchStartRef.current = {
            x: currentPosRef.current.x,
            y: currentPosRef.current.y,
            time: Date.now(),
          };
          isDraggingRef.current = false;
        },
        onPanResponderMove: (_, gesture) => {
          if (Math.hypot(gesture.dx, gesture.dy) > 4) {
            isDraggingRef.current = true;
          }
          const rawX = touchStartRef.current.x + gesture.dx;
          const rawY = touchStartRef.current.y + gesture.dy;
          const clampedX = Math.max(minX, Math.min(maxX, rawX));
          const clampedY = Math.max(minY, Math.min(maxY, rawY));
          currentPosRef.current = { x: clampedX, y: clampedY };
          pan.setValue({ x: clampedX, y: clampedY });
        },
        onPanResponderRelease: (_, gesture) => {
          const dt = Date.now() - touchStartRef.current.time;
          const dist = Math.hypot(gesture.dx, gesture.dy);
          if (dist < 14 && dt < 450) {
            // Tap detected: return back to the active Voice Party room
            restoreRoom();
          } else {
            // Drag end: persist final clamped position across screens
            updateFloatingPosition(currentPosRef.current);
          }
        },
        onPanResponderTerminate: () => {
          updateFloatingPosition(currentPosRef.current);
        },
      }),
    [minX, maxX, minY, maxY, restoreRoom, updateFloatingPosition],
  );

  // Only display when a room is active AND minimized
  if (!activeRoomId || !isMinimized) {
    return null;
  }

  const coverUri = meta?.profileImageUrl || meta?.coverImage || FALLBACK_COVER;

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.playerWrapper,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.cardContainer}>
          {/* Room / Host Cover Image */}
          <Image
            source={{ uri: coverUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          {/* Dark gradient overlay at bottom for equalizer contrast */}
          <LinearGradient
            colors={[
              "transparent",
              "rgba(0, 0, 0, 0.4)",
              "rgba(0, 0, 0, 0.85)",
            ]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* 3-Bar Equalizer Soundwave Visualizer */}
          <View style={styles.equalizerRow} pointerEvents="none">
            <Animated.View style={[styles.eqBar, { height: bar1 }]} />
            <Animated.View style={[styles.eqBar, { height: bar2 }]} />
            <Animated.View style={[styles.eqBar, { height: bar3 }]} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
  playerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    // Drop shadow
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 12,
  },
  cardContainer: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    backgroundColor: "#161328",
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  equalizerRow: {
    position: "absolute",
    bottom: 7,
    left: 0,
    right: 0,
    height: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  eqBar: {
    width: 3.2,
    backgroundColor: "#ffffff",
    borderRadius: 1.6,
    marginHorizontal: 1.8,
  },
});
