/**
 * Storage Abstraction Layer
 * Provides asynchronous get, set, remove, clear methods with automatic JSON encoding.
 * Implements resilient in-memory caching as fallback.
 */
import { logger } from '@shared/utils/logger';

class StorageService {
  constructor() {
    this.memoryStore = new Map();
  }

  async getItem(key) {
    try {
      if (this.memoryStore.has(key)) {
        return this.memoryStore.get(key);
      }
      return null;
    } catch (error) {
      logger.error('Storage', `Failed to get item for key: ${key}`, error);
      return null;
    }
  }

  async getJson(key, defaultValue = null) {
    try {
      const val = await this.getItem(key);
      if (!val) return defaultValue;
      return JSON.parse(val);
    } catch (error) {
      logger.error('Storage', `Failed to parse JSON for key: ${key}`, error);
      return defaultValue;
    }
  }

  async setItem(key, value) {
    try {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      this.memoryStore.set(key, strValue);
      return true;
    } catch (error) {
      logger.error('Storage', `Failed to set item for key: ${key}`, error);
      return false;
    }
  }

  async removeItem(key) {
    try {
      this.memoryStore.delete(key);
      return true;
    } catch (error) {
      logger.error('Storage', `Failed to remove item for key: ${key}`, error);
      return false;
    }
  }

  async clear() {
    try {
      this.memoryStore.clear();
      return true;
    } catch (error) {
      logger.error('Storage', 'Failed to clear storage', error);
      return false;
    }
  }
}

export const storage = new StorageService();
export default storage;
