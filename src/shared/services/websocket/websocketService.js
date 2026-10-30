/**
 * Reusable WebSocket / STOMP Connection Boundary
 * Manages transport connection, heartbeat, subscriptions, and message routing.
 * Features subscribe only to their relevant topics — avoiding monolithic hooks!
 */
import { ENV } from '@app/env';
import { WS_STATUS } from './websocketConstants';
import { logger } from '@shared/utils/logger';

class WebSocketService {
  constructor() {
    this.url = ENV.WEBSOCKET_URL;
    this.status = WS_STATUS.DISCONNECTED;
    this.socket = null;
    this.subscriptions = new Map(); // topic -> Set(callbacks)
    this.statusListeners = new Set();
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  getStatus() {
    return this.status;
  }

  _setStatus(newStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    if (ENV.ENABLE_WEBSOCKET_LOGS) {
      logger.info('WebSocketService', `Status changed to: ${newStatus}`);
    }
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus);
      } catch (err) {
        logger.error('WebSocketService', 'Error in status listener', err);
      }
    });
  }

  addStatusListener(callback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  connect() {
    if (this.status === WS_STATUS.CONNECTED || this.status === WS_STATUS.CONNECTING) {
      return;
    }

    this._setStatus(WS_STATUS.CONNECTING);

    try {
      if (ENV.ENABLE_WEBSOCKET_LOGS) {
        logger.info('WebSocketService', `Connecting to ${this.url}`);
      }

      // Standard WebSocket interface boundary
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this._setStatus(WS_STATUS.CONNECTED);
        this._resubscribeAll();
      };

      this.socket.onmessage = (event) => {
        this._handleIncomingMessage(event.data);
      };

      this.socket.onerror = (error) => {
        logger.error('WebSocketService', 'WebSocket error event', error);
        this._setStatus(WS_STATUS.ERROR);
      };

      this.socket.onclose = () => {
        this._setStatus(WS_STATUS.DISCONNECTED);
        this._handleAutoReconnect();
      };
    } catch (error) {
      logger.error('WebSocketService', 'Failed to initialize WebSocket', error);
      this._setStatus(WS_STATUS.ERROR);
      this._handleAutoReconnect();
    }
  }

  _handleAutoReconnect() {
    if (this.reconnectAttempts >= ENV.WS_MAX_RECONNECT_ATTEMPTS) {
      logger.warn('WebSocketService', 'Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this._setStatus(WS_STATUS.RECONNECTING);

    const delay = Math.min(ENV.WS_RECONNECT_INTERVAL_MS * this.reconnectAttempts, 30000);
    logger.info('WebSocketService', `Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectAttempts = 0;

    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        // ignore close error
      }
      this.socket = null;
    }

    this._setStatus(WS_STATUS.DISCONNECTED);
  }

  /**
   * Subscribe to a specific topic (e.g., `/topic/room/123/seats`)
   * Returns an unsubscribe function.
   */
  subscribe(topic, callback) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      this._sendSubscriptionFrame(topic);
    }

    const callbacks = this.subscriptions.get(topic);
    callbacks.add(callback);

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(topic);
        this._sendUnsubscribeFrame(topic);
      }
    };
  }

  _sendSubscriptionFrame(topic) {
    if (this.status !== WS_STATUS.CONNECTED || !this.socket) return;
    try {
      this.socket.send(JSON.stringify({ action: 'sub', topic }));
    } catch (err) {
      logger.error('WebSocketService', `Failed to send subscribe frame: ${topic}`, err);
    }
  }

  _sendUnsubscribeFrame(topic) {
    if (this.status !== WS_STATUS.CONNECTED || !this.socket) return;
    try {
      this.socket.send(JSON.stringify({ action: 'unsub', topic }));
    } catch (err) {
      logger.error('WebSocketService', `Failed to send unsub frame: ${topic}`, err);
    }
  }

  _resubscribeAll() {
    this.subscriptions.forEach((_, topic) => {
      this._sendSubscriptionFrame(topic);
    });
  }

  send(topic, payload) {
    if (this.status !== WS_STATUS.CONNECTED || !this.socket) {
      logger.warn('WebSocketService', `Cannot send on ${topic}: socket not connected`);
      return false;
    }

    try {
      const message = JSON.stringify({ topic, data: payload, timestamp: Date.now() });
      this.socket.send(message);
      return true;
    } catch (err) {
      logger.error('WebSocketService', `Failed to send message on ${topic}`, err);
      return false;
    }
  }

  _handleIncomingMessage(raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const { topic, data } = parsed;

      if (topic && this.subscriptions.has(topic)) {
        const callbacks = this.subscriptions.get(topic);
        callbacks.forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            logger.error('WebSocketService', `Error in topic callback: ${topic}`, err);
          }
        });
      }
    } catch (err) {
      // Non-JSON frame (e.g. heartbeat or pong)
      if (raw !== 'pong') {
        logger.debug('WebSocketService', `Non-JSON message received: ${raw}`);
      }
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
