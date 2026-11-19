import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useVoiceParty } from "../src/context/VoicePartyContext";

export default function VoicePartyRouteScreen() {
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

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090B14",
  },
});
