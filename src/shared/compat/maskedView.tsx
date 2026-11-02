import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

interface MaskedViewProps {
  maskElement: React.ReactElement;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

let maskCounter = 0;

export const MaskedView: React.FC<MaskedViewProps> = ({ maskElement, children, style }) => {
  const maskId = React.useMemo(() => `text-mask-${++maskCounter}`, []);

  // Attempt to extract text and gradient colors for native SVG gradient text rendering
  let textContent = '';
  let textStyle: any = {};
  if (React.isValidElement(maskElement)) {
    textContent = (maskElement.props as any)?.children?.toString() || '';
    textStyle = (maskElement.props as any)?.style || {};
  }

  let gradientColors: readonly string[] = ['#FF5EAA', '#B355F5'];
  if (React.isValidElement(children)) {
    const childProps = children.props as any;
    if (childProps?.colors && Array.isArray(childProps.colors)) {
      gradientColors = childProps.colors;
    }
  }

  const fontSize = textStyle.fontSize || 32;
  const fontWeight = textStyle.fontWeight || '800';
  const letterSpacing = textStyle.letterSpacing || 0;
  const height = fontSize * 1.5;

  return (
    <View style={[styles.container, style]}>
      {textContent ? (
        <Svg height={height} width="100%">
          <Defs>
            <SvgLinearGradient id={maskId} x1="0%" y1="0%" x2="100%" y2="100%">
              {gradientColors.map((col, idx) => (
                <Stop
                  key={idx}
                  offset={`${(idx / Math.max(gradientColors.length - 1, 1)) * 100}%`}
                  stopColor={col}
                />
              ))}
            </SvgLinearGradient>
          </Defs>
          <SvgText
            fill={`url(#${maskId})`}
            fontSize={fontSize}
            fontWeight={fontWeight}
            letterSpacing={letterSpacing}
            x="50%"
            y={fontSize}
            textAnchor="middle"
          >
            {textContent}
          </SvgText>
        </Svg>
      ) : (
        <View>{children || maskElement}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MaskedView;
