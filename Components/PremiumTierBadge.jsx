import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Circle, Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageSource } from "../src/utils/videoSource";

const GOLD_RING = ["#fff6d8", "#f7d774", "#c9932c", "#f7d774", "#fff6d8"];
const LOCKED_RING = ["rgba(255,255,255,0.35)", "rgba(255,255,255,0.12)"];
const GEM_GRADIENT = ["#7c4dff", "#e879f9"];
const LOCKED_GEM_GRADIENT = ["rgba(124,77,255,0.25)", "rgba(232,121,249,0.15)"];

// Gold-ringed medallion button used to represent a premium tier (e.g. on a
// Premium/tier-select screen). Pass `image` for a real tier crest asset, or
// fall back to `icon` for a placeholder gem glyph.
export default function PremiumTierBadge({
  label,
  image,
  icon = "diamond",
  size = 110,
  active = false,
  locked = false,
  onPress,
}) {
  const ringColors = locked ? LOCKED_RING : GOLD_RING;
  const gemColors = locked ? LOCKED_GEM_GRADIENT : active ? [...GEM_GRADIENT].reverse() : GEM_GRADIENT;
  const innerSize = size - 20;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={styles.wrap}
    >
      <View style={[styles.ringOuter, { width: size, height: size, borderRadius: size / 2 }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgLinearGradient id="premiumRing" x1="0%" y1="0%" x2="100%" y2="100%">
              {ringColors.map((color, i) => (
                <Stop key={color + i} offset={`${(i / (ringColors.length - 1)) * 100}%`} stopColor={color} />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Circle
            cx="50%"
            cy="50%"
            r={size / 2 - 3}
            stroke="url(#premiumRing)"
            strokeWidth={5}
            fill="none"
          />
        </Svg>

        <LinearGradient
          colors={gemColors}
          style={[styles.gemInner, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}
        >
          {image ? (
            <Image source={resolveImageSource(image)} style={styles.gemImage} resizeMode="contain" />
          ) : (
            <Ionicons name={icon} size={size * 0.38} color={locked ? "rgba(255,255,255,0.4)" : "white"} />
          )}
        </LinearGradient>

        {active ? (
          <View style={styles.activeDot}>
            <Ionicons name="checkmark" size={12} color="#1a0a2e" />
          </View>
        ) : null}
        {locked ? (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.65)" />
          </View>
        ) : null}
      </View>

      {label ? (
        <View style={styles.labelRibbon}>
          <Svg width="100%" height="100%" viewBox="0 0 100 34" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
            <Polygon
              points="6,0 94,0 100,17 94,34 6,34 0,17"
              fill="rgba(59,26,120,0.9)"
              stroke={locked ? "rgba(255,255,255,0.2)" : "#f7d774"}
              strokeWidth={1.2}
            />
          </Svg>
          <Text style={[styles.labelText, locked && styles.labelTextLocked]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  ringOuter: {
    alignItems: "center",
    justifyContent: "center",
  },
  gemInner: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gemImage: {
    width: "100%",
    height: "100%",
  },
  activeDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f7d774",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#1a0a2e",
  },
  lockBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(26,10,46,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  labelRibbon: {
    width: 92,
    height: 28,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  labelTextLocked: {
    color: "rgba(255,255,255,0.45)",
  },
});
