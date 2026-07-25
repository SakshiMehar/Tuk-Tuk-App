import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { loadWalletTransactionsPage } from "../src/services/walletService";

/**
 * Bottom-sheet opened from the "Details" chip on the Wallet recharge screen.
 * Shows the total balance for the active currency plus recent transactions
 * (backend-driven via /api/app/wallet/transactions).
 */
export default function WalletDetailsModal({
  visible,
  onClose,
  currency = "diamonds",
  totalDiamonds = 0,
  totalCoins = 0,
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isDiamonds = currency === "diamonds";
  const total = isDiamonds ? totalDiamonds : totalCoins;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { transactions: list } = await loadWalletTransactionsPage(0, 20);
      setTransactions(list);
    } catch (err) {
      setTransactions([]);
      setError(err?.message || "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    fetchTransactions();
  }, [visible, fetchTransactions]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView edges={["bottom"]} style={styles.safe}>
          <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
            <LinearGradient colors={["#1a0a2e", "#120723", "#0d0618"]} style={StyleSheet.absoluteFill} />

            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>{isDiamonds ? "Diamond Details" : "Gold Details"}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={isDiamonds ? ["#fdf1d3", "#f7dfa0"] : ["#fde68a", "#f6c453"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.totalCard}
            >
              <Text style={styles.totalLabel}>
                Total {isDiamonds ? "Diamonds" : "Gold"}
              </Text>
              <View style={styles.totalValueRow}>
                <Text style={styles.totalIcon}>{isDiamonds ? "💎" : "🪙"}</Text>
                <Text style={styles.totalValue}>{Number(total).toLocaleString("en-IN")}</Text>
              </View>
            </LinearGradient>

            <Text style={styles.sectionLabel}>Recent transactions</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {loading ? (
                <View style={styles.stateBox}>
                  <ActivityIndicator color="#a78bfa" />
                  <Text style={styles.stateText}>Loading transactions...</Text>
                </View>
              ) : error ? (
                <View style={styles.stateBox}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchTransactions} activeOpacity={0.85}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : transactions.length === 0 ? (
                <View style={styles.stateBox}>
                  <Ionicons name="receipt-outline" size={28} color="rgba(255,255,255,0.35)" />
                  <Text style={styles.stateText}>No transactions yet</Text>
                </View>
              ) : (
                transactions.map((txn) => (
                  <View key={txn.id} style={styles.txnRow}>
                    <View style={styles.txnLeft}>
                      <Text style={styles.txnLabel} numberOfLines={1}>{txn.label}</Text>
                      <Text style={styles.txnDate}>{txn.date}</Text>
                    </View>
                    <Text style={[styles.txnAmount, { color: txn.color }]}>{txn.amount}</Text>
                  </View>
                ))
              )}
            </ScrollView>
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
    maxHeight: "80%",
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  totalCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  totalLabel: {
    color: "#7c4a1e",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  totalValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  totalIcon: {
    fontSize: 26,
  },
  totalValue: {
    color: "#2a1a06",
    fontSize: 30,
    fontWeight: "900",
  },
  sectionLabel: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  stateBox: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 28,
  },
  stateText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },
  errorText: {
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
  txnRow: {
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
  txnLeft: {
    flex: 1,
    paddingRight: 10,
  },
  txnLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  txnDate: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: "800",
  },
});
