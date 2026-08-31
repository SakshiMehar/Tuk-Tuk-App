/**
 * useDeviceLayout
 *
 * Single hook that every screen/component can call to get consistent,
 * device-aware layout values. Combines safe-area insets, window dimensions,
 * and responsive scaling into one place.
 *
 * Usage:
 *   const { W, H, top, bottom, isSmall, s, vs, ms } = useDeviceLayout();
 */

import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsive } from "../utils/responsive";

export const useDeviceLayout = () => {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const resp   = useResponsive();

  // Safe bottom — at least 8px on devices with no home indicator
  const safeBottom = Math.max(insets.bottom, 8);
  // Safe top — status bar height
  const safeTop    = Math.max(insets.top, 0);

  // Tab bar height = 56 + safeBottom (matches _layout.jsx)
  const tabBarHeight = 56 + safeBottom;

  // Content height = full H minus status bar and tab bar
  const contentHeight = H - safeTop - tabBarHeight;

  return {
    // Dimensions
    W,
    H,
    // Insets
    safeTop,
    safeBottom,
    safeLeft:  insets.left,
    safeRight: insets.right,
    // Derived layout
    tabBarHeight,
    contentHeight,
    // Responsive helpers (reactive)
    ...resp,
    // Device class shortcuts
    isSmallScreen:  W < 360,   // Very small Android (320–359px)
    isMediumScreen: W >= 360 && W < 410,
    isLargeScreen:  W >= 410,
    isShortDevice:  H < 700,
    isTallDevice:   H >= 900,
    // Horizontal padding that scales with screen width
    hPad: resp.s(14),
  };
};
