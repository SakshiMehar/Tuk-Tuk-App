/**
 * responsive.js
 *
 * Provides device-adaptive scaling utilities for consistent UI across all
 * Android screen sizes and densities.
 *
 * Design baseline: 375 × 812 (standard mid-range Android / iPhone baseline).
 *
 * Usage:
 *   import { s, vs, ms, wp, hp } from '../utils/responsive';
 *   import { useResponsive } from '../utils/responsive';  // inside components
 *
 * IMPORTANT: The module-level s/vs/ms/wp/hp functions snapshot dimensions
 * at app startup. This is fine for portrait-locked apps (which this is).
 * For components that need to react to dimension changes, use useResponsive().
 */

import { Dimensions, PixelRatio } from "react-native";
import { useWindowDimensions } from "react-native";

// ── Design baseline ────────────────────────────────────────────────────────
const BASE_W = 375;
const BASE_H = 812;

// Clamp helpers — prevent extreme scaling on very small or very large devices
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// ── Static (module-level) snapshot — safe for portrait-locked apps ─────────
let _dims = Dimensions.get("window");

// Keep the snapshot live — handles edge cases like foldables or pop-up windows
Dimensions.addEventListener("change", ({ window }) => {
  _dims = window;
});

const _W = () => _dims.width  || BASE_W;
const _H = () => _dims.height || BASE_H;

// ── Core scaling functions ────────────────────────────────────────────────

/**
 * Horizontal scale — use for widths, horizontal padding, border-radius, icon sizes.
 * Clamped to prevent values going below 75% or above 150% of design baseline.
 */
export const scale = (size) => {
  const ratio = clamp(_W() / BASE_W, 0.75, 1.5);
  return Math.round(size * ratio);
};

/**
 * Vertical scale — use for heights and vertical spacing.
 * Clamped more aggressively because tall/short screens vary more than wide/narrow.
 */
export const verticalScale = (size) => {
  const ratio = clamp(_H() / BASE_H, 0.7, 1.4);
  return Math.round(size * ratio);
};

/**
 * Moderate scale — use for font sizes and values that should scale gently.
 * factor=0.5 means halfway between no-scale and full horizontal scale.
 * Clamped to never go below 85% or above 130% to keep text readable.
 */
export const moderateScale = (size, factor = 0.5) => {
  const scaled = size + (scale(size) - size) * factor;
  const clamped = clamp(scaled, size * 0.85, size * 1.3);
  return Math.round(clamped);
};

/** Percentage of current screen width (0–100). */
export const wp = (percent) => (_W() * percent) / 100;

/** Percentage of current screen height (0–100). */
export const hp = (percent) => (_H() * percent) / 100;

/** Current screen width */
export const screenWidth  = () => _W();

/** Current screen height */
export const screenHeight = () => _H();

/**
 * Normalize a font size accounting for device font-scale settings.
 * Use this for any Text that must NOT grow with system accessibility font scale
 * (e.g. decorative headers). For body text, let the system scale work.
 */
export const normalizeFontSize = (size) => {
  const scaled = moderateScale(size);
  // On devices where user has set very large system fonts, cap at 1.3×
  const deviceScale = clamp(PixelRatio.getFontScale(), 0.8, 1.3);
  return Math.round(scaled / deviceScale);
};

// Short aliases
export const s  = scale;
export const vs = verticalScale;
export const ms = moderateScale;

// ── React hook — use inside components for live updates ───────────────────

/**
 * useResponsive — returns reactive scaling functions that update if the
 * window dimensions change (e.g. foldables, Android multi-window).
 */
export const useResponsive = () => {
  const { width: W, height: H } = useWindowDimensions();

  const _scale = (size) => {
    const ratio = clamp(W / BASE_W, 0.75, 1.5);
    return Math.round(size * ratio);
  };

  const _vScale = (size) => {
    const ratio = clamp(H / BASE_H, 0.7, 1.4);
    return Math.round(size * ratio);
  };

  const _mScale = (size, factor = 0.5) => {
    const scaled = size + (_scale(size) - size) * factor;
    return Math.round(clamp(scaled, size * 0.85, size * 1.3));
  };

  return {
    W,
    H,
    s: _scale,
    vs: _vScale,
    ms: _mScale,
    wp: (pct) => (W * pct) / 100,
    hp: (pct) => (H * pct) / 100,
    isSmallScreen:  W < 360,
    isMediumScreen: W >= 360 && W < 410,
    isLargeScreen:  W >= 410,
    isShortDevice:  H < 700,
    isTallDevice:   H >= 900,
  };
};
