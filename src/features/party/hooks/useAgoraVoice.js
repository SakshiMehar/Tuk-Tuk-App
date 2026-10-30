import { useEffect, useState, useCallback } from 'react';
import { agoraVoiceService } from '../services/agoraVoiceService';
import { usePartyStore } from '../store/partyStore';
import { logger } from '@shared/utils/logger';

/**
 * useAgoraVoice - Encapsulates mic mute/unmute and volume indication
 * Isolates volume updates so only affected seats re-render!
 */
export function useAgoraVoice(channelId) {
  const [isMuted, setIsMuted] = useState(false);
  const setSpeaking = usePartyStore((s) => s.setSpeaking);

  useEffect(() => {
    if (!channelId) return;

    agoraVoiceService.joinChannel(channelId);

    // Register volume listener with Agora
    const unsubVolume = agoraVoiceService.onAudioVolumeIndication((speakers) => {
      if (Array.isArray(speakers)) {
        speakers.forEach(({ uid, volume }) => {
          const isSpeaking = volume > 5;
          setSpeaking(String(uid), isSpeaking, volume);
        });
      }
    });

    return () => {
      unsubVolume();
      agoraVoiceService.leaveChannel();
    };
  }, [channelId, setSpeaking]);

  const toggleMute = useCallback(async () => {
    const nextState = !isMuted;
    await agoraVoiceService.setMute(nextState);
    setIsMuted(nextState);
  }, [isMuted]);

  return { isMuted, toggleMute };
}

export default useAgoraVoice;
