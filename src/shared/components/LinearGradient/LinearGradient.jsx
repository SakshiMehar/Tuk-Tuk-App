import React, { memo, useState, useCallback, useId } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

/**
 * Universal SVG-based LinearGradient
 * Full drop-in replacement for expo-linear-gradient & react-native-linear-gradient
 * Optimized for React Native 0.88 New Architecture with zero native C++ dependencies.
 */
function parseColor(rawColor) {
  if (!rawColor || rawColor === 'transparent') {
    return { stopColor: '#000000', stopOpacity: 0 };
  }
  if (typeof rawColor === 'string') {
    const trimmed = rawColor.trim().toLowerCase();
    if (trimmed === 'transparent') {
      return { stopColor: '#000000', stopOpacity: 0 };
    }
    const rgbaMatch = trimmed.match(
      /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/
    );
    if (rgbaMatch) {
      return {
        stopColor: `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`,
        stopOpacity: parseFloat(rgbaMatch[4]),
      };
    }
  }
  return { stopColor: rawColor, stopOpacity: 1 };
}

export const LinearGradient = memo(function LinearGradient({
  colors = ['#000', '#fff'],
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  locations,
  style,
  children,
  borderRadius,
  ...props
}) {
  const generatedId = useId();
  const gradId = generatedId.replace(/[:]/g, '_');
  const [dimensions, setDimensions] = useState(null);

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const rx = borderRadius ?? flattenedStyle.borderRadius ?? 0;

  const handleLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions((prev) => {
        if (prev && prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    }
  }, []);

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
      {...props}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          rx ? { borderRadius: rx, overflow: 'hidden' } : null,
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={
            dimensions ? `0 0 ${dimensions.width} ${dimensions.height}` : undefined
          }
          preserveAspectRatio="none"
        >
          <Defs>
            <SvgLinearGradient
              id={gradId}
              x1={`${(start?.x ?? 0) * 100}%`}
              y1={`${(start?.y ?? 0) * 100}%`}
              x2={`${(end?.x ?? 0) * 100}%`}
              y2={`${(end?.y ?? 1) * 100}%`}
            >
              {colors.map((color, idx) => {
                const offset =
                  locations && locations[idx] !== undefined
                    ? `${locations[idx] * 100}%`
                    : `${(idx / Math.max(colors.length - 1, 1)) * 100}%`;
                const { stopColor, stopOpacity } = parseColor(color);
                return (
                  <Stop
                    key={idx}
                    offset={offset}
                    stopColor={stopColor}
                    stopOpacity={stopOpacity}
                  />
                );
              })}
            </SvgLinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={dimensions ? dimensions.width : '100%'}
            height={dimensions ? dimensions.height : '100%'}
            rx={rx}
            ry={rx}
            fill={`url(#${gradId})`}
          />
        </Svg>
      </View>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});

export default LinearGradient;
