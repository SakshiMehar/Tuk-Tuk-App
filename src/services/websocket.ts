import { websocketService } from '../shared/services/websocket/websocketService';

export const wsService: any = websocketService;

if (!wsService.isConnected) {
  wsService.isConnected = () => wsService.getStatus?.() === 'CONNECTED';
}

if (!wsService.sendPresence) {
  wsService.sendPresence = (online = true) => {
    try {
      if (typeof wsService.send === 'function') {
        wsService.send('/app/presence', { online });
      }
    } catch {}
  };
}

if (!wsService.onPresence) {
  wsService.onPresence = (handler: (event: any) => void) => {
    if (typeof wsService.subscribe === 'function') {
      return wsService.subscribe('/topic/presence', handler);
    }
    return () => {};
  };
}

if (!wsService.onMessage) {
  wsService.onMessage = (handler: (msg: any) => void) => {
    if (typeof wsService.subscribe === 'function') {
      return wsService.subscribe('/user/queue/messages', handler);
    }
    return () => {};
  };
}

if (!wsService.sendMessage) {
  wsService.sendMessage = (targetId: string, message: any) => {
    try {
      if (typeof wsService.send === 'function') {
        return wsService.send('/app/chat.send', { targetId, message });
      }
    } catch {}
    return Promise.resolve();
  };
}

export { websocketService };
export default wsService;
