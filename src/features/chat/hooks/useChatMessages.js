import { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';

export function useChatMessages(chatId) {
  const [loading, setLoading] = useState(false);
  const messages = useChatStore((s) => s.activeMessages[chatId] || []);
  const addMessage = useChatStore((s) => s.addMessage);
  const setMessages = useChatStore((s) => s.setMessages);

  useEffect(() => {
    if (!chatId) return;
    // Initial mock messages
    const initial = [
      { id: 'm1', text: 'Hey there! Welcome to Tuk-Tuk!', isMe: false, time: '10:30' },
      { id: 'm2', text: 'Thanks! Loving the live voice parties here.', isMe: true, time: '10:32' },
    ];
    setMessages(chatId, initial);
  }, [chatId, setMessages]);

  const send = useCallback((text) => {
    const newMsg = {
      id: `msg_${Date.now()}`,
      text,
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addMessage(chatId, newMsg);
  }, [chatId, addMessage]);

  return { messages, send, loading };
}

export default useChatMessages;
