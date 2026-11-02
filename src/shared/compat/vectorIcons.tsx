import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { StyleProp, ViewStyle } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

// Crisp standard vector paths
const PATHS: Record<string, { viewBox: string; d: string }> = {
  // FontAwesome facebook-f
  'facebook-f': {
    viewBox: '0 0 320 512',
    d: 'M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z',
  },
  // AntDesign google
  'google': {
    viewBox: '0 0 1024 1024',
    d: 'M881 442.4H519.7v148.5h206.4c-8.9 48-35.9 88.6-76.6 115.8-34.4 23-78.3 36.6-129.9 36.6-99.9 0-184.4-67.5-214.6-158.2-7.6-23-12-47.6-12-73.1s4.4-50.1 12-73.1c30.3-90.7 114.8-158.2 214.7-158.2 56.4 0 102.5 19.4 139 53.6l110.7-110.7C602.8 120.4 532.7 96 450.4 96 270.8 96 118 200.7 45.4 353.4 16.6 414.2 0 482.4 0 554s16.6 139.8 45.4 200.6C118 907.3 270.8 1012 450.4 1012c88.2 0 162.5-29.2 216.7-79 62.4-57.2 98.4-142.1 98.4-245.5 0-24.5-2.2-48.4-6.5-71.1H881z',
  },
  // FontAwesome5 phone-alt
  'phone-alt': {
    viewBox: '0 0 512 512',
    d: 'M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.1l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z',
  },
  // FontAwesome5 gift
  'gift': {
    viewBox: '0 0 512 512',
    d: 'M464 144h-42.3c14.2-19.1 22.3-42.3 22.3-67.2C444 34.6 409.4 0 366.8 0c-48.9 0-89.9 34.6-96.8 79.5L256 100.8l-14-21.3C235.1 34.6 194.1 0 145.2 0 102.6 0 68 34.6 68 76.8c0 24.9 8.1 48.1 22.3 67.2H48c-26.5 0-48 21.5-48 48v80c0 8.8 7.2 16 16 16h32v192c0 17.7 14.3 32 32 32h352c17.7 0 32-14.3 32-32V288h32c8.8 0 16-7.2 16-16v-80c0-26.5-21.5-48-48-48zm-224-48c0-26.5 21.5-48 48-48 26.5 0 48 21.5 48 48s-21.5 48-48 48h-48V96zm-96-48c26.5 0 48 21.5 48 48v48h-48c-26.5 0-48-21.5-48-48s21.5-48 48-48zm128 416H80V288h192v176zm0-208H32v-64h240v64zm192 208H288V288h192v176zm32-208H288v-64h224v64z',
  },
  // FontAwesome check
  'check': {
    viewBox: '0 0 512 512',
    d: 'M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.204-36.204c9.997-9.998 26.205-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.205-9.997 36.205 0l36.204 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.206-.001z',
  },
};

const renderIcon = (name: string, size: number, color: string, style?: StyleProp<ViewStyle>) => {
  const icon = PATHS[name] || PATHS['check'];
  return (
    <Svg width={size} height={size} viewBox={icon.viewBox} style={style}>
      <Path d={icon.d} fill={color} />
    </Svg>
  );
};

export const FontAwesome: React.FC<IconProps> = ({ name, size = 20, color = 'white', style }) =>
  renderIcon(name, size, color, style);

export const FontAwesome5: React.FC<IconProps> = ({ name, size = 20, color = 'white', style }) =>
  renderIcon(name, size, color, style);

export const AntDesign: React.FC<IconProps> = ({ name, size = 20, color = 'white', style }) =>
  renderIcon(name, size, color, style);

export default { FontAwesome, FontAwesome5, AntDesign };
