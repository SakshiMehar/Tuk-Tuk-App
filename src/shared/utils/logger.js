/**
 * Centralized Logger Service
 * Formats, tags, and controls logs based on environment and feature settings.
 * In production, verbose logs are stripped or suppressed.
 */
import { ENV } from '@app/env';

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

class Logger {
  constructor() {
    this.level = ENV.IS_DEV ? LogLevel.DEBUG : LogLevel.WARN;
  }

  setLevel(level) {
    this.level = level;
  }

  _format(tag, message) {
    const time = new Date().toISOString().substring(11, 19);
    return `[${time}][${tag}] ${message}`;
  }

  debug(tag, message, ...args) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this._format(tag, message), ...args);
    }
  }

  info(tag, message, ...args) {
    if (this.level <= LogLevel.INFO) {
      console.info(this._format(tag, message), ...args);
    }
  }

  warn(tag, message, ...args) {
    if (this.level <= LogLevel.WARN) {
      console.warn(this._format(tag, message), ...args);
    }
  }

  error(tag, message, error = null, ...args) {
    if (this.level <= LogLevel.ERROR) {
      console.error(this._format(tag, message), error, ...args);
    }
  }
}

export const logger = new Logger();
export default logger;
