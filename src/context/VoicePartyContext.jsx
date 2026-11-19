import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import VoiceParty from "../../Components/voice-party";

const VoicePartyContext = createContext(null);

export function VoicePartyProvider({ children }) {
  const router = useRouter();

  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeParams, setActiveParams] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [meta, setMeta] = useState({
    roomName: "",
    profileImageUrl: null,
    coverImage: null,
    isSpeaking: false,
  });
  const [floatingPosition, setFloatingPosition] = useState(null);

  const activeRoomIdRef = useRef(activeRoomId);
  activeRoomIdRef.current = activeRoomId;

  const activeParamsRef = useRef(activeParams);
  activeParamsRef.current = activeParams;

  // Open / Join a voice room session
  const openRoom = useCallback((roomId, params = {}) => {
    const idStr = String(roomId);
    if (activeRoomIdRef.current === idStr) {
      setIsMinimized(false);
    } else {
      setActiveRoomId(idStr);
      setActiveParams(params);
      setIsMinimized(false);
    }
  }, []);

  // Minimize to floating player and navigate back to previous screen
  const minimizeRoom = useCallback(
    (roomMeta) => {
      if (roomMeta) {
        setMeta((prev) => ({ ...prev, ...roomMeta }));
      }
      setIsMinimized(true);
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)/party");
        }
      } catch (e) {
        console.warn("[VoicePartyContext] Navigation back failed:", e);
      }
    },
    [router],
  );

  // Restore room from floating player to full-screen
  const restoreRoom = useCallback(() => {
    setIsMinimized(false);
    const roomId = activeRoomIdRef.current;
    if (roomId) {
      try {
        router.push({
          pathname: "/voice-party",
          params: { roomId, ...(activeParamsRef.current || {}) },
        });
      } catch (e) {
        console.warn("[VoicePartyContext] Restore room navigation failed:", e);
      }
    }
  }, [router]);

  // Explicitly close room on user leave
  const closeRoom = useCallback(() => {
    setActiveRoomId(null);
    setActiveParams(null);
    setIsMinimized(false);
    setMeta({
      roomName: "",
      profileImageUrl: null,
      coverImage: null,
      isSpeaking: false,
    });
  }, []);

  const updateMeta = useCallback((newMeta) => {
    if (!newMeta) return;
    setMeta((prev) => ({ ...prev, ...newMeta }));
  }, []);

  const updateFloatingPosition = useCallback((pos) => {
    setFloatingPosition(pos);
  }, []);

  return (
    <VoicePartyContext.Provider
      value={{
        activeRoomId,
        activeParams,
        isMinimized,
        meta,
        floatingPosition,
        openRoom,
        minimizeRoom,
        restoreRoom,
        closeRoom,
        setIsMinimized,
        updateMeta,
        updateFloatingPosition,
      }}
    >
      {children}
    </VoicePartyContext.Provider>
  );
}

export function useVoiceParty() {
  const context = useContext(VoicePartyContext);
  if (!context) {
    throw new Error("useVoiceParty must be used within a VoicePartyProvider");
  }
  return context;
}

/**
 * Persistent root overlay host that keeps the active VoiceParty room mounted in RAM.
 * When minimized: placed off-screen so Agora, mic, WebSocket, and 15s seat heartbeats
 * keep running without disconnection.
 * When restored: brought to full-screen with zero reload, zero re-join, and no seat loss.
 */
export function VoicePartyOverlayHost() {
  const {
    activeRoomId,
    activeParams,
    isMinimized,
    minimizeRoom,
    closeRoom,
    updateMeta,
  } = useVoiceParty();

  if (!activeRoomId) {
    return null;
  }

  return (
    <View
      style={isMinimized ? styles.hiddenHost : styles.fullScreenHost}
      pointerEvents={isMinimized ? "none" : "auto"}
    >
      <VoiceParty
        key={activeRoomId}
        initialParams={activeParams}
        isMinimized={isMinimized}
        onMinimize={minimizeRoom}
        onClose={closeRoom}
        onUpdateMeta={updateMeta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  hiddenHost: {
    position: "absolute",
    top: -99999,
    left: -99999,
    width: 1,
    height: 1,
    opacity: 0,
    zIndex: -1,
  },
});
