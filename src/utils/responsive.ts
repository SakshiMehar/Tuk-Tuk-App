import { Dimensions } from 'react-native';

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

export default { wp, hp };
