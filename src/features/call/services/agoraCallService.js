import { logger } from '@shared/utils/logger';

export const agoraCallService = {
  joinCallChannel: (callId) => {
    logger.info('agoraCallService', `Joining call channel: ${callId}`);
  },
  leaveCallChannel: () => {
    logger.info('agoraCallService', 'Leaving call channel');
  },
  toggleMute: (isMuted) => {
    logger.info('agoraCallService', `Call mute: ${isMuted}`);
  },
};

export const callBackgroundService = {
  startForegroundService: () => {
    logger.info('callBackgroundService', 'Starting call background audio service');
  },
  stopForegroundService: () => {
    logger.info('callBackgroundService', 'Stopping call background service');
  },
};
