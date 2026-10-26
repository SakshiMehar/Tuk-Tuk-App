import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Gift, X } from "lucide-react-native";
import { useEffect } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { API_BASE_URL } from "../src/config/env";

const { width: W } = Dimensions.get("window");

// Make sure you place the second image the user uploaded at this path, or update the path!
const HEADER_IMAGE = require("../assets/Gift/treasure_header.png");

export default function TreasureWinnersModal({ visible, onClose, eventData }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 14, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = 0.5;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible || !eventData) return null;

  const myReward = eventData.myReward;
  const isParticipation = myReward?.rewardType === "PARTICIPATION_REWARD";
  const hasReward = Boolean(myReward);

  let imageUrl = myReward?.giftAnimationUrl || myReward?.giftIcon || "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/uploads/gift-photo/default-gift.png";
  if (imageUrl.startsWith("/")) {
    imageUrl = `${API_BASE_URL}${imageUrl}`;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalWrapper, animatedContainerStyle]}>

          {/* Main Modal Body */}
          <View style={styles.contentContainer}>
            <LinearGradient
              colors={["#2a1e5c", "#171033"]}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />

            {/* Header Image (Chest & Ribbon) protruding out the top */}
            <View style={styles.headerImageContainer}>
              <Image
                source={HEADER_IMAGE}
                style={styles.headerImage}
                contentFit="contain"
              />
            </View>



            <View style={styles.innerContent}>
              {/* White Card for Reward */}
              <View style={styles.rewardCard}>
                {!hasReward ? (
                  <View style={styles.rewardItem}>
                    <Image
                      source={{ uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/uploads/gift-photo/default-gift.png" }}
                      style={[{ opacity: 0.5 }, styles.giftIcon]}
                      contentFit="contain"
                    />
                    <Text style={styles.rewardType}>Calculating...</Text>
                  </View>
                ) : isParticipation ? (
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardType}>Participation Reward</Text>
                    <Text style={styles.rewardValue}>+{myReward.rewardAmount || 10} Diamonds</Text>
                  </View>
                ) : (
                  <View style={styles.rewardItem}>
                    <View style={styles.imageBackground}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.giftIcon}
                        contentFit="contain"
                      />
                    </View>
                    <Text style={styles.rewardValue}>{myReward.giftName}</Text>
                    <Text style={styles.rewardSubtext}>Added to your inventory</Text>
                  </View>
                )}
              </View>

              {/* Awesome Button */}
              <TouchableOpacity style={styles.awesomeBtn} activeOpacity={0.8} onPress={onClose}>
                <LinearGradient
                  colors={["#ffeaa7", "#fdcb6e"]}
                  style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
                />
                <Gift color="#2d3436" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.awesomeBtnText}>Awesome</Text>
              </TouchableOpacity>
            </View>

          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrapper: {
    width: "75%",
    alignItems: "center",
    marginTop: 80, // To give space for the protruding header image
  },
  contentContainer: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.1)",
    paddingTop: 80, // Space inside the card below the protruding image
  },
  headerImageContainer: {
    position: "absolute",
    top: -120, // Push it outside the top of the modal
    alignSelf: "center",
    width: W * 0.8,
    height: W * 0.6,
    zIndex: 10,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },

  innerContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  rewardCard: {
    backgroundColor: "#fffdf9",
    width: "100%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  rewardItem: {
    alignItems: "center",
  },
  imageBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f9f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  giftIcon: {
    width: 90,
    height: 90,
  },
  rewardType: {
    color: "#2a1e5c",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  rewardValue: {
    color: "#1a153a",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  rewardSubtext: {
    color: "#8395a7",
    fontSize: 14,
    fontWeight: "500",
  },
  awesomeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#fdcb6e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  awesomeBtnText: {
    color: "#2d3436",
    fontSize: 18,
    fontWeight: "800",
  },
});
