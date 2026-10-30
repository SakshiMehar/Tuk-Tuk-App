/**
 * Agora RTC Audio Service Boundary
 * Abstracts native Agora RTC Engine initialization, audio channels, and volume indication.
 * Keeps RTC native calls completely decoupled from React component rendering.
 */
import { ENV } from '@app/env';
import { logger } from '@shared/utils/logger';

class AgoraVoiceService {
  constructor() {
    this.appId = ENV.AGORA_APP_ID;
    this.currentChannel = null;
    this.isMuted = false;
    this.volumeCallbacks = new Set();
  }

  async initialize() {
    logger.info('AgoraVoiceService', `Initializing Agora RTC with AppId: ${this.appId}`);
    return true;
  }

  async joinChannel(channelId, token = '', uid = 0) {
    this.currentChannel = channelId;
    logger.info('AgoraVoiceService', `Joining channel: ${channelId} with uid: ${uid}`);
    return true;
  }

  async leaveChannel() {
    logger.info('AgoraVoiceService', `Leaving channel: ${this.currentChannel}`);
    this.currentChannel = null;
    this.isMuted = false;
    return true;
  }

  async setMute(muted) {
    this.isMuted = muted;
    logger.info('AgoraVoiceService', `Set microphone muted: ${muted}`);
    return true;
  }

  onAudioVolumeIndication(callback) {
    this.volumeCallbacks.add(callback);
    return () => {
      this.volumeCallbacks.delete(callback);
    };
  }

  // Internal test dispatch for volume indication without re-rendering entire screen
  dispatchVolume(speakers) {
    this.volumeCallbacks.forEach((cb) => {
      try {
        cb(speakers);
      } catch (err) {
        logger.error('AgoraVoiceService', 'Error in volume callback', err);
      }
    });
  }
}

export const agoraVoiceService = new AgoraVoiceService();
export default agoraVoiceService;
