/**
 * Secure Storage Abstraction Layer
 * Handles sensitive tokens (JWT, Refresh tokens).
 * Ready for Keychain / Keystore native integration when needed.
 */
import { storage } from './storage';
import { logger } from '@shared/utils/logger';

class SecureStorageService {
  async getSecureItem(key) {
    try {
      return await storage.getItem(`secure_${key}`);
    } catch (error) {
      logger.error('SecureStorage', `Error reading secure key: ${key}`, error);
      return null;
    }
  }

  async setSecureItem(key, value) {
    try {
      return await storage.setItem(`secure_${key}`, value);
    } catch (error) {
      logger.error('SecureStorage', `Error saving secure key: ${key}`, error);
      return false;
    }
  }

  async removeSecureItem(key) {
    try {
      return await storage.removeItem(`secure_${key}`);
    } catch (error) {
      logger.error('SecureStorage', `Error removing secure key: ${key}`, error);
      return false;
    }
  }
}

export const secureStorage = new SecureStorageService();
export default secureStorage;
