import { StyleSheet, View } from "react-native";
import { APP_BG, APP_ORB_PINK, APP_ORB_PURPLE } from "../src/constants/theme";

export default function AppBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <View style={styles.orbPink} />
      <View style={styles.orbPurple} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: APP_BG,
  },
  orbPink: {
    position: "absolute",
    width: 300,
    height: 300,
    top: -80,
    left: -80,
    borderRadius: 150,
    backgroundColor: APP_ORB_PINK,
  },
  orbPurple: {
    position: "absolute",
    width: 350,
    height: 350,
    bottom: -120,
    right: -120,
    borderRadius: 175,
    backgroundColor: APP_ORB_PURPLE,
  },
});
