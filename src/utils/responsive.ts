import { Dimensions } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Width percentage to DP
 */
export const wp = (percentage: number | string): number => {
  const value = typeof percentage === 'number' ? percentage : parseFloat(percentage);
  return (value * SCREEN_WIDTH) / 100;
};

/**
 * Height percentage to DP
 */
export const hp = (percentage: number | string): number => {
  const value = typeof percentage === 'number' ? percentage : parseFloat(percentage);
  return (value * SCREEN_HEIGHT) / 100;
};

export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;

export { scale, verticalScale, moderateScale };
export default { wp, hp, s, vs, ms, scale, verticalScale, moderateScale };

