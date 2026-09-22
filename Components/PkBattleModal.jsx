import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, HelpCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "../src/constants/colors";

const TABS = [
  { id: "vote", label: "Vote PK" },
  { id: "personal", label: "Personal gift\nPK" },
  { id: "team", label: "Team gift pk" },
];

const DURATIONS = [1, 3, 5, 10, 30];

const SLOT_COUNT = 10;

/** Bottom-sheet PK battle setup screen — light theme version of the
 *  reference "Personal gift PK" design (tabs, 10 opponent slots, gift
 *  picker, duration picker, jackpot toggle). Opened from the room's Play
 *  Center "PK" button. `gifts` is the PK gift catalog (voice-party.jsx's
 *  displayPkGifts) so the picker reuses the same inventory the Backpack's
 *  PK tab already shows. */
export default function PkBattleModal({ visible, onClose, gifts = [], onConfirm }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [selectedGift, setSelectedGift] = useState(null);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [jackpotMode, setJackpotMode] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowGiftPicker(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handleSlotPress = () => {
    Alert.alert("Invite opponent", "Inviting a PK opponent is coming soon.");
  };

  const handleConfirm = () => {
    if (!selectedGift) {
      Alert.alert("Select a gift", "Pick a gift before starting the PK.");
      return;
    }
    onConfirm?.({ mode: activeTab, gift: selectedGift, durationMinutes, jackpotMode });
    onClose?.();
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.grabber} />

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.id)}
              >
                {active ? (
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabActiveBg}
                  >
                    <Text style={styles.tabTextActive}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.tabText}>{tab.label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
          {/* Calculation hint */}
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>Calculated by the gifts received</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  "How it works",
                  "Each side's PK score is based on the total value of gifts their supporters send during the battle.",
                )
              }
            >
              <HelpCircle size={15} color={Colors.textSlateMuted} />
            </TouchableOpacity>
          </View>

          {/* Opponent slots */}
          <View style={styles.slotGrid}>
            {Array.from({ length: SLOT_COUNT }).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={styles.slotItem}
                activeOpacity={0.75}
                onPress={handleSlotPress}
              >
                <View style={styles.slotCircle}>
                  <Text style={styles.slotEmptyText}>Empty</Text>
                </View>
                <Text style={styles.slotNumber}>{i + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Gift selector */}
          <Text style={styles.sectionLabel}>Select a gift</Text>
          <TouchableOpacity
            style={styles.giftRow}
            activeOpacity={0.8}
            onPress={() => setShowGiftPicker((v) => !v)}
          >
            <View style={styles.giftIconWrap}>
              {selectedGift ? (
                <Text style={styles.giftIconEmoji}>{selectedGift.emoji}</Text>
              ) : (
                <Text style={styles.giftIconEmoji}>🎁</Text>
              )}
            </View>
            <Text style={styles.giftRowText} numberOfLines={1}>
              {selectedGift ? selectedGift.name : "Choose a gift"}
            </Text>
            <ChevronRight
              size={18}
              color={Colors.textSlateMuted}
              style={showGiftPicker ? styles.giftChevronOpen : null}
            />
          </TouchableOpacity>

          {showGiftPicker && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.giftPickerScroll}
              contentContainerStyle={styles.giftPickerContent}
            >
              {gifts.map((gift) => {
                const selected = selectedGift?.id === gift.id;
                return (
                  <TouchableOpacity
                    key={gift.id}
                    style={[styles.giftPickerItem, selected && styles.giftPickerItemActive]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedGift(gift);
                      setShowGiftPicker(false);
                    }}
                  >
                    <Text style={styles.giftPickerEmoji}>{gift.emoji}</Text>
                    <Text style={styles.giftPickerName} numberOfLines={1}>{gift.name}</Text>
                    <Text style={styles.giftPickerPrice}>💎 {gift.price}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Duration selector */}
          <Text style={styles.sectionLabel}>Select duration (minutes)</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((mins) => {
              const active = mins === durationMinutes;
              return (
                <TouchableOpacity
                  key={mins}
                  activeOpacity={0.85}
                  onPress={() => setDurationMinutes(mins)}
                >
                  {active ? (
                    <LinearGradient
                      colors={[Colors.accentGold, Colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.durationPillActive}
                    >
                      <Text style={styles.durationTextActive}>{mins}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.durationPill}>
                      <Text style={styles.durationText}>{mins}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleConfirm} style={styles.confirmWrap}>
            <LinearGradient
              colors={selectedGift ? [Colors.primary, Colors.secondary] : [Colors.borderLight, Colors.borderLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmBtn}
            >
              <Text style={[styles.confirmText, !selectedGift && styles.confirmTextDisabled]}>
                Confirm
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Jackpot mode */}
          <View style={styles.jackpotRow}>
            <Text style={styles.jackpotLabel}>Jackpot mode</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setJackpotMode((v) => !v)}
              style={[styles.toggleTrack, jackpotMode && styles.toggleTrackActive]}
            >
              <View style={[styles.toggleThumb, jackpotMode && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,10,30,0.55)",
    justifyContent: "flex-end",
    zIndex: 50,
    elevation: 50,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "82%",
    paddingTop: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    marginBottom: 10,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  tabActiveBg: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  tabText: {
    color: Colors.textSlateMuted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 10,
  },
  tabTextActive: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },

  body: { paddingBottom: 12 },

  // Hint row
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  hintText: {
    color: Colors.textSlateMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  // Slot grid
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
  },
  slotItem: {
    width: "20%",
    alignItems: "center",
    gap: 6,
  },
  slotCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  slotEmptyText: {
    color: Colors.grayPlaceholder,
    fontSize: 9,
    fontWeight: "700",
  },
  slotNumber: {
    color: Colors.textSlateMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  // Section label
  sectionLabel: {
    color: Colors.textSlateDark,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
  },

  // Gift row
  giftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  giftIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryAlpha12,
    alignItems: "center",
    justifyContent: "center",
  },
  giftIconEmoji: { fontSize: 18 },
  giftRowText: {
    flex: 1,
    color: Colors.textSlateDark,
    fontSize: 13,
    fontWeight: "600",
  },
  giftChevronOpen: { transform: [{ rotate: "90deg" }] },

  giftPickerScroll: { marginTop: 10 },
  giftPickerContent: { gap: 10, paddingVertical: 2 },
  giftPickerItem: {
    width: 84,
    alignItems: "center",
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  giftPickerItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryAlpha10,
  },
  giftPickerEmoji: { fontSize: 24 },
  giftPickerName: {
    color: Colors.textSlateDark,
    fontSize: 11,
    fontWeight: "700",
  },
  giftPickerPrice: {
    color: Colors.textSlateMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  // Duration
  durationRow: {
    flexDirection: "row",
    gap: 10,
  },
  durationPill: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  durationPillActive: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  durationText: {
    color: Colors.textSlateDark,
    fontSize: 13,
    fontWeight: "700",
  },
  durationTextActive: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },

  // Confirm
  confirmWrap: {
    marginTop: 22,
  },
  confirmBtn: {
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  confirmTextDisabled: {
    color: Colors.grayPlaceholder,
  },

  // Jackpot mode
  jackpotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },
  jackpotLabel: {
    color: Colors.textSlateDark,
    fontSize: 13,
    fontWeight: "700",
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.borderLight,
    padding: 3,
    justifyContent: "center",
  },
  toggleTrackActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
});
