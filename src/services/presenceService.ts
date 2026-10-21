import { AppState, AppStateStatus } from "react-native";
import { getToken, getUser } from "../store/authStore";
import {
  getLocalLiveRoomId,
  setLocalUserOnline,
  setUserOnlineStatus,
  setLocalUserId,
} from "../utils/liveStatus";
import { wsService } from "./websocket";

let currentAppState: AppStateStatus = AppState.currentState ?? "active";
let isInitialized = false;

/**
 * Initializes app-wide presence tracking based on AppState.
 *
 * Rules:
 * 1. App Active: User is marked Online. WebSocket connects & publishes /app/presence/online.
 * 2. App Background: User is marked Offline (only on "background", not "inactive" which triggers for modals).
 *    Publishes /app/presence/offline unless in an active voice room.
 * 3. App Killed / Disconnected: Spring Boot WebSocket heartbeat timeout marks the user offline.
 */
export const initPresenceManager = () => {
  if (isInitialized) return () => { };
  isInitialized = true;

  console.log(`[Presence] Initializing AppState presence manager (current state: ${currentAppState})`);

  // Sync current user ID with liveStatus so local user is immediately online
  getUser().then((user) => {
    const myUserId = user?.id ?? user?.userId ?? user?._id;
    if (myUserId) {
      setLocalUserId(myUserId);
      setUserOnlineStatus(myUserId, true);
    }
  }).catch(() => {});

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const prev = currentAppState;
    currentAppState = nextAppState;

    console.log(`[Presence] AppState changed: ${prev} -> ${nextAppState}`);

    const token = await getToken().catch(() => null);
    if (!token) {
      return;
    }

    if (nextAppState === "active") {
      // ── App resumed to foreground ──
      setLocalUserOnline(true);
      try {
        const user = await getUser().catch(() => null);
        const myUserId = user?.id ?? user?.userId ?? user?._id;
        if (myUserId) {
          setLocalUserId(myUserId);
          setUserOnlineStatus(myUserId, true);
        }
      } catch {}

      try {
        if (!wsService.isConnected()) {
          await wsService.connect().catch(() => { });
        }
        wsService.sendPresence(true);
      } catch (err) {
        console.warn("[Presence] Failed to send active presence:", err);
      }
    } else if (nextAppState === "background") {
      // ── App truly minimized / backgrounded ──
      const activeLiveRoomId = getLocalLiveRoomId();

      if (activeLiveRoomId) {
        console.log(
          `[Presence] App in background, but user is active in live room ${activeLiveRoomId}. Preserving Live status.`
        );
      } else {
        // User left app and is not in any voice room — mark offline
        setLocalUserOnline(false);
        try {
          const user = await getUser().catch(() => null);
          const myUserId = user?.id ?? user?.userId ?? user?._id;
          if (myUserId) {
            setUserOnlineStatus(myUserId, false);
          }
        } catch {}

        try {
          wsService.sendPresence(false);
        } catch (err) {
          console.warn("[Presence] Failed to send background offline presence:", err);
        }
      }
    }
  };

  const subscription = AppState.addEventListener("change", handleAppStateChange);

  // Initial trigger for current state
  if (currentAppState === "active") {
    setLocalUserOnline(true);
    getToken().then(async (token) => {
      if (token) {
        try {
          const user = await getUser().catch(() => null);
          const myUserId = user?.id ?? user?.userId ?? user?._id;
          if (myUserId) {
            setLocalUserId(myUserId);
            setUserOnlineStatus(myUserId, true);
          }
        } catch {}

        try {
          if (!wsService.isConnected()) {
            await wsService.connect().catch(() => {});
          }
          wsService.sendPresence(true);
        } catch (err) {
          console.warn("[Presence] Failed to connect WebSocket on init:", err);
        }
      }
    }).catch(() => { });
  }

  return () => {
    subscription.remove();
    isInitialized = false;
  };
};
