/**
 * Shared API Client
 * Centralized fetch-based HTTP client with timeout, error normalization, and token injection.
 * UI components NEVER make fetch/axios calls directly.
 */
import { ENV } from '@app/env';
import { ApiError } from '@shared/errors';
import { logger } from '@shared/utils/logger';

class ApiClient {
  constructor() {
    this.baseUrl = ENV.API_BASE_URL;
    this.defaultTimeout = ENV.DEFAULT_API_TIMEOUT_MS;
    this.authToken = null;
    this.deviceId = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  setDeviceId(deviceId) {
    this.deviceId = deviceId;
  }

  _getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    if (this.deviceId) {
      headers['X-Device-Id'] = this.deviceId;
    }

    return headers;
  }

  async _request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const config = {
      method: options.method || 'GET',
      headers: this._getHeaders(options.headers),
      signal: controller.signal,
    };

    if (options.body) {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const startTime = Date.now();

    try {
      if (ENV.ENABLE_NETWORK_LOGS) {
        logger.debug('ApiClient', `--> ${config.method} ${url}`);
      }

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      let responseData = null;

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json().catch(() => null);
      } else {
        responseData = await response.text().catch(() => null);
      }

      if (ENV.ENABLE_NETWORK_LOGS) {
        logger.debug('ApiClient', `<-- ${response.status} ${config.method} ${url} (${duration}ms)`);
      }

      if (!response.ok) {
        throw new ApiError(
          (responseData && responseData.message) || `HTTP Error ${response.status}`,
          response.status,
          responseData,
        );
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        logger.error('ApiClient', `Request timed out: ${config.method} ${url}`);
        throw new ApiError('Request timed out', 408, null, error);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('ApiClient', `Network failure: ${config.method} ${url}`, error);
      throw new ApiError(error.message || 'Network request failed', 0, null, error);
    }
  }

  get(endpoint, options = {}) {
    return this._request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this._request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this._request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this._request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this._request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
