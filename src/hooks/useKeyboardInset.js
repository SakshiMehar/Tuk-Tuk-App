import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const SCREEN_HEIGHT = Dimensions.get("screen").height;

/** Android 3-button / gesture nav area when safe-area inset is 0 (MIUI, etc.). */
export const getAndroidNavBarInset = () =>
  Math.max(0, SCREEN_HEIGHT - WINDOW_HEIGHT);

export const getKeyboardLift = (event) => {
  const coords = event?.endCoordinates ?? event ?? {};
  const height = Number(coords.height ?? 0);
  const screenY = Number(coords.screenY ?? 0);
  const liftFromTop = screenY > 0 ? Math.max(0, WINDOW_HEIGHT - screenY) : 0;
  const measured = Math.max(height, liftFromTop);
  if (measured <= 0) return 0;
  return Platform.OS === "ios" ? measured + 4 : measured;
};

const readKeyboardMetrics = () => {
  const metrics = Keyboard.metrics?.();
  if (!metrics || metrics.height <= 0) return 0;
  return getKeyboardLift({ endCoordinates: metrics });
};

export const getIdleBottomInset = (insets) => {
  const navBar = Platform.OS === "android" ? getAndroidNavBarInset() : 0;
  const floor = Platform.OS === "android" ? 28 : 10;
  return Math.max(insets.bottom, navBar, floor);
};

/** Keeps bottom inputs above the software keyboard. */
export const useKeyboardInset = (extraOffset = 0) => {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(getKeyboardLift(event));
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const idleBottom = getIdleBottomInset(insets);
  const composerBottom =
    keyboardHeight > 0 ? keyboardHeight + extraOffset : idleBottom;

  return {
    keyboardHeight,
    composerBottom,
    isKeyboardVisible: keyboardHeight > 0,
    safeBottom: insets.bottom,
    idleBottom,
  };
};

/** Keyboard + nav inset for bottom sheets (use in-screen overlay, not Modal). */
export const useModalKeyboardInset = (active = true) => {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const retryTimers = useRef([]);
  const idleBottom = getIdleBottomInset(insets);

  const clearRetries = useCallback(() => {
    retryTimers.current.forEach(clearTimeout);
    retryTimers.current = [];
  }, []);

  const applyHeight = useCallback((next) => {
    if (next > 0) setKeyboardHeight(next);
  }, []);

  useEffect(() => {
    if (!active) {
      setKeyboardHeight(0);
      clearRetries();
      return undefined;
    }

    const onShow = (event) => applyHeight(getKeyboardLift(event));
    const onHide = () => {
      setKeyboardHeight(0);
      clearRetries();
    };

    const subscriptions = [
      Keyboard.addListener("keyboardDidShow", onShow),
      Keyboard.addListener("keyboardDidHide", onHide),
    ];

    if (Platform.OS === "ios") {
      subscriptions.push(
        Keyboard.addListener("keyboardWillShow", onShow),
        Keyboard.addListener("keyboardWillHide", onHide)
      );
    }

    return () => {
      subscriptions.forEach((sub) => sub.remove());
      clearRetries();
    };
  }, [active, applyHeight, clearRetries]);

  const syncKeyboardHeight = useCallback(() => {
    const measured = readKeyboardMetrics();
    if (measured > 0) applyHeight(measured);
    clearRetries();
    [50, 150].forEach((delay) => {
      const id = setTimeout(() => {
        const retry = readKeyboardMetrics();
        if (retry > 0) applyHeight(retry);
      }, delay);
      retryTimers.current.push(id);
    });
  }, [applyHeight, clearRetries]);

  const composerBottom = keyboardHeight > 0 ? keyboardHeight : idleBottom;
  const overlayBottom = keyboardHeight > 0 ? keyboardHeight : 0;

  return {
    keyboardHeight,
    composerBottom,
    overlayBottom,
    isKeyboardVisible: keyboardHeight > 0,
    safeBottom: insets.bottom,
    idleBottom,
    syncKeyboardHeight,
  };
};
