import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Universal getMany compatible with AsyncStorage v1, v2, v3
 * Returns Record<string, string | null>
 */
export const safeGetMany = async (keys) => {
  try {
    if (typeof AsyncStorage?.getMany === 'function') {
      return await AsyncStorage.getMany(keys);
    }
    if (typeof AsyncStorage?.multiGet === 'function') {
      const entries = await AsyncStorage.multiGet(keys);
      return Object.fromEntries(entries || []);
    }
    const result = {};
    await Promise.all(
      keys.map(async (key) => {
        try {
          result[key] = await AsyncStorage.getItem(key);
        } catch {
          result[key] = null;
        }
      })
    );
    return result;
  } catch {
    return {};
  }
};

/**
 * Universal setMany compatible with AsyncStorage v1, v2, v3
 * Accepts either Record<string, string> or Array<[string, string]>
 */
export const safeSetMany = async (entries) => {
  try {
    const obj = Array.isArray(entries) ? Object.fromEntries(entries) : entries;
    if (typeof AsyncStorage?.setMany === 'function') {
      return await AsyncStorage.setMany(obj);
    }
    if (typeof AsyncStorage?.multiSet === 'function') {
      return await AsyncStorage.multiSet(Object.entries(obj));
    }
    await Promise.all(
      Object.entries(obj).map(([key, val]) =>
        AsyncStorage.setItem(key, String(val ?? ''))
      )
    );
  } catch {}
};

/**
 * Universal removeMany compatible with AsyncStorage v1, v2, v3
 * Accepts Array<string>
 */
export const safeRemoveMany = async (keys) => {
  try {
    if (typeof AsyncStorage?.removeMany === 'function') {
      return await AsyncStorage.removeMany(keys);
    }
    if (typeof AsyncStorage?.multiRemove === 'function') {
      return await AsyncStorage.multiRemove(keys);
    }
    await Promise.all(
      keys.map((key) => AsyncStorage.removeItem(key).catch(() => {}))
    );
  } catch {}
};

export default {
  safeGetMany,
  safeSetMany,
  safeRemoveMany,
};
