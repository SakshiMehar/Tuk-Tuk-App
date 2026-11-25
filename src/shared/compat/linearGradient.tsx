import React from 'react';
import { StyleProp, ViewStyle, ViewProps } from 'react-native';
// @ts-ignore
import { LinearGradient as InternalLinearGradient } from '../components/LinearGradient/LinearGradient';

export interface LinearGradientPoint {
  x: number;
  y: number;
}

export interface LinearGradientProps extends ViewProps {
  colors: any;
  start?: LinearGradientPoint | { x: number; y: number };
  end?: LinearGradientPoint | { x: number; y: number };
  locations?: any;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  borderRadius?: number;
}

export const LinearGradient: React.FC<LinearGradientProps> = InternalLinearGradient as any;
export default LinearGradient;
