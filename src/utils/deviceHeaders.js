import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let cachedHeaders = null;

export const getDeviceHeaders = async () => {
  if (cachedHeaders && cachedHeaders['X-Device-Id']) {
    return cachedHeaders;
  }

  let deviceId = null;
  let model = 'Android Device';
  const osType = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;
  const osVersion = String(Platform.Version || '14');
  const appVersion = '1.0.0';

  if (Platform.OS === 'android') {
    model = Platform.constants?.Model || Platform.constants?.Brand || 'Android Device';
  } else if (Platform.OS === 'ios') {
    model = 'iPhone';
  } else {
    model = Platform.OS || 'Device';
  }

  try {
    const stored = await AsyncStorage.getItem('@device_persistent_id');
    if (stored) {
      deviceId = stored;
    } else {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await AsyncStorage.setItem('@device_persistent_id', String(deviceId)).catch(() => {});
    }
  } catch {
    deviceId = `dev_${Date.now()}`;
  }

  cachedHeaders = {
    'X-Device-Id': String(deviceId),
    'X-Device-Model': String(model),
    'X-OS-Type': String(osType),
    'X-OS-Version': String(osVersion),
    'X-App-Version': String(appVersion),
  };

  return cachedHeaders;
};

export const getDeviceId = async () => {
  const headers = await getDeviceHeaders().catch(() => ({}));
  return headers?.['X-Device-Id'] || (await AsyncStorage.getItem('@device_persistent_id')) || null;
};

export const getCurrentDeviceId = async () => {
  return getDeviceId();
};

export const setDeviceId = async (newDeviceId) => {
  if (!newDeviceId) return;
  await AsyncStorage.setItem('@device_persistent_id', String(newDeviceId)).catch(() => {});
  if (cachedHeaders) {
    cachedHeaders['X-Device-Id'] = String(newDeviceId);
  }
};

export default getDeviceHeaders;
