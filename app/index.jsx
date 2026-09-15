import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StatusBar,
  Linking,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import { Colors } from "../src/constants/colors";
import { getToken } from "../src/store/authStore";
import {
  consumePendingNotification,
  navigateFromNotification,
} from "../src/utils/notificationNavigation";
import {
  extractRoomIdFromUrl,
  setPendingDeepLink,
  consumePendingDeepLink,
} from "../src/utils/deepLinkUtils";

const splashIcon = require("../assets/images/splash-icon.png");

export default function Index() {
  const router = useRouter();

  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameTranslateY = useRef(new Animated.Value(verticalScale(30))).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(verticalScale(20))).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowPulse, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    const checkAuth = async () => {
      try {
        const token = await getToken();
        const targetRoute = token ? "/(tabs)/home" : "/login";
        startAnimations(() => {
          router.replace(targetRoute);
        });
      } catch (error) {
        startAnimations(() => {
          router.replace("/login");
        });
      }
    };

    checkAuth();
  }, []);

  const startAnimations = (onComplete) => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(nameTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      Animated.delay(900),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      let initialUrl = null;
      try {
        initialUrl = (await Linking.getInitialURL()) || (await consumePendingDeepLink());
      } catch {
        // fallback
      }

      const initialRoomId = extractRoomIdFromUrl(initialUrl);

      // Check if the user is already logged in — skip the login screen if so
      getToken()
        .then(async (token) => {
          if (token) {
            if (initialRoomId) {
              router.replace({
                pathname: "/voice-party",
                params: { roomId: String(initialRoomId) },
              });
              return;
            }

            const pending = consumePendingNotification();
            router.replace("/(tabs)/home");
            if (pending) {
              setTimeout(() => {
                navigateFromNotification(router, pending);
              }, 300);
            }
          } else {
            if (initialUrl) {
              await setPendingDeepLink(initialUrl);
            }
            router.replace("/login");
          }
        })
        .catch(() => {
          router.replace("/login");
        });
    });
  };

  const rotateInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "0deg"],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <LinearGradient
        colors={Colors.splashGradient}
        locations={[0, 0.3, 0.65, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.orbPink,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowPulse }],
          },
        ]}
      />
      <View style={styles.orbCyan} />
      <View style={styles.orbPurple} />

      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { rotate: rotateInterpolate }],
          }}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={splashIcon}
              style={styles.logo}
              resizeMode="contain"
            />
            <Animated.View
              style={[
                styles.logoGlowRing,
                {
                  opacity: glowOpacity,
                  transform: [{ scale: glowPulse }],
                },
              ]}
            />
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: nameOpacity,
              transform: [{ translateY: nameTranslateY }],
            },
          ]}
        >
          Tuk Tuk
        </Animated.Text>
      </View>

      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          },
        ]}
      >
        <View style={styles.taglineDivider} />
        <Text style={styles.tagline}>Connect · Talk · Earn</Text>
        <View style={styles.taglineDivider} />
      </Animated.View>

      <Animated.View
        style={[
          styles.loadingBar,
          {
            opacity: taglineOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.loadingBarFill,
            {
              transform: [
                {
                  scaleX: glowPulse.interpolate({
                    inputRange: [0.5, 1],
                    outputRange: [0.3, 0.7],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  orbPink: {
    position: "absolute",
    width: scale(350),
    height: scale(350),
    top: verticalScale(-100),
    left: scale(-100),
    borderRadius: scale(175),
    backgroundColor: Colors.orbPink,
  },
  orbCyan: {
    position: "absolute",
    width: scale(280),
    height: scale(280),
    top: verticalScale(-50),
    right: scale(-90),
    borderRadius: scale(140),
    backgroundColor: Colors.orbCyan,
  },
  orbPurple: {
    position: "absolute",
    width: scale(360),
    height: scale(360),
    bottom: verticalScale(-120),
    left: "10%",
    borderRadius: scale(190),
    backgroundColor: Colors.orbPurple,
  },
  center: {
    alignItems: "center",
    marginBottom: verticalScale(20),
  },
  logoWrapper: {
    width: scale(110),
    height: scale(110),
    borderRadius: moderateScale(35),
    backgroundColor: Colors.borderGlassSubtle,
    borderWidth: 1.5,
    borderColor: Colors.borderGlass,
    alignItems: "center",
    justifyContent: "center",
    elevation: 20,
    shadowColor: Colors.glowPinkRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  logoGlowRing: {
    position: "absolute",
    width: scale(140),
    height: scale(140),
    borderRadius: moderateScale(42),
    borderWidth: 2,
    borderColor: Colors.borderPinkGlow,
    top: -scale(15),
    left: -scale(15),
  },
  logo: {
    width: scale(80),
    height: scale(80),
  },
  appName: {
    marginTop: verticalScale(24),
    fontSize: moderateScale(32),
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 2,
    textShadowColor: Colors.glowPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  taglineContainer: {
    position: "absolute",
    bottom: verticalScale(60),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  taglineDivider: {
    width: scale(30),
    height: 1.5,
    backgroundColor: Colors.borderGlassLight,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: moderateScale(12),
    fontWeight: "600",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  loadingBar: {
    position: "absolute",
    bottom: verticalScale(30),
    width: scale(120),
    height: 2,
    backgroundColor: Colors.loadingBarBg,
    borderRadius: 1,
    overflow: "hidden",
  },
  loadingBarFill: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.loadingBarFill,
    borderRadius: 1,
  },
});