/**
 * Party WebSocket Subscriptions Boundary
 * Uses shared websocketService to bind room topics to feature callbacks.
 */
import { websocketService } from '@shared/services/websocket/websocketService';
import { TOPIC_PATTERNS } from '@shared/services/websocket/websocketConstants';

export const partySocketService = {
  subscribeRoomSeats: (roomId, onSeatsUpdate) => {
    const topic = TOPIC_PATTERNS.ROOM_SEATS(roomId);
    return websocketService.subscribe(topic, onSeatsUpdate);
  },

  subscribeRoomChat: (roomId, onChatMessage) => {
    const topic = TOPIC_PATTERNS.ROOM_CHAT(roomId);
    return websocketService.subscribe(topic, onChatMessage);
  },

  subscribeRoomGifts: (roomId, onGiftEvent) => {
    const topic = TOPIC_PATTERNS.ROOM_GIFTS(roomId);
    return websocketService.subscribe(topic, onGiftEvent);
  },

  sendRoomChatMessage: (roomId, messageData) => {
    const topic = TOPIC_PATTERNS.ROOM_CHAT(roomId);
    return websocketService.send(topic, messageData);
  },
};

export default partySocketService;
