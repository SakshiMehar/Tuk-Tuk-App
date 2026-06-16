import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { TREASURE_CHESTS } from "../data/treasureBoxData";
import {
  advanceTreasurePower,
  getPowerTickIntervalMs,
  loadTreasureBoxState,
  saveTreasureBoxState,
} from "../services/treasureBoxService";

export function useTreasureBoxProgress(enabled = true) {
  const [treasureState, setTreasureState] = useState(null);
  const stateRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadTreasureBoxState().then((state) => {
      if (cancelled) return;
      stateRef.current = state;
      setTreasureState(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const current = stateRef.current;
      if (!current) return;

      const nextState = advanceTreasurePower(current);
      if (nextState.activeChest !== current.activeChest) {
        Alert.alert(
          "Chest Unlocked!",
          `You unlocked ${TREASURE_CHESTS[nextState.activeChest]?.name ?? "the next chest"}!`
        );
      }

      stateRef.current = nextState;
      setTreasureState(nextState);
      saveTreasureBoxState(nextState);
    }, getPowerTickIntervalMs());

    return () => clearInterval(interval);
  }, [enabled]);

  const selectChest = useCallback((index) => {
    setTreasureState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, selectedChest: index };
      stateRef.current = next;
      saveTreasureBoxState(next);
      return next;
    });
  }, []);

  return {
    treasureState,
    selectChest,
  };
}
