/**
 * Push Notification Service Boundary
 * Abstracts native FCM / APNS registration, foreground handlers, and deep navigation triggers.
 * Keeps native platform details isolated from UI components.
 */
import { logger } from '@shared/utils/logger';

class PushNotificationService {
  constructor() {
    this.fcmToken = null;
    this.notificationHandlers = new Set();
  }

  async initialize() {
    logger.info('PushNotificationService', 'Initializing notification service boundary');
    // Future: Integrate native @react-native-firebase/messaging
    return true;
  }

  async requestPermission() {
    logger.info('PushNotificationService', 'Requesting notification permissions');
    return true;
  }

  async getDeviceToken() {
    if (!this.fcmToken) {
      this.fcmToken = 'mock_fcm_token_' + Date.now();
    }
    return this.fcmToken;
  }

  onNotificationReceived(handler) {
    this.notificationHandlers.add(handler);
    return () => this.notificationHandlers.delete(handler);
  }

  dispatchNotification(payload) {
    this.notificationHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        logger.error('PushNotificationService', 'Error in notification handler', err);
      }
    });
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
