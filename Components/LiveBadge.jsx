import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * Green Live Indicator Dot displayed at the bottom right of user profile avatars.
 */
export default function LiveBadge({
  size = "small", // "small" | "medium" | "large" | number
  style,
  borderColor = "#ffffff",
  showPulse = true,
  dotColor = "#00e676",
}) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (!showPulse) return;
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 900 }),
        withTiming(0.6, { duration: 900 })
      ),
      -1,
      true
    );
  }, [showPulse, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const numericSize =
    typeof size === "number"
      ? size
      : size === "large"
      ? 16
      : size === "medium"
      ? 13
      : 10;

  const borderWidth = numericSize >= 15 ? 2.5 : numericSize >= 12 ? 2 : 1.5;

  return (
    <View
      style={[
        styles.container,
        {
          width: numericSize + 4,
          height: numericSize + 4,
        },
        style,
      ]}
    >
      {showPulse && (
        <Animated.View
          style={[
            styles.pulseGlow,
            {
              width: numericSize,
              height: numericSize,
              borderRadius: numericSize / 2,
              backgroundColor: dotColor,
            },
            pulseStyle,
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: numericSize,
            height: numericSize,
            borderRadius: numericSize / 2,
            backgroundColor: dotColor,
            borderColor: borderColor,
            borderWidth: borderWidth,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseGlow: {
    position: "absolute",
    opacity: 0.5,
  },
  dot: {
    shadowColor: "#00e676",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 2,
    elevation: 3,
  },
});

