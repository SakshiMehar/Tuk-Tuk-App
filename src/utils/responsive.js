import { Dimensions } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

// Design reference — standard Android / iPhone baseline
const BASE_W = 375;
const BASE_H = 812;

/**
 * Scale a horizontal size proportionally to the screen width.
 * Use for widths, horizontal padding/margin, border-radii, icon sizes.
 */
export const scale = (size) => (W / BASE_W) * size;

/**
 * Scale a vertical size proportionally to the screen height.
 * Use for heights, vertical padding/margin, fixed-height buttons.
 */
export const verticalScale = (size) => (H / BASE_H) * size;

/**
 * Scale with a dampening factor so values don't grow/shrink as aggressively.
 * Default factor 0.5 means halfway between no-scale and full-scale.
 * Use for font sizes and sizes that should change, but not dramatically.
 */
export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

/** Percentage of screen width (0–100). Use for container widths. */
export const wp = (percent) => (W * percent) / 100;

/** Percentage of screen height (0–100). Use for container heights. */
export const hp = (percent) => (H * percent) / 100;

// Short aliases for inline styles
export const s  = scale;
export const vs = verticalScale;
export const ms = moderateScale;
