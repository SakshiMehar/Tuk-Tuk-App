import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

interface Point {
  x: number;
  y: number;
}

interface LinearGradientProps {
  colors: readonly string[] | string[];
  start?: Point;
  end?: Point;
  locations?: readonly number[] | number[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

let gradientCounter = 0;

export const LinearGradient: React.FC<LinearGradientProps> = ({
  colors = ['transparent', 'transparent'],
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  locations,
  style,
  children,
}) => {
  const gradientId = React.useMemo(() => `linear-gradient-${++gradientCounter}`, []);

  const stops = colors.map((color, index) => {
    const offset = locations && locations[index] !== undefined
      ? `${locations[index] * 100}%`
      : `${(index / Math.max(colors.length - 1, 1)) * 100}%`;

    return <Stop key={`stop-${index}`} offset={offset} stopColor={color} />;
  });

  return (
    <View style={[styles.container, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <SvgLinearGradient
            id={gradientId}
            x1={`${start.x * 100}%`}
            y1={`${start.y * 100}%`}
            x2={`${end.x * 100}%`}
            y2={`${end.y * 100}%`}
          >
            {stops}
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default LinearGradient;
