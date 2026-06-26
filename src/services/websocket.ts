/**
 * Singleton STOMP-over-SockJS client.
 *
 * Connect endpoint: /ws-tuktuk
 * Auth header: Authorization: Bearer <token>
 *
 * Rules:
 *  - NEVER call connect() before the user has logged in.
 *  - Call connect() immediately after saveSession() resolves.
 *  - Call disconnect() on logout.
 *
 * Room chat (voice party):
 *   await wsService.connect();
 *   wsService.joinRoom(roomId);  // subscribes /topic/room/{roomId}/chat (+ summary, speaking, …)
 *   wsService.sendRoomMessage(roomId, 'Hello room');  // → /app/room/{roomId}/chat
 *   const unsub = wsService.onRoomChat(roomId, (msg) => ...);
 *   wsService.leaveRoom(roomId);
 */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken, getUser } from '../store/authStore';
import { API_BASE_URL } from '../config/env';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MessageStatus = 'MESSAGE_SENT' | 'MESSAGE_DELIVERED' | 'MESSAGE_READ';

export interface ChatMessage {
  messageId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
}

export interface TypingPayload {
  senderId: string;
  receiverId: string;
  isTyping: boolean;
}

export interface PresencePayload {
  userId: string;
  online: boolean;
  lastSeen?: string;
}

export interface ReadReceiptPayload {
  messageId: string;
  readerId: string;
  status: MessageStatus;
}

export interface RoomChatPayload {
  id?: number | string;
  roomId?: string;
  message: string;
  senderId?: string;
  senderName?: string;
  createdAt?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface RoomChatSummaryPayload {
  roomId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  messageCount?: number;
  [key: string]: unknown;
}

export interface RoomSpeakingPayload {
  isSpeaking: boolean;
  userId?: string;
  [key: string]: unknown;
}

export type RoomTopic =
  | 'chat'
  | 'chat-summary'
  | 'speaking'
  | 'ui-state'
  | 'gift-animation'
  | 'closed'
  | 'moderation';

type Handler<T> = (payload: T) => void;

const ROOM_TOPICS: RoomTopic[] = [
  'chat',
  'chat-summary',
  'speaking',
  'ui-state',
  'gift-animation',
  'closed',
  'moderation',
];

// ── Service ────────────────────────────────────────────────────────────────────

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private subscriptions = new Map<string, StompSubscription>();
  private joinedRooms = new Set<string>();

  private messageHandlers  = new Set<Handler<ChatMessage>>();
  private typingHandlers   = new Set<Handler<TypingPayload>>();
  private presenceHandlers = new Set<Handler<PresencePayload>>();
  private receiptHandlers  = new Set<Handler<ReadReceiptPayload>>();
  private liveRoomsHandlers = new Set<Handler<unknown>>();

  private roomHandlers = new Map<string, Map<RoomTopic, Set<Handler<unknown>>>>();

  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private connectPromise: Promise<void> | null = null;

