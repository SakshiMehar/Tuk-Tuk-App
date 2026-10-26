import { useCallback, useEffect, useRef, useState } from "react";
import { getTreasureProgress } from "../api/partyApi";

export function useTreasureBoxProgress(roomId, enabled = true) {
  const [treasureState, setTreasureState] = useState(null);
  const stateRef = useRef(null);

  const refreshTreasureState = useCallback(async () => {
    if (!roomId || !enabled) return;
    try {
      const state = await getTreasureProgress(roomId);
      console.log("=== TREASURE PROGRESS API RESPONSE ===", state);
      
      setTreasureState((prev) => {
        const frozen = {
          ...prev,
          ...state,
          powerPercent: state.progressPercentage || 0,
          activeChest: state.completedRound || 0,
          selectedChest: state.completedRound || 0
        };
        stateRef.current = frozen;
        return frozen;
      });
    } catch (err) {
      console.warn("Failed to fetch treasure progress:", err);
    }
  }, [roomId, enabled]);

  useEffect(() => {
    let cancelled = false;
    refreshTreasureState().then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [refreshTreasureState]);

  const selectChest = useCallback((index) => {
    setTreasureState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, selectedChest: index };
      stateRef.current = next;
      return next;
    });
  }, []);

  const updateTreasureState = useCallback((payload) => {
    setTreasureState((prev) => {
      const next = { 
        ...prev, 
        ...payload,
        activeChest: payload.completedRound ?? prev?.completedRound ?? 0
      };
      stateRef.current = next;
      return next;
    });
  }, []);

  return {
    treasureState,
    selectChest,
    refreshTreasureState,
    updateTreasureState,
  };
}
