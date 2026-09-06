/**
 * NotificationBanner
 *
 * In-app push notification banner that slides down from the top.
 * Shows image (if provided), title, and body.
 * Auto-dismisses after `duration` ms. Tap to trigger onPress.
 *
 * Usage:
 *   <NotificationBanner
 *     visible={true}
 *     title="Someone liked you!"
 *     body="Tap to view their profile"
 *     imageUrl="https://..."
 *     onPress={() => {}}
 *     onHide={() => {}}
 *   />
 */

import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, vs, ms } from "../src/utils/responsive";

const BANNER_DURATION = 4000; // ms before auto-dismiss
const SLIDE_IN_MS    = 320;
const SLIDE_OUT_MS   = 260;

export default function NotificationBanner({
  visible,
  title,
  body,
  imageUrl,
  onPress,
  onHide,
  duration = BANNER_DURATION,
}) {
  const insets        = useSafeAreaInsets();
  const translateY    = useRef(new Animated.Value(-200)).current;
  const opacity       = useRef(new Animated.Value(0)).current;
  const timerRef      = useRef(null);
  const dismissedRef  = useRef(false);

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: SLIDE_OUT_MS,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: SLIDE_OUT_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onHide?.();
    });
  };

  useEffect(() => {
    if (!visible) return;
    dismissedRef.current = false;

    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
        speed: 14,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: SLIDE_IN_MS,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    timerRef.current = setTimeout(dismiss, duration);

    return () => clearTimeout(timerRef.current);
  }, [visible]);

  if (!visible) return null;

  const topOffset = insets.top + vs(8);

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topOffset, transform: [{ translateY }], opacity },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.card}
        onPress={() => {
          dismiss();
          onPress?.();
        }}
      >
        {/* Left image */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.iconPlaceholder}>
            <Text style={styles.iconEmoji}>🔔</Text>
          </View>
        )}

        {/* Text content */}
        <View style={styles.textWrap}>
          {!!title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          {!!body && (
            <Text style={styles.body} numberOfLines={2}>
              {body}
            </Text>
          )}
        </View>

        {/* Dismiss X */}
        <TouchableOpacity
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={dismiss}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: s(12),
    right: s(12),
    zIndex: 99999,
    elevation: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22, 8, 40, 0.97)",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    ...Platform.select({
      android: {
        elevation: 12,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
    }),
  },
  image: {
    width:        s(46),
    height:       s(46),
    borderRadius: s(23),
    marginRight:  s(10),
    borderWidth:  1.5,
    borderColor:  "rgba(167,139,250,0.5)",
  },
  iconPlaceholder: {
    width:           s(46),
    height:          s(46),
    borderRadius:    s(23),
    marginRight:     s(10),
    backgroundColor: "rgba(167,139,250,0.15)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  iconEmoji: {
    fontSize: ms(22),
  },
  textWrap: {
    flex: 1,
    marginRight: s(6),
  },
  title: {
    color:        "#fff",
    fontSize:     ms(14),
    fontWeight:   "700",
    marginBottom: vs(2),
  },
  body: {
    color:      "rgba(220,210,240,0.85)",
    fontSize:   ms(12),
    fontWeight: "400",
    lineHeight: ms(17),
  },
  closeBtn: {
    paddingLeft: s(4),
  },
  closeText: {
    color:      "rgba(200,190,220,0.7)",
    fontSize:   ms(13),
    fontWeight: "600",
  },
});