  // ── Connection ─────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.connected) return;

    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }

    const token = await getToken();
    if (!token) throw new Error('[WS] No auth token — login first.');

    if (this.client?.active) {
      await this._waitUntilConnected();
      return;
    }

    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-tuktuk`) as unknown as WebSocket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          this._onConnect();
          resolve();
        },
        onDisconnect: this._onDisconnect.bind(this),
        onStompError: (frame) => {
          reject(new Error(frame.headers?.message || '[WS] STOMP connect failed.'));
        },
      });

      this.client.activate();
    });

    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  private _waitUntilConnected(timeoutMs = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (this.connected) {
          resolve();
          return;
        }
        if (Date.now() - started >= timeoutMs) {
          reject(new Error('[WS] Connection timeout.'));
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    });
  }

  disconnect(): void {
    this.joinedRooms.forEach((roomId) => this._unsubscribeRoom(roomId));
    this.joinedRooms.clear();
    this._unsubscribeAll();
    this.client?.deactivate();
    this.client = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private _onConnect(): void {
    this.connected = true;

    this._subscribeUserChats();
    this._sub('rooms-live', '/topic/rooms/live', this.liveRoomsHandlers);

    this.joinedRooms.forEach((roomId) => this._subscribeRoomTopics(roomId));
  }

  private _subscribeUserChats(): void {
    getUser().then((user) => {
      const userId = user?.id ?? user?.userId ?? user?._id;
      if (!userId || !this.client || !this.connected) return;

      const key = 'user-chats';
      if (this.subscriptions.has(key)) return;

      const destination = `/topic/users/${userId}/chats`;
      
      const sub = this.client.subscribe(destination, (frame: IMessage) => {
        const payload: ChatMessage = JSON.parse(frame.body);
        
        this.messageHandlers.forEach((h) => h(payload));
      });
      this.subscriptions.set(key, sub);
    });
  }

  private _onDisconnect(): void {
    this.connected = false;
    // Clear the subscriptions map so that when the STOMP client auto-reconnects
    // (reconnectDelay), _onConnect → _subscribeUserChats doesn't find the stale
    // key and skip re-subscribing. Without this, incoming messages are silently
    // dropped after every automatic reconnection until the user logs out/in.
    this.subscriptions.clear();
  }

  private _sub<T>(
    key: string,
    destination: string,
    handlers: Set<Handler<T>>,
  ): void {
    const sub = this.client!.subscribe(destination, (frame: IMessage) => {
      const payload: T = JSON.parse(frame.body);
      handlers.forEach((h) => h(payload));
    });
    this.subscriptions.set(key, sub);
  }

  private _roomSubKey(roomId: string, topic: RoomTopic): string {
    return `room:${roomId}:${topic}`;
  }

  private _subscribeRoomTopics(roomId: string): void {
    if (!this.client || !this.connected) return;

    ROOM_TOPICS.forEach((topic) => {
      const key = this._roomSubKey(roomId, topic);
      if (this.subscriptions.has(key)) return;

      const destination = `/topic/room/${roomId}/${topic}`;
      const handlers = this._getRoomHandlerSet(roomId, topic);

      const sub = this.client!.subscribe(destination, (frame: IMessage) => {
        const payload = JSON.parse(frame.body);
        handlers.forEach((h) => h(payload));
      });
      this.subscriptions.set(key, sub);
    });
  }

  private _unsubscribeRoom(roomId: string): void {
    ROOM_TOPICS.forEach((topic) => {
      const key = this._roomSubKey(roomId, topic);
      this.subscriptions.get(key)?.unsubscribe();
      this.subscriptions.delete(key);
    });
    this.roomHandlers.delete(roomId);
  }

  private _unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.roomHandlers.clear();
  }

  private _getRoomHandlerSet(roomId: string, topic: RoomTopic): Set<Handler<unknown>> {
    if (!this.roomHandlers.has(roomId)) {
      this.roomHandlers.set(roomId, new Map());
    }
    const roomMap = this.roomHandlers.get(roomId)!;
    if (!roomMap.has(topic)) {
      roomMap.set(topic, new Set());
    }
    return roomMap.get(topic)!;
  }

  private _assertConnected(): void {
    if (!this.connected) throw new Error('[WS] Not connected — call connect() after login.');
  }

  // ── Room (voice party) ─────────────────────────────────────────────────────

  joinRoom(roomId: string): void {
    if (!roomId) return;
    const id = String(roomId);
    this.joinedRooms.add(id);
    if (this.connected) {
      this._subscribeRoomTopics(id);
    }
  }

  leaveRoom(roomId: string): void {
    this.joinedRooms.delete(roomId);
    this._unsubscribeRoom(roomId);
  }

  async sendRoomMessage(roomId: string, message: string): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
    this._assertConnected();
    const destination = `/app/room/${roomId}/chat`;
    const body = JSON.stringify({ message, content: message, text: message });
    this.client!.publish({ destination, body });
  }

  sendSpeakingStatus(roomId: string, isSpeaking: boolean): void {
    this._assertConnected();
    const destination = `/app/room/${roomId}/speaking`;
    const body = JSON.stringify({ isSpeaking });
    this.client!.publish({ destination, body });
  }

  onRoomChat(roomId: string, handler: Handler<RoomChatPayload>): () => void {
    return this._onRoomTopic(roomId, 'chat', handler as Handler<unknown>);
  }

  onRoomChatSummary(roomId: string, handler: Handler<RoomChatSummaryPayload>): () => void {
    return this._onRoomTopic(roomId, 'chat-summary', handler as Handler<unknown>);
  }

  onRoomSpeaking(roomId: string, handler: Handler<RoomSpeakingPayload>): () => void {
    return this._onRoomTopic(roomId, 'speaking', handler as Handler<unknown>);
  }

  onRoomUiState(roomId: string, handler: Handler<unknown>): () => void {
    return this._onRoomTopic(roomId, 'ui-state', handler);
  }

  onRoomGiftAnimation(roomId: string, handler: Handler<unknown>): () => void {
    return this._onRoomTopic(roomId, 'gift-animation', handler);
  }

  onRoomClosed(roomId: string, handler: Handler<unknown>): () => void {
    return this._onRoomTopic(roomId, 'closed', handler);
  }

  onRoomModeration(roomId: string, handler: Handler<unknown>): () => void {
    return this._onRoomTopic(roomId, 'moderation', handler);
  }

  onLiveRooms(handler: Handler<unknown>): () => void {
    this.liveRoomsHandlers.add(handler);
    return () => this.liveRoomsHandlers.delete(handler);
  }

  private _onRoomTopic(
    roomId: string,
    topic: RoomTopic,
    handler: Handler<unknown>,
  ): () => void {
    const handlers = this._getRoomHandlerSet(roomId, topic);
    handlers.add(handler);
    if (this.connected && this.joinedRooms.has(roomId)) {
      this._subscribeRoomTopics(roomId);
    }
    return () => handlers.delete(handler);
  }

  // ── 1:1 chat publish ─────────────────────────────────────────────────────

  sendMessage(recipientId: string, content: string): void {
    this._assertConnected();
    const destination = `/app/users/${recipientId}/chat`;
    const body = JSON.stringify({ message: content });
    this.client!.publish({ destination, body });
    
  }

  notifyTyping(receiverId: string): void {
    if (!this.connected) return;
    this._sendTypingFrame(receiverId, true);
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this._sendTypingFrame(receiverId, false);
    }, 2000);
  }

  stopTyping(receiverId: string): void {
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this._sendTypingFrame(receiverId, false);
  }

  markAsRead(messageId: string): void {
    if (!this.connected) return;
    this.client!.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({ messageId, status: 'MESSAGE_READ' }),
    });
  }

  private _sendTypingFrame(receiverId: string, isTyping: boolean): void {
    if (!this.connected) return;
    this.client!.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ receiverId, isTyping }),
    });
  }

  // ── 1:1 event subscriptions ────────────────────────────────────────────────

  onMessage(handler: Handler<ChatMessage>): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onTyping(handler: Handler<TypingPayload>): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  onPresence(handler: Handler<PresencePayload>): () => void {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  onReadReceipt(handler: Handler<ReadReceiptPayload>): () => void {
    this.receiptHandlers.add(handler);
    return () => this.receiptHandlers.delete(handler);
  }
}

export const wsService = new WebSocketService();
