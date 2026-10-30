/**
 * Device Service Boundary
 * Manages device fingerprinting, platform info, and device blocking validation.
 */
import { Platform } from 'react-native';
import { storage } from '@shared/storage/storage';
import { STORAGE_KEYS } from '@shared/storage/storageKeys';
import { logger } from '@shared/utils/logger';

class DeviceService {
  constructor() {
    this.deviceId = null;
  }

  async getDeviceId() {
    if (this.deviceId) return this.deviceId;

    const savedId = await storage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (savedId) {
      this.deviceId = savedId;
      return savedId;
    }

    // Generate stable fallback device ID
    const newId = `tuktuk_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await storage.setItem(STORAGE_KEYS.DEVICE_ID, newId);
    this.deviceId = newId;
    return newId;
  }

  getPlatformInfo() {
    return {
      os: Platform.OS,
      version: Platform.Version,
      isAndroid: Platform.OS === 'android',
      isIOS: Platform.OS === 'ios',
    };
  }

  async checkDeviceBlocked(apiClient) {
    try {
      const deviceId = await this.getDeviceId();
      // Future API check
      logger.info('DeviceService', `Checking block status for device: ${deviceId}`);
      return { isBlocked: false };
    } catch (error) {
      logger.error('DeviceService', 'Failed to check device status', error);
      return { isBlocked: false };
    }
  }
}

export const deviceService = new DeviceService();
export default deviceService;
