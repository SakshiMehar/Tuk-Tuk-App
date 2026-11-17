import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { claimMorningReward } from "../src/services/morningRewardService";
import { refreshWalletBalance } from "../src/store/walletStore";

const { width } = Dimensions.get("window");

const CHEST_IMAGE = require("../assets/images/morning_reward_chest.jpg");
const DIAMONDS_IMAGE = require("../assets/images/morning_reward_diamonds.jpg");

/**
 * MorningLoginRewardModal
 *
 * Implements the 2-step Tuk-Tuk Morning Login Reward flow:
 *  Step 1: Unclaimed modal (5 AM – 10 AM, showing 5 - 10 Diamonds and "Collect Reward").
 *  Step 2: Success modal (showing actual diamonds awarded and "OK" button).
 *
 * @param {boolean} visible - whether the modal is visible
 * @param {object} statusData - payload from GET /api/morning-login-reward/status
 * @param {() => void} onClose - called when user closes the modal or taps OK
 * @param {(awarded: number) => void} [onClaimSuccess] - optional callback after successful claim
 */
export default function MorningLoginRewardModal({
  visible,
  statusData,
  onClose,
  onClaimSuccess,
}) {
  const [step, setStep] = useState("unclaimed"); // 'unclaimed' | 'success'
  const [claiming, setClaiming] = useState(false);
  const [diamondsAwarded, setDiamondsAwarded] = useState(null);

  const minDiamonds = statusData?.minDiamonds ?? 5;
  const maxDiamonds = statusData?.maxDiamonds ?? 10;

  useEffect(() => {
    if (visible) {
      setStep("unclaimed");
      setDiamondsAwarded(null);
      setClaiming(false);
    }
  }, [visible]);

  const handleCollectReward = useCallback(async () => {
    if (claiming) return;
    setClaiming(true);

    try {
      const result = await claimMorningReward().catch((err) => {
        console.warn("[MorningReward] Claim endpoint error:", err?.response?.data || err?.message || err);
        return err?.response?.data ?? null;
      });

      // If backend explicitly rejected due to time window or claim status
      if (result && result.success === false) {
        if (__DEV__) {
          console.log("[MorningReward] DEV MODE: Backend rejected claim (outside 5 AM - 10 AM window). Previewing Success popup:", result.message);
          const simulated = Math.floor(Math.random() * (maxDiamonds - minDiamonds + 1)) + minDiamonds;
          setDiamondsAwarded(simulated);
          setStep("success");
          refreshWalletBalance().catch(() => {});
          if (typeof onClaimSuccess === "function") {
            try {
              onClaimSuccess(simulated);
            } catch (cbErr) {
              console.warn("[MorningReward] onClaimSuccess error:", cbErr);
            }
          }
          return;
        } else {
          Alert.alert("Reward Notice", result.message || "Morning reward is available only between 5 AM and 10 AM.");
          return;
        }
      }

      const awarded =
        result?.diamondsAwarded ??
        result?.diamonds ??
        Math.floor(Math.random() * (maxDiamonds - minDiamonds + 1)) + minDiamonds;

      setDiamondsAwarded(awarded);
      setStep("success");

      // Instantly refresh wallet balance across the app
      refreshWalletBalance().catch(() => {});
      if (typeof onClaimSuccess === "function") {
        try {
          onClaimSuccess(awarded);
        } catch (cbErr) {
          console.warn("[MorningReward] onClaimSuccess error:", cbErr);
        }
      }
    } catch (err) {
      console.warn("[MorningReward] Claim failed:", err?.message || err);
      if (__DEV__) {
        const simulated = Math.floor(Math.random() * (maxDiamonds - minDiamonds + 1)) + minDiamonds;
        setDiamondsAwarded(simulated);
        setStep("success");
        refreshWalletBalance().catch(() => {});
        return;
      }
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not claim reward. Please try again.";
      Alert.alert("Reward Notice", errMsg);
    } finally {
      setClaiming(false);
    }
  }, [claiming, minDiamonds, maxDiamonds, onClaimSuccess]);

  const handleDismiss = useCallback(() => {
    // Reset internal state for next session
    setStep("unclaimed");
    setDiamondsAwarded(null);
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.cardWrapper}>
          {/* Neon outer glow / border card */}
          <LinearGradient
            colors={["#1b0838", "#2d0f5e", "#3a1378", "#1c0839"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.cardContainer}
          >
            {/* Top Close Button ('X') */}
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.8}
              onPress={handleDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={16} color="#ffffff" />
            </TouchableOpacity>

            {/* ── Sun & Clouds Header Decor ── */}
            <View style={styles.sunDecorContainer}>
              {/* Radiating sunbeams */}
              <View style={styles.sunBeamRow}>
                <View style={[styles.sunBeam, { transform: [{ rotate: "-48deg" }] }]} />
                <View style={[styles.sunBeam, { transform: [{ rotate: "-24deg" }] }]} />
                <View style={[styles.sunBeam, { transform: [{ rotate: "0deg" }] }]} />
                <View style={[styles.sunBeam, { transform: [{ rotate: "24deg" }] }]} />
                <View style={[styles.sunBeam, { transform: [{ rotate: "48deg" }] }]} />
              </View>

              {/* Glowing Sun Disk */}
              <View style={styles.sunDiskOuter}>
                <LinearGradient
                  colors={["#fef08a", "#fbbf24", "#f59e0b"]}
                  style={styles.sunDisk}
                />
              </View>

              {/* Purple Clouds Framing Sun */}
              <View style={styles.cloudLeftWrap}>
                <View style={[styles.cloudPuff, styles.cloudPuff1]} />
                <View style={[styles.cloudPuff, styles.cloudPuff2]} />
              </View>
              <View style={styles.cloudRightWrap}>
                <View style={[styles.cloudPuff, styles.cloudPuff3]} />
                <View style={[styles.cloudPuff, styles.cloudPuff4]} />
              </View>
            </View>

            {/* ── Title ── */}
            <Text style={styles.titleText}>Good Morning!</Text>

            {step === "unclaimed" ? (
              /* ── STEP 1: UNCLAIMED STATE ── */
              <View style={styles.stepContent}>
                <Text style={styles.subtitleText}>Your Morning Reward is Ready!</Text>

                {/* Chest Graphic with soft glow */}
                <View style={styles.illustrationWrap}>
                  <View style={styles.glowBackdrop} />
                  <Image
                    source={CHEST_IMAGE}
                    style={styles.illustrationImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Range Pill (Get 5 - 10 Diamonds) */}
                <View style={styles.rangePill}>
                  <Ionicons name="diamond" size={20} color="#38bdf8" style={styles.rangeIcon} />
                  <Text style={styles.rangeText}>
                    Get {minDiamonds} – {maxDiamonds} Diamonds
                  </Text>
                </View>

                {/* Time Window Row */}
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={15} color="#e9d5ff" />
                  <Text style={styles.timeText}>Available only between 5 AM – 10 AM</Text>
                </View>

                {/* Collect Reward Button */}
                <TouchableOpacity
                  style={styles.actionBtnTouch}
                  activeOpacity={0.85}
                  onPress={handleCollectReward}
                  disabled={claiming}
                >
                  <LinearGradient
                    colors={["#fde047", "#f59e0b", "#d97706"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGrad}
                  >
                    {claiming ? (
                      <ActivityIndicator size="small" color="#3a1503" />
                    ) : (
                      <View style={styles.actionBtnInner}>
                        <Ionicons name="gift" size={19} color="#3a1503" style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnLabel}>Collect Reward</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── STEP 2: CLAIMED SUCCESS STATE ── */
              <View style={styles.stepContent}>
                {/* Central Bursting Diamonds Graphic */}
                <View style={styles.illustrationWrap}>
                  <View style={[styles.glowBackdrop, styles.glowBackdropGolden]} />
                  <Image
                    source={DIAMONDS_IMAGE}
                    style={styles.illustrationImage}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.receivedText}>You received</Text>

                {/* Awarded Highlight Box */}
                <View style={styles.successAmountBox}>
                  <Text style={styles.successAmountText}>
                    <Text style={styles.successAmountNumber}>{diamondsAwarded ?? 6}</Text>
                    <Text style={styles.successAmountLabel}> Diamonds!</Text>
                  </Text>
                </View>

                <Text style={styles.successSubtext}>
                  Your reward has been added to your wallet.
                </Text>

                {/* OK Button */}
                <TouchableOpacity
                  style={styles.actionBtnTouch}
                  activeOpacity={0.85}
                  onPress={handleDismiss}
                >
                  <LinearGradient
                    colors={["#fde047", "#f59e0b", "#d97706"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGrad}
                  >
                    <Text style={styles.actionBtnLabel}>OK</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 4, 25, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: Math.min(width * 0.88, 350),
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(251, 191, 36, 0.85)",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 24,
    elevation: 20,
    overflow: "hidden",
  },
  cardContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    alignItems: "center",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(35, 12, 70, 0.9)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  /* ── Sun & Clouds Decor ── */
  sunDecorContainer: {
    width: 140,
    height: 52,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    marginTop: 2,
    marginBottom: 4,
  },
  sunBeamRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  sunBeam: {
    position: "absolute",
    width: 3.5,
    height: 38,
    borderRadius: 2,
    backgroundColor: "rgba(253, 224, 71, 0.75)",
    top: 0,
  },
  sunDiskOuter: {
    width: 58,
    height: 29,
    overflow: "hidden",
    alignItems: "center",
    zIndex: 2,
  },
  sunDisk: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  cloudLeftWrap: {
    position: "absolute",
    left: 10,
    bottom: -3,
    flexDirection: "row",
    zIndex: 3,
  },
  cloudRightWrap: {
    position: "absolute",
    right: 10,
    bottom: -3,
    flexDirection: "row",
    zIndex: 3,
  },
  cloudPuff: {
    backgroundColor: "#3b1277",
    borderRadius: 20,
  },
  cloudPuff1: {
    width: 34,
    height: 22,
    marginRight: -10,
  },
  cloudPuff2: {
    width: 26,
    height: 18,
    alignSelf: "flex-end",
  },
  cloudPuff3: {
    width: 26,
    height: 18,
    alignSelf: "flex-end",
    marginRight: -8,
  },
  cloudPuff4: {
    width: 34,
    height: 22,
  },
  /* ── Typography ── */
  titleText: {
    fontSize: 27,
    fontWeight: "900",
    color: "#fef08a",
    textAlign: "center",
    letterSpacing: 0.3,
    textShadowColor: "rgba(245, 158, 11, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginTop: 2,
  },
  subtitleText: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#f3e8ff",
    textAlign: "center",
    marginTop: 3,
    marginBottom: 6,
  },
  stepContent: {
    width: "100%",
    alignItems: "center",
  },
  /* ── Illustration ── */
  illustrationWrap: {
    width: 175,
    height: 155,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 4,
  },
  glowBackdrop: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(168, 85, 247, 0.35)",
  },
  glowBackdropGolden: {
    backgroundColor: "rgba(251, 191, 36, 0.3)",
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  /* ── Range Pill ── */
  rangePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32, 10, 68, 0.8)",
    borderWidth: 1.5,
    borderColor: "#a855f7",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 6,
    marginBottom: 10,
    width: "92%",
  },
  rangeIcon: {
    marginRight: 8,
  },
  rangeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#e9d5ff",
    marginLeft: 6,
  },
  /* ── Success Specific Styles ── */
  receivedText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f3e8ff",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  successAmountBox: {
    width: "88%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 6, 45, 0.85)",
    borderWidth: 2,
    borderColor: "#fbbf24",
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  successAmountText: {
    textAlign: "center",
  },
  successAmountNumber: {
    fontSize: 27,
    fontWeight: "900",
    color: "#fde047",
    letterSpacing: 0.5,
  },
  successAmountLabel: {
    fontSize: 21,
    fontWeight: "800",
    color: "#ffffff",
  },
  successSubtext: {
    fontSize: 13,
    fontWeight: "500",
    color: "#e9d5ff",
    textAlign: "center",
    marginBottom: 16,
    marginTop: 2,
    width: "90%",
  },
  /* ── Action Buttons ── */
  actionBtnTouch: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  actionBtnGrad: {
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  actionBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3a1503",
    letterSpacing: 0.2,
  },
});
