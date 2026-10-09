import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, Text, TouchableOpacity, View, StyleSheet, Image } from "react-native";

const GiftPurchaseModal = ({
  purchaseGift,
  setPurchaseGift,
  showSendGiftOptions,
  setShowSendGiftOptions,
  walletDiamonds,
  sendGiftQuantity,
  setSendGiftQuantity,
  selectedGiftRecipient,
  giftReceiverName,
  openGiftReceiverPicker,
  giftReceiverId,
  sendingGift,
  catalogLoading,
  confirmSendGift,
  handleBuyGift,
  renderGiftRecipientAvatar,
  formatGiftPrice,
  giftRecipientOptions,
  renderGiftRecipientPickerOverlay
}) => {
  if (!purchaseGift) return null;

  const purchasePrice = Math.max(0, Number(purchaseGift.price ?? 0));
  const canAfford = purchasePrice <= 0 || walletDiamonds >= purchasePrice;

  return (
    <Modal
      visible={Boolean(purchaseGift)}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setPurchaseGift(null);
        setShowSendGiftOptions(false);
      }}
    >
      <TouchableOpacity
        style={styles.giftPurchaseOverlay}
        activeOpacity={1}
        onPress={() => {
          setPurchaseGift(null);
          setShowSendGiftOptions(false);
        }}
      >
        <TouchableOpacity activeOpacity={1} style={styles.giftPurchaseBox}>
          {showSendGiftOptions ? (
            <View style={{ width: "100%", maxHeight: 400 }}>
              <View style={{ alignItems: "center", marginBottom: 20, paddingTop: 35 }}>
                <View style={{ position: 'absolute', top: -75, alignSelf: 'center' }}>
                  <LinearGradient
                    colors={["#2a0d50", "#4a1d80"]}
                    style={styles.giftPurchaseEmojiWrap}
                  >
                    <Image source={require('../assets/send_gift_box.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
                  </LinearGradient>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: "#a78bfa", fontSize: 16 }}>✨ </Text>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginHorizontal: 8 }}>Send Gift</Text>
                  <Text style={{ color: "#a78bfa", fontSize: 16 }}> ✨</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 25 }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 }}>
                  <View style={{ position: 'relative' }}>
                    {renderGiftRecipientAvatar(selectedGiftRecipient, { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#7c4dff' })}
                  </View>
                  <TouchableOpacity
                    style={[styles.bpSendRecipient, { flex: 1, backgroundColor: '#1e1b4b', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginLeft: 10, marginRight: 0, borderWidth: 1, borderColor: '#4c1d95' }]}
                    activeOpacity={0.8}
                    onPress={openGiftReceiverPicker}
                  >
                    <Text style={[styles.bpSendName, { flex: 1, color: "#fff", fontSize: 14 }]} numberOfLines={1}>
                      {giftReceiverName}
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 12 }}>▼</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.bpSendQtyBtn, { marginVertical: 0, backgroundColor: '#1e1b4b', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: '#4c1d95' }]}>
                  <TouchableOpacity
                    style={[styles.bpQtyStepBtn, { width: 28, height: 28, borderRadius: 14, backgroundColor: '#7c4dff' }]}
                    activeOpacity={0.8}
                    onPress={() => setSendGiftQuantity((q) => String(Math.max(1, (Number(q) || 1) - 1)))}
                  >
                    <Text style={[styles.bpQtyStepText, { fontSize: 18 }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.bpSendQtyText, { color: "#fff", fontSize: 15, minWidth: 20, textAlign: 'center' }]}>{sendGiftQuantity}</Text>
                  <TouchableOpacity
                    style={[styles.bpQtyStepBtn, { width: 28, height: 28, borderRadius: 14, backgroundColor: '#7c4dff' }]}
                    activeOpacity={0.8}
                    onPress={() => setSendGiftQuantity((q) => String(Math.min(99, (Number(q) || 1) + 1)))}
                  >
                    <Text style={[styles.bpQtyStepText, { fontSize: 18 }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.giftPurchaseActions, { gap: 12, marginTop: 5 }]}>
                <TouchableOpacity
                  style={[styles.giftPurchaseCloseBtn, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#7c4dff', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setPurchaseGift(null);
                    setShowSendGiftOptions(false);
                  }}
                >
                  <Text style={[styles.giftPurchaseCloseText, { color: '#fff', fontSize: 15, fontWeight: '600' }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.giftPurchaseBuyBtn,
                    { flex: 1.2, height: 'auto', padding: 0 },
                    (sendingGift || !giftReceiverId || giftRecipientOptions.length === 0 || (!(purchasePrice * Number(sendGiftQuantity || 1) <= 0 || walletDiamonds >= purchasePrice * Number(sendGiftQuantity || 1)) && catalogLoading)) && { opacity: 0.5 },
                  ]}
                  activeOpacity={0.85}
                  disabled={sendingGift || !giftReceiverId || giftRecipientOptions.length === 0 || (!(purchasePrice * Number(sendGiftQuantity || 1) <= 0 || walletDiamonds >= purchasePrice * Number(sendGiftQuantity || 1)) && catalogLoading)}
                  onPress={() => {
                    if (purchasePrice * Number(sendGiftQuantity || 1) <= 0 || walletDiamonds >= purchasePrice * Number(sendGiftQuantity || 1)) {
                      confirmSendGift();
                    } else {
                      handleBuyGift();
                    }
                  }}
                >
                  <LinearGradient
                    colors={
                      (!sendingGift && (purchasePrice * Number(sendGiftQuantity || 1) <= 0 || walletDiamonds >= purchasePrice * Number(sendGiftQuantity || 1)) && giftReceiverId && giftRecipientOptions.length > 0)
                        ? ["#7c4dff", "#4a6cf7"]
                        : ["#4a4a5a", "#3a3a4a"]
                    }
                    style={[styles.giftPurchaseBuyGrad, { borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                  >
                    {!sendingGift && (purchasePrice * Number(sendGiftQuantity || 1) <= 0 || walletDiamonds >= purchasePrice * Number(sendGiftQuantity || 1)) && giftReceiverId && giftRecipientOptions.length > 0 && (
                      <Ionicons name="paper-plane-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[styles.giftPurchaseBuyText, { fontSize: 15 }]}>
                      {sendingGift ? "Sending..." : ((purchasePrice * Number(sendGiftQuantity || 1) <= 0 || walletDiamonds >= purchasePrice * Number(sendGiftQuantity || 1)) ? "Confirm Send" : "Buy")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ paddingTop: 35, alignItems: 'center' }}>
              <View style={{ position: 'absolute', top: -75, alignSelf: 'center' }}>
                <LinearGradient
                  colors={["#2a0d50", "#4a1d80"]}
                  style={styles.giftPurchaseEmojiWrap}
                >
                  <Image source={require('../assets/send_gift_box.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
                </LinearGradient>
              </View>
              <Text style={styles.giftPurchaseName}>
                {purchaseGift.name}
              </Text>
              <Text style={styles.giftPurchasePrice}>
                💎 {formatGiftPrice(purchasePrice)}
              </Text>
              <Text style={styles.giftPurchaseBalance}>
                Your balance: 💎 {formatGiftPrice(walletDiamonds)}
              </Text>
              {!canAfford ? (
                <Text style={styles.giftPurchaseWarning}>
                  Not enough diamonds to buy this gift.
                </Text>
              ) : null}
              <View style={styles.giftPurchaseActions}>
                <TouchableOpacity
                  style={styles.giftPurchaseCloseBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    setPurchaseGift(null);
                    setShowSendGiftOptions(false);
                  }}
                >
                  <Text style={styles.giftPurchaseCloseText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.giftPurchaseBuyBtn,
                    (!canAfford || catalogLoading) &&
                    styles.giftPurchaseBuyBtnDisabled,
                  ]}
                  activeOpacity={0.85}
                  disabled={!canAfford || catalogLoading}
                  onPress={() => {
                    if (canAfford) {
                      setShowSendGiftOptions(true);
                    } else {
                      handleBuyGift();
                    }
                  }}
                >
                  <LinearGradient
                    colors={
                      canAfford && !catalogLoading
                        ? ["#7c4dff", "#4a6cf7"]
                        : ["#4a4a5a", "#3a3a4a"]
                    }
                    style={styles.giftPurchaseBuyGrad}
                  >
                    <Text style={styles.giftPurchaseBuyText}>
                      {canAfford ? "Send" : "Buy"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
      {renderGiftRecipientPickerOverlay && renderGiftRecipientPickerOverlay()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  bpSendAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#7c4dff",
  },
  bpSendRecipient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  bpSendName: { color: "#3D1A80", fontSize: 13, fontWeight: "600", flex: 1 },
  bpSendChev: { color: "#3D1A80", fontSize: 12 },
  bpSendQtyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  bpQtyStepBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c4dff",
  },
  bpQtyStepText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  bpSendQtyText: {
    color: "#3D1A80",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 16,
    textAlign: "center",
  },
  giftPurchaseOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  giftPurchaseBox: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#1a0a2e",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: "center",
  },
  giftPurchaseEmojiWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    borderWidth: 2,
    borderColor: '#9333ea', // Slightly brighter purple
    shadowColor: "#9333ea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8, // For Android
  },
  giftPurchaseEmoji: { fontSize: 44 },
  giftPurchaseName: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  giftPurchasePrice: {
    color: "#c4b5fd",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  giftPurchaseBalance: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginBottom: 8,
  },
  giftPurchaseWarning: {
    color: "#f87171",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  giftPurchaseActions: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  giftPurchaseCloseBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    paddingVertical: 13,
    alignItems: "center",
  },
  giftPurchaseCloseText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "700",
  },
  giftPurchaseBuyBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  giftPurchaseBuyBtnDisabled: {
    opacity: 0.75,
  },
  giftPurchaseBuyGrad: {
    paddingVertical: 13,
    alignItems: "center",
  },
  giftPurchaseBuyText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  }
});

export default GiftPurchaseModal;
