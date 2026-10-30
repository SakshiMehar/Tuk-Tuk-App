import { create } from 'zustand';

export const useCallStore = create((set) => ({
  activeCall: null, // { id, callerName, isIncoming, status: 'ringing'|'connected'|'ended', isVideo: false }
  isMuted: false,
  isSpeakerOn: false,

  setActiveCall: (call) => set({ activeCall: call }),
  setMuted: (isMuted) => set({ isMuted }),
  setSpeaker: (isSpeakerOn) => set({ isSpeakerOn }),
  endCall: () => set({ activeCall: null, isMuted: false, isSpeakerOn: false }),
}));

export default useCallStore;
