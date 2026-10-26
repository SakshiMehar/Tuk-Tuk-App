import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  DeviceEventEmitter,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { clearTokenCache } from "../src/api/axios";
import { endLocalSession } from "../src/services/authSessionService";
import { wsService } from "../src/services/websocket";
import { getUser } from "../src/store/authStore";

export default function DeviceBlockedModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState({
    type: "DEVICE_BLOCKED",
    message: "This device has been banned due to violation of our community guidelines.",
    reason: "",
    deviceId: "",
    userId: "",
    buttonText: "Close",
  });

  const showModal = useCallback((eventData = {}) => {
    const isAccountBan =
      eventData?.type === "USER_BANNED" ||
      eventData?.type === "ACCOUNT_BANNED" ||
      Boolean(eventData?.isAccountBan);

    const defaultMsg = isAccountBan
      ? "Your account has been banned due to a violation of our community guidelines."
      : "This device has been banned due to violation of our community guidelines.";

    setDetails({
      type: isAccountBan ? "USER_BANNED" : "DEVICE_BLOCKED",
      message: eventData?.message || defaultMsg,
      reason: eventData?.reason || "",
      deviceId: eventData?.deviceId || "",
      userId: eventData?.userId || "",
      buttonText: eventData?.button || eventData?.buttonText || "Close",
    });
    setVisible(true);
  }, []);

  useEffect(() => {
    const modalSub = DeviceEventEmitter.addListener("deviceBlockedModal", (event) => {
      console.log("[DeviceBlockedModal] Received deviceBlockedModal event:", event);
      showModal({ ...event, type: "DEVICE_BLOCKED" });
    });

    const fallbackSub = DeviceEventEmitter.addListener("deviceBlocked", (event) => {
      console.log("[DeviceBlockedModal] Received deviceBlocked fallback event:", event);
      showModal({ ...event, type: "DEVICE_BLOCKED" });
    });

    const userBannedSub = DeviceEventEmitter.addListener("userBanned", (event) => {
      console.log("[DeviceBlockedModal] Received userBanned event:", event);
      showModal({ ...event, type: "USER_BANNED" });
    });

    const userBannedModalSub = DeviceEventEmitter.addListener("userBannedModal", (event) => {
      console.log("[DeviceBlockedModal] Received userBannedModal event:", event);
      showModal({ ...event, type: "USER_BANNED" });
    });

    return () => {
      modalSub.remove();
      fallbackSub.remove();
      userBannedSub.remove();
      userBannedModalSub.remove();
    };
  }, [showModal]);

  // Non-cancelable: intercept hardware back button on Android while modal is visible
  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      // Prevent back button from closing or navigating away while banned
      return true;
    };

    const backHandlerSub = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => backHandlerSub.remove();
  }, [visible]);

  const handleContactSupport = async () => {
    const isAccountBan = details.type === "USER_BANNED";
    const subject = encodeURIComponent(
      isAccountBan ? "Account Banned Appeal" : "Device Blocked Appeal"
    );

    let identifierInfo = "";
    if (isAccountBan) {
      let uid = details.userId;
      if (!uid) {
        try {
          const user = await getUser();
          uid = user?.id || user?.userId || user?._id || "N/A";
        } catch (_) {}
      }
      identifierInfo = `User ID: ${uid || "N/A"}`;
    } else {
      identifierInfo = `Device ID: ${details.deviceId || "N/A"}`;
    }

    const body = encodeURIComponent(
      `Hello Tuk-Tuk Support,\n\nMy ${
        isAccountBan ? "account" : "device"
      } has been banned and I would like to request an appeal.\n\n${identifierInfo}\nReason: ${
        details.reason || "Violation of community guidelines"
      }\n\nThank you.`
    );
    const emailUrl = `mailto:support@tuktuk.com?subject=${subject}&body=${body}`;

    try {
      const supported = await Linking.canOpenURL(emailUrl);
      if (supported) {
        await Linking.openURL(emailUrl);
      } else {
        await Linking.openURL("mailto:support@tuktuk.com");
      }
    } catch (err) {
      console.warn("[DeviceBlockedModal] Could not open support email:", err?.message || err);
    }
  };

  const handleConfirmOk = async () => {
    try {
      console.log("[DeviceBlockedModal] User tapped OK / Close. Performing session teardown...");

      // 1. Clear access token and refresh token
      clearTokenCache();
      await AsyncStorage.multiRemove([
        "@auth_token",
        "@refresh_token",
        "@auth_user",
        "@terms_accepted",
        "accessToken",
        "refreshToken",
      ]).catch(() => { });

      // 2. Clear stored authentication / session data
      await endLocalSession().catch(() => { });

      // 3. Disconnect authenticated WebSocket connection
      wsService.disconnect();

      // 4. Hide dialog
      setVisible(false);

      // 5. Clear authenticated navigation history & Navigate to Login screen
      try {
        router.dismissAll();
      } catch (_) { }
      router.replace("/login");
    } catch (err) {
      console.error("[DeviceBlockedModal] Error during teardown:", err);
      setVisible(false);
      try {
        router.dismissAll();
      } catch (_) { }
      router.replace("/login");
    }
  };

  if (!visible) return null;

  const isAccountBan = details.type === "USER_BANNED";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {
        // Non-cancelable: ignore Android back button request
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Subtle lavender decorative corner accents matching uploaded image */}
          <LinearGradient
            colors={["rgba(216, 180, 254, 0.55)", "rgba(243, 232, 255, 0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.topLeftCorner}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", "rgba(243, 232, 255, 0.2)", "rgba(216, 180, 254, 0.45)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bottomRightCorner}
            pointerEvents="none"
          />

          {/* Top Illustration with Radiating Tick Marks */}
          <View style={styles.illustrationWrapper}>
            {/* Left radiating tick marks */}
            <View style={[styles.tickMark, styles.tickLeftTop]} />
            <View style={[styles.tickMark, styles.tickLeftMid]} />
            <View style={[styles.tickMark, styles.tickLeftBot]} />

            {/* Right radiating tick marks */}
            <View style={[styles.tickMark, styles.tickRightTop]} />
            <View style={[styles.tickMark, styles.tickRightMid]} />
            <View style={[styles.tickMark, styles.tickRightBot]} />

            {/* Soft lavender circle badge */}
            <View style={styles.circleBadge}>
              {isAccountBan ? (
                /* Account Banned: Clean large prohibition symbol matching uploaded image */
                <View style={styles.accountBanIconArea}>
                  <Ionicons name="ban" size={42} color="#EF4444" />
                </View>
              ) : (
                /* Device Banned: Smartphone outline with prohibition symbol */
                <View style={styles.phoneFrame}>
                  {/* Speaker slit */}
                  <View style={styles.phoneSpeaker} />

                  {/* Ban Prohibition Symbol inside phone screen */}
                  <View style={styles.banIconArea}>
                    <Ionicons name="ban" size={22} color="#EF4444" />
                  </View>

                  {/* Home dash */}
                  <View style={styles.phoneHomeDash} />
                </View>
              )}
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>
              {isAccountBan ? "ACCOUNT BANNED " : "DEVICE BANNED "}
            </Text>
            <Ionicons name="ban" size={19} color="#EF4444" style={styles.titleBanIcon} />
          </View>

          {/* Message text */}
          <Text style={styles.messageText}>
            {details.message ||
              (isAccountBan
                ? "Your account has been banned due to a violation of our community guidelines."
                : "This device has been banned due to violation of our community guidelines.")}
          </Text>

          {/* Subtext instruction */}
          <Text style={styles.subText}>
            If you believe this is a mistake, please contact Support.
          </Text>

          {/* Contact Support Pill Button with Vibrant Purple Gradient */}
          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#7C3AED", "#9333EA", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.supportGradient}
            >
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Close / OK Text Action Button */}
          <TouchableOpacity
            testID="device-blocked-ok-button"
            accessibilityLabel="OK"
            style={styles.okButton}
            onPress={handleConfirmOk}
            activeOpacity={0.7}
          >
            <Text style={styles.okButtonText}>
              {details.buttonText || "Close"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.58)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 290,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#7C3AED",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.2,
        shadowRadius: 22,
      },
      android: {
        elevation: 18,
      },
    }),
  },
  topLeftCorner: {
    position: "absolute",
    top: -30,
    left: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  bottomRightCorner: {
    position: "absolute",
    bottom: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  illustrationWrapper: {
    width: 96,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: 0,
    marginBottom: 4,
  },
  circleBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  tickMark: {
    position: "absolute",
    width: 3,
    height: 8,
    borderRadius: 1.5,
    backgroundColor: "#A855F7",
  },
  tickLeftTop: {
    top: 14,
    left: 3,
    transform: [{ rotate: "-40deg" }],
  },
  tickLeftMid: {
    top: 36,
    left: 1,
    transform: [{ rotate: "-15deg" }],
  },
  tickLeftBot: {
    top: 58,
    left: 6,
    transform: [{ rotate: "25deg" }],
  },
  tickRightTop: {
    top: 14,
    right: 3,
    transform: [{ rotate: "40deg" }],
  },
  tickRightMid: {
    top: 36,
    right: 1,
    transform: [{ rotate: "15deg" }],
  },
  tickRightBot: {
    top: 58,
    right: 6,
    transform: [{ rotate: "-25deg" }],
  },
  phoneFrame: {
    width: 34,
    height: 52,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: "#26294D",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  phoneSpeaker: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#26294D",
  },
  banIconArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  accountBanIconArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  phoneHomeDash: {
    width: 5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: "#26294D",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  titleText: {
    fontSize: 18.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  titleBanIcon: {
    marginLeft: 2,
  },
  messageText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  reasonContainer: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FAF5FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  reasonText: {
    fontSize: 12.5,
    color: "#6B21A8",
    textAlign: "center",
    lineHeight: 17,
  },
  reasonLabel: {
    fontWeight: "700",
    color: "#581C87",
  },
  subText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  supportButton: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#9333EA",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  supportGradient: {
    height: 42,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  supportButtonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  okButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  okButtonText: {
    color: "#7C3AED",
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
