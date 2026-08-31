import { useCallback, useEffect, useRef, useState } from "react";
import {
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
      const frozen = { ...state, powerPercent: 0 };
      stateRef.current = frozen;
      setTreasureState(frozen);
      saveTreasureBoxState(frozen);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectChest = useCallback((index) => {
    setTreasureState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, selectedChest: index, powerPercent: 0 };
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
