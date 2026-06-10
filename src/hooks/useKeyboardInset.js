import { useEffect, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const getKeyboardLift = (event) => {
  const { height, screenY } = event.endCoordinates;
  const windowHeight = Dimensions.get("window").height;
  const liftFromTop = Math.max(0, windowHeight - screenY);
  return Math.max(height, liftFromTop);
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

  const composerBottom =
    keyboardHeight > 0 ? keyboardHeight + extraOffset : insets.bottom;

  return {
    keyboardHeight,
    composerBottom,
    isKeyboardVisible: keyboardHeight > 0,
    safeBottom: insets.bottom,
  };
};
