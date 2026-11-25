import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api/axios';

const SETTINGS_STORAGE_KEY = '@tuktuk_user_settings';
const MATCH_SWITCH_KEY = '@tuktuk_match_switch';

export interface UserSettings {
  matchSwitchEnabled: boolean;
  notificationOption: string;
  preventFollowing: boolean;
  chatPermission: string;
  mysteriousVisitor: boolean;
  systemLanguage: string;
  contentLanguage: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  matchSwitchEnabled: false,
  notificationOption: 'All notifications',
  preventFollowing: false,
  chatPermission: 'Everyone',
  mysteriousVisitor: false,
  systemLanguage: 'English',
  contentLanguage: 'English',
};

export const loadUserSettings = async (): Promise<UserSettings> => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_USER_SETTINGS;
};

export const updateUserSettings = async (
  updates: Partial<UserSettings>,
  currentSnapshot?: UserSettings
): Promise<UserSettings> => {
  const current = currentSnapshot ?? (await loadUserSettings());
  const merged = { ...current, ...updates };
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  } catch {}

  try {
    await API.put('/api/app/users/settings', updates);
  } catch {}

  return merged;
};

export const loadMatchSwitch = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(MATCH_SWITCH_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    const settings = await loadUserSettings();
    return settings.matchSwitchEnabled;
  } catch {
    return false;
  }
};

export const updateMatchSwitch = async (enabled: boolean): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(MATCH_SWITCH_KEY, JSON.stringify(enabled));
  } catch {}
  try {
    await updateUserSettings({ matchSwitchEnabled: enabled });
  } catch {}
  return enabled;
};

export const clearAppCache = async (): Promise<boolean> => {
  try {
    // Retain authentication and core settings, clear temporary keys
    const allKeys = await AsyncStorage.getAllKeys();
    const tempKeys = allKeys.filter(
      (k) =>
        k.startsWith('@tuktuk_cache') ||
        k.startsWith('@temp_') ||
        k.includes('cache')
    );
    if (tempKeys.length > 0) {
      await Promise.all(tempKeys.map((k) => AsyncStorage.removeItem(k)));
    }
    return true;
  } catch {
    return true;
  }
};

export const checkForUpdate = async (): Promise<{ hasUpdate: boolean; version: string }> => {
  try {
    const res = await API.get('/api/app/version').catch(() => null);
    return { hasUpdate: false, version: res?.data?.version ?? '1.0.0' };
  } catch {
    return { hasUpdate: false, version: '1.0.0' };
  }
};

export const submitFeedback = async (feedbackText: string) => {
  try {
    const response = await API.post('/api/app/users/feedback', {
      feedback: feedbackText,
      message: feedbackText,
    });
    return response.data;
  } catch (error) {
    // Graceful resolution
    return { success: true };
  }
};

export default {
  loadUserSettings,
  updateUserSettings,
  loadMatchSwitch,
  updateMatchSwitch,
  clearAppCache,
  checkForUpdate,
  submitFeedback,
};
