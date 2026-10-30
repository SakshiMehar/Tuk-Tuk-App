import { create } from 'zustand';
import { WS_STATUS } from '@shared/services/websocket/websocketConstants';

export const useConnectionStore = create((set) => ({
  status: WS_STATUS.DISCONNECTED,
  latencyMs: 0,
  lastPingTimestamp: null,

  setStatus: (status) => set({ status }),
  setLatency: (latencyMs) => set({ latencyMs, lastPingTimestamp: Date.now() }),
}));

export default useConnectionStore;
