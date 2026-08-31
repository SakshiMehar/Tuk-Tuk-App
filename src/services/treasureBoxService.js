import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TREASURE_POWER_TICK_MS,
  TREASURE_POWER_TICK_PERCENT,
} from "../data/treasureBoxData";

const STORAGE_KEY = "@treasure_box_state";

const getTodayKey = () => {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffsetMs);
  return `${ist.getUTCFullYear()}-${ist.getUTCMonth() + 1}-${ist.getUTCDate()}`;
};

const defaultState = () => ({
  activeChest: 0,
  selectedChest: 0,
  powerPercent: 0,
  lastResetDate: getTodayKey(),
});

export const loadTreasureBoxState = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();

    const parsed = JSON.parse(raw);
    const today = getTodayKey();

    if (parsed.lastResetDate !== today) {
      const fresh = defaultState();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }

    return {
      ...defaultState(),
      ...parsed,
      // Keep the bar reset to 0 when loading persisted state.
      powerPercent: 0,
      activeChest: Math.min(3, Math.max(0, Number(parsed.activeChest) || 0)),
      selectedChest: Math.min(3, Math.max(0, Number(parsed.selectedChest) || 0)),
    };
  } catch {
    return defaultState();
  }
};

export const saveTreasureBoxState = async (state) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        lastResetDate: state.lastResetDate ?? getTodayKey(),
      })
    );
  } catch {
    // ignore persistence errors
  }
};

export const advanceTreasurePower = (state) => {
  if (state.activeChest >= 3 && state.powerPercent >= 100) {
    return state;
  }

  const nextPower = Math.min(100, state.powerPercent + TREASURE_POWER_TICK_PERCENT);
  if (nextPower < 100) {
    return { ...state, powerPercent: nextPower };
  }

  if (state.activeChest < 3) {
    return {
      ...state,
      powerPercent: 0,
      activeChest: state.activeChest + 1,
      selectedChest: state.activeChest + 1,
    };
  }

  return { ...state, powerPercent: 100 };
};

export const getPowerTickIntervalMs = () => TREASURE_POWER_TICK_MS;
