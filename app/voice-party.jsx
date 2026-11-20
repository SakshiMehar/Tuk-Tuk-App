import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVoiceParty } from "../src/context/VoicePartyContext";

export default function VoicePartyRouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roomId = params.roomId ?? params.id;
  const { activeRoomId, openRoom, setIsMinimized } = useVoiceParty();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!roomId) return;
    const targetRoomId = String(roomId);

    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (activeRoomId === targetRoomId) {
      // Returning to already active room: simply un-minimize to full screen
      setIsMinimized(false);
    } else {
      // Opening new room
      openRoom(targetRoomId, params);
    }
  }, [roomId]);

  // If the active room is closed, exited, kicked, or failed to init, navigate back immediately
  useEffect(() => {
    if (hasInitializedRef.current && !activeRoomId) {
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)/party");
        }
      } catch (e) {
        console.warn("[VoicePartyRouteScreen] Auto-exit navigation back failed:", e);
      }
    }
  }, [activeRoomId]);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});

