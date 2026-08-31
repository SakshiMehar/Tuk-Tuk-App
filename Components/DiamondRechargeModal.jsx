import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Share,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDiamonds, formatInr } from "../src/data/diamondRechargeCatalog";
import { loadOfflineRechargeAgent } from "../src/services/offlineRechargeService";
import { loadDiamondStockPackages } from "../src/services/diamondStockService";
import { getAppUserId } from "../src/utils/sessionUser";
import { useRouter } from "expo-router";

const isCountryRequiredError = (message) =>
  /country name is required|set your country/i.test(String(message ?? ""));

const sanitizePhone = (value) => String(value ?? "").replace(/[^\d+]/g, "");

export default function DiamondRechargeModal({
  visible,
  onClose,
  currentDiamonds = 0,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  const [selectedId, setSelectedId] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState(null);
  const [agent, setAgent] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState(null);
  const [userId, setUserId] = useState(null);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedId) ?? null,
    [packages, selectedId]
  );

  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true);
    setPackagesError(null);
    try {
      const list = await loadDiamondStockPackages();
      setPackages(list);
      setSelectedId((prev) =>
        list.some((pkg) => pkg.id === prev) ? prev : (list[0]?.id ?? null)
      );
    } catch (err) {
      setPackages([]);
      setPackagesError(err?.message || "Could not load diamond packages.");
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  const fetchAgent = useCallback(async () => {
    setAgentLoading(true);
    setAgentError(null);
    try {
      const [agentData, resolvedUserId] = await Promise.all([
        loadOfflineRechargeAgent(),
        getAppUserId(),
      ]);
      setAgent(agentData);
      setUserId(resolvedUserId);
    } catch (err) {
      setAgent(null);
      setAgentError(err?.message || "Could not load recharge agent.");
    } finally {
      setAgentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    fetchPackages();
    fetchAgent();
  }, [visible, fetchPackages, fetchAgent]);

  const buildRechargeMessage = () => {
    if (!selectedPackage) return "";
    const idLine = userId ? `User ID: ${userId}\n` : "";
    return (
      `Hi, I want to recharge Tuk-Tuk diamonds.\n` +
      `Package: ${formatInr(selectedPackage.inr)} for ${formatDiamonds(selectedPackage.diamonds)}\n` +
      idLine +
      `Please share payment details.`
    );
  };

  const openWhatsApp = async () => {
    const phone = sanitizePhone(agent?.whatsapp || agent?.phone);
    if (!phone) {
      Alert.alert("Contact unavailable", "No WhatsApp number is available for the recharge agent.");
      return;
    }
    const message = encodeURIComponent(buildRechargeMessage());
    const url = `https://wa.me/${phone.replace(/^\+/, "")}?text=${message}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("WhatsApp", "Could not open WhatsApp on this device.");
      return;
    }
    Linking.openURL(url);
  };

  const callAgent = async () => {
    const phone = sanitizePhone(agent?.phone || agent?.whatsapp);
    if (!phone) {
      Alert.alert("Contact unavailable", "No phone number is available for the recharge agent.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const sharePaymentDetails = async () => {
    const lines = [
      selectedPackage
        ? `Recharge: ${formatInr(selectedPackage.inr)} → ${formatDiamonds(selectedPackage.diamonds)}`
        : null,
      userId ? `User ID: ${userId}` : null,
      agent?.name ? `Agent: ${agent.name}` : null,
      agent?.phone ? `Phone: ${agent.phone}` : null,
      agent?.whatsapp ? `WhatsApp: ${agent.whatsapp}` : null,
      agent?.upiId ? `UPI: ${agent.upiId}` : null,
      agent?.email ? `Email: ${agent.email}` : null,
    ].filter(Boolean);

    await Share.share({ message: lines.join("\n") });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView edges={["bottom"]} style={styles.safe}>
          <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
            <LinearGradient
              colors={["#1a0a2e", "#120723", "#0d0618"]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>Recharge Diamonds</Text>
                <Text style={styles.balance}>
                  Balance: 💎 {Number(currentDiamonds).toLocaleString("en-IN")}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inrNote}>
              All payments & income received only in INR
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.sectionLabel}>Select package</Text>
              {packagesLoading ? (
                <View style={styles.agentLoading}>
                  <ActivityIndicator color="#a78bfa" />
                  <Text style={styles.agentLoadingText}>Loading packages...</Text>
                </View>
              ) : packagesError ? (
                <View style={styles.agentLoading}>
                  <Text style={styles.agentErrorText}>{packagesError}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchPackages} activeOpacity={0.85}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                packages.map((pkg) => {
                  const active = pkg.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[styles.packageRow, active && styles.packageRowActive]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedId(pkg.id)}
                    >
                      <View style={styles.packageLeft}>
                        <Text style={styles.packageDiamonds}>
                          💎 {Number(pkg.diamonds).toLocaleString("en-IN")}
                        </Text>
                        <Text style={styles.packageInr}>{formatInr(pkg.inr)}</Text>
                      </View>
                      {active ? (
                        <Ionicons name="checkmark-circle" size={22} color="#a78bfa" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={22} color="rgba(255,255,255,0.25)" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}

              <Text style={styles.sectionLabel}>Recharge agent</Text>
              <View style={styles.agentCard}>
                {agentLoading ? (
                  <View style={styles.agentLoading}>
                    <ActivityIndicator color="#a78bfa" />
                    <Text style={styles.agentLoadingText}>Loading agent...</Text>
                  </View>
                ) : agentError ? (
                  <View style={styles.agentLoading}>
                    <Text style={styles.agentErrorText}>{agentError}</Text>
                    {isCountryRequiredError(agentError) ? (
                      <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => {
                          onClose?.();
                          router.push("/account");
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.retryText}>Set country in Account</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.retryBtn} onPress={fetchAgent} activeOpacity={0.85}>
                        <Text style={styles.retryText}>Retry</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <>
                    <Text style={styles.agentName}>{agent?.name ?? "Recharge Agent"}</Text>
                    <Text style={styles.agentNote}>{agent?.note}</Text>
                    {agent?.phone ? (
                      <View style={styles.agentInfoRow}>
                        <Ionicons name="call-outline" size={16} color="#a78bfa" />
                        <Text style={styles.agentInfoText}>{agent.phone}</Text>
                      </View>
                    ) : null}
                    {agent?.whatsapp ? (
                      <View style={styles.agentInfoRow}>
                        <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                        <Text style={styles.agentInfoText}>{agent.whatsapp}</Text>
                      </View>
                    ) : null}
                    {agent?.upiId ? (
                      <View style={styles.agentInfoRow}>
                        <Ionicons name="wallet-outline" size={16} color="#fbbf24" />
                        <Text style={styles.agentInfoText}>{agent.upiId}</Text>
                      </View>
                    ) : null}
                    {agent?.email ? (
                      <View style={styles.agentInfoRow}>
                        <Ionicons name="mail-outline" size={16} color="#60a5fa" />
                        <Text style={styles.agentInfoText}>{agent.email}</Text>
                      </View>
                    ) : null}
                  </>
                )}
              </View>

              <Text style={styles.helpText}>
                Choose a package, then contact your assigned agent to pay in INR. Diamonds are
                credited after payment confirmation.
              </Text>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.secondaryBtn, agentLoading && styles.btnDisabled]}
                activeOpacity={0.85}
                disabled={agentLoading || !agent}
                onPress={callAgent}
              >
                <Ionicons name="call" size={16} color="white" />
                <Text style={styles.secondaryBtnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtnWrap, (agentLoading || !selectedPackage) && styles.btnDisabled]}
                activeOpacity={0.85}
                disabled={agentLoading || !selectedPackage || !agent}
                onPress={openWhatsApp}
              >
                <LinearGradient
                  colors={["#7c4dff", "#a855f7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="white" />
                  <Text style={styles.primaryBtnText}>Contact on WhatsApp</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.shareLink}
              activeOpacity={0.8}
              onPress={sharePaymentDetails}
            >
              <Text style={styles.shareLinkText}>Share package & agent details</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  safe: {
    maxHeight: "92%",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  balance: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  inrNote: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  sectionLabel: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  packageRowActive: {
    borderColor: "rgba(167,139,250,0.45)",
    backgroundColor: "rgba(124,77,255,0.14)",
  },
  packageLeft: {
    flex: 1,
    paddingRight: 10,
  },
  packageDiamonds: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  packageInr: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 2,
    fontWeight: "600",
  },
  agentCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  agentLoading: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  agentLoadingText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },
  agentErrorText: {
    color: "#f87171",
    fontSize: 13,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(124,77,255,0.25)",
  },
  retryText: {
    color: "white",
    fontWeight: "700",
  },
  agentName: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  agentNote: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 18,
  },
  agentInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  agentInfoText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  helpText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    minHeight: 48,
  },
  secondaryBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  primaryBtnWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  shareLink: {
    alignItems: "center",
    paddingVertical: 10,
  },
  shareLinkText: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
  },
});
