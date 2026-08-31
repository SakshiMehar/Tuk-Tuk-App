import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { HelpCircle, ChevronRight } from "lucide-react-native";
import {
  TREASURE_CHESTS,
  TREASURE_KEY_IMAGE,
  TREASURE_REWARDS_BY_CHEST,
  TREASURE_RESET_LABEL,
} from "../src/data/treasureBoxData";

const { width: W } = Dimensions.get("window");
const CHEST_SIZE = 72;
const CHEST_SIZE_ACTIVE = 88;

export default function TreasureBoxModal({
  visible,
  onClose,
  treasureState,
  onSelectChest,
}) {
  const powerPercent = treasureState?.powerPercent ?? 0;
  const selectedChest = treasureState?.selectedChest ?? 0;
  const activeChest = treasureState?.activeChest ?? 0;
  const clampedPower = Math.max(0, Math.min(100, powerPercent));

  const handleHelp = () => {
    Alert.alert(
      "Power Bar",
      "Stay in the voice party to fill the power bar. When it reaches 100%, the next treasure chest unlocks and you can claim its rewards."
    );
  };

  const rewards = TREASURE_REWARDS_BY_CHEST[selectedChest] ?? [];
  const featured = rewards.find((item) => item.featured);
  const gridRewards = rewards.filter((item) => !item.featured);
  const barWidth = W - 120;
  const sparkleLeft = (barWidth * clampedPower) / 100 - 11;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
          <LinearGradient
            colors={["#4a2818", "#2d160d", "#1a0c08"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.chestPlatformWrap}>
              <LinearGradient
                colors={["#8b5a2b", "#5c3a18", "#3d2510"]}
                style={styles.chestPlatform}
              >
                <View style={styles.chestRow}>
                  {TREASURE_CHESTS.map((chest, index) => {
                    const isSelected = selectedChest === index;
                    const isLocked = index > activeChest;
                    const size = isSelected ? CHEST_SIZE_ACTIVE : CHEST_SIZE;

                    return (
                      <View key={chest.id} style={styles.chestItemWrap}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => onSelectChest?.(index)}
                          style={[
                            styles.chestTap,
                            isSelected && styles.chestTapActive,
                            isLocked && styles.chestTapLocked,
                          ]}
                        >
                          {isSelected && <View style={styles.chestGlow} />}
                          <Image
                            source={chest.image}
                            style={{ width: size, height: size }}
                            contentFit="contain"
                          />
                        </TouchableOpacity>
                        {index < TREASURE_CHESTS.length - 1 && (
                          <ChevronRight size={16} color="#ffd56a" style={styles.chestArrow} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </LinearGradient>
            </View>

            <View style={styles.powerPanel}>
              <LinearGradient
                colors={["#6b4423", "#4a2d16"]}
                style={styles.powerPanelTopBorder}
              />
              <View style={styles.powerHeader}>
                <Text style={styles.powerTitle}>Power bar</Text>
                <TouchableOpacity onPress={handleHelp} hitSlop={8}>
                  <HelpCircle size={18} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
              </View>

              <View style={styles.powerRow}>
                <View style={styles.powerBarWrap}>
                  <View style={[styles.powerBarOuter, { width: barWidth }]}>
                    <View style={styles.powerBarTrack}>
                      <View
                        style={[
                          styles.powerBarFill,
                          { width: `${clampedPower}%` },
                        ]}
                      >
                        <LinearGradient
                          colors={["#ffd56a", "#ffb347", "#ff8c00"]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={StyleSheet.absoluteFill}
                        />
                      </View>
                    </View>
                    {clampedPower > 0 && (
                      <View
                        style={[
                          styles.powerSparkle,
                          { left: sparkleLeft },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.powerPercentBadge}>
                    <Text style={styles.powerPercentText}>{Math.round(clampedPower)}%</Text>
                  </View>
                </View>

                <Image
                  source={TREASURE_KEY_IMAGE}
                  style={styles.keyIcon}
                  contentFit="contain"
                />
              </View>
            </View>

            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsTitle}>Rewards</Text>
              <View style={styles.rewardsGrid}>
                {featured && (
                  <View style={styles.featuredCard}>
                    {featured.duration ? (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{featured.duration}</Text>
                      </View>
                    ) : null}
                    <Image
                      source={featured.image}
                      style={styles.featuredImage}
                      contentFit="contain"
                    />
                    <Text style={styles.rewardQty}>{featured.qty}</Text>
                  </View>
                )}

                <View style={styles.smallRewardsGrid}>
                  {gridRewards.map((reward) => (
                    <View key={reward.id} style={styles.smallRewardCard}>
                      {reward.duration ? (
                        <View style={styles.durationBadgeSmall}>
                          <Text style={styles.durationTextSmall}>{reward.duration}</Text>
                        </View>
                      ) : null}
                      <Image
                        source={reward.image}
                        style={styles.smallRewardImage}
                        contentFit="contain"
                      />
                      <Text style={styles.smallRewardQty}>{reward.qty}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.resetText}>{TREASURE_RESET_LABEL}</Text>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,213,106,0.25)",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 10,
    marginBottom: 8,
  },
  chestPlatformWrap: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  chestPlatform: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,213,106,0.35)",
  },
  chestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chestItemWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  chestTap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  chestTapActive: {
    transform: [{ scale: 1.05 }],
  },
  chestTapLocked: {
    opacity: 0.45,
  },
  chestGlow: {
    position: "absolute",
    width: CHEST_SIZE_ACTIVE + 10,
    height: CHEST_SIZE_ACTIVE + 10,
    borderRadius: (CHEST_SIZE_ACTIVE + 10) / 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  chestArrow: {
    marginHorizontal: 2,
    opacity: 0.85,
  },
  powerPanel: {
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,213,106,0.22)",
    overflow: "hidden",
  },
  powerPanelTopBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  powerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  powerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  powerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  powerBarWrap: {
    flex: 1,
    paddingBottom: 18,
  },
  powerBarOuter: {
    position: "relative",
    height: 22,
    justifyContent: "center",
  },
  powerBarTrack: {
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,213,106,0.2)",
  },
  powerBarFill: {
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    minWidth: 0,
  },
  powerSparkle: {
    position: "absolute",
    top: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.85)",
    shadowColor: "#ffd56a",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  powerPercentBadge: {
    position: "absolute",
    left: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  powerPercentText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "700",
  },
  keyIcon: {
    width: 52,
    height: 52,
  },
  rewardsSection: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  rewardsTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  rewardsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  featuredCard: {
    width: (W - 36) * 0.42,
    minHeight: 168,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,213,106,0.35)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  featuredImage: {
    width: "88%",
    height: 110,
  },
  rewardQty: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  smallRewardsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  smallRewardCard: {
    width: (W - 36) * 0.24,
    height: 78,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,213,106,0.3)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  smallRewardImage: {
    width: "78%",
    height: 44,
  },
  smallRewardQty: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  durationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  durationBadgeSmall: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 2,
  },
  durationText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 9,
    fontWeight: "700",
  },
  durationTextSmall: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 8,
    fontWeight: "700",
  },
  resetText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
});
