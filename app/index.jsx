import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const splashIcon = require("../assets/images/splash-icon.png");

export default function Index() {
  const router = useRouter();

  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(nameTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
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
        }),
      ]),
      Animated.delay(900),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace("/login");
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#070616" />

      <LinearGradient
        colors={["#0d0618", "#1a0a2e", "#110d2f", "#150f3d"]}
        locations={[0, 0.3, 0.65, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.orbPink} />
      <View style={styles.orbCyan} />
      <View style={styles.orbPurple} />

      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={splashIcon}
              style={styles.logo}
              resizeMode="contain"
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070616",
    alignItems: "center",
    justifyContent: "center",
  },
  orbPink: {
    position: "absolute",
    width: 320,
    height: 320,
    top: -80,
    left: -80,
    borderRadius: 160,
    backgroundColor: "rgba(255,0,128,0.18)",
  },
  orbCyan: {
    position: "absolute",
    width: 260,
    height: 260,
    top: -40,
    right: -80,
    borderRadius: 130,
    backgroundColor: "rgba(0,224,255,0.12)",
  },
  orbPurple: {
    position: "absolute",
    width: 340,
    height: 340,
    bottom: -100,
    left: "10%",
    borderRadius: 170,
    backgroundColor: "rgba(132,66,255,0.18)",
  },
  center: {
    alignItems: "center",
  },
  logoWrapper: {
    width: 130,
    height: 130,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    marginTop: 22,
    fontSize: 42,
    fontWeight: "800",
    color: "white",
    letterSpacing: 1.5,
    textShadowColor: "rgba(255,78,163,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  taglineContainer: {
    position: "absolute",
    bottom: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  taglineDivider: {
    width: 28,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tagline: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
});
