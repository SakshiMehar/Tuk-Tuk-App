import { getChats, getUserMessages, markUserMessagesRead } from "../api/chatApi";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const listFrom = (value, key) => {
  const target = key && value?.[key] !== undefined ? value[key] : value;
  if (Array.isArray(target)) return target;
  return target?.content ?? target?.data ?? target?.items ?? target?.chats ?? [];
};

const normalizeConversation = (conversation) => ({
  ...conversation,
  id: firstValue(conversation?.id, conversation?.conversationId, conversation?._id),
  userId: firstValue(
    conversation?.userId,
    conversation?.peerId,
    conversation?.receiverId,
    conversation?.otherUserId,
    conversation?.user?.id
  ),
  name: firstText(
    conversation?.name,
    conversation?.username,
    conversation?.displayName,
    conversation?.user?.name
  ) ?? "User",
  avatar: firstText(
    conversation?.avatar,
    conversation?.avatarUrl,
    conversation?.profileImage,
    conversation?.photoUrl,
    conversation?.user?.avatar
  ),
  lastMsg: firstText(conversation?.lastMsg, conversation?.lastMessage, conversation?.content) ?? "",
  time: firstText(conversation?.time, conversation?.lastMessageTime, conversation?.updatedAt) ?? "",
  unread: conversation?.unread ?? conversation?.unreadCount ?? 0,
  verified: Boolean(conversation?.verified),
  live: Boolean(conversation?.live ?? conversation?.isLive),
  liked: Boolean(conversation?.liked),
});

const normalizeMessage = (message) => ({
  ...message,
  messageId: firstValue(message?.messageId, message?.id, message?._id),
  senderId: firstValue(message?.senderId, message?.fromUserId),
  receiverId: firstValue(message?.receiverId, message?.toUserId),
  content: firstText(message?.content, message?.text, message?.message) ?? "",
  timestamp: firstText(message?.timestamp, message?.createdAt, message?.sentAt) ?? "",
  status: message?.status ?? "MESSAGE_SENT",
});

export const loadConversations = async () => {
  const data = await getChats();
  const conversations = Array.isArray(data) ? data : listFrom(data, "chats");
  return conversations.map(normalizeConversation);
};

export const loadChatHistory = async (userId) => {
  const data = await getUserMessages(userId);
  const messages = Array.isArray(data) ? data : listFrom(data, "messages");
  return {
    messages: messages.map(normalizeMessage),
    hasMore: data?.hasMore ?? false,
  };
};

export const markChatAsRead = async (userId) => markUserMessagesRead(userId);
