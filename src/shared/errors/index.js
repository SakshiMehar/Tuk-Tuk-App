import AppError from './AppError';

export class ApiError extends AppError {
  constructor(message, status = 500, responseData = null, originalError = null) {
    super(message, `API_ERROR_${status}`, responseData);
    this.name = 'ApiError';
    this.status = status;
    this.responseData = responseData;
    this.originalError = originalError;
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required', code = 'AUTH_REQUIRED') {
    super(message, code);
    this.name = 'AuthError';
  }
}

export class WebSocketError extends AppError {
  constructor(message, originalError = null) {
    super(message, 'WEBSOCKET_ERROR');
    this.name = 'WebSocketError';
    this.originalError = originalError;
  }
}

export { AppError };
export default {
  AppError,
  ApiError,
  AuthError,
  WebSocketError,
};
