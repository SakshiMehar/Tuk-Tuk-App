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

const peerFrom = (conversation) =>
  conversation?.peer ??
  conversation?.otherUser ??
  conversation?.user ??
  conversation?.participant ??
  null;

export const formatChatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday - startOfDate) / 86400000);

  if (dayDiff === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const normalizeConversation = (conversation) => {
  const peer = peerFrom(conversation);
  const lastMessage =
    conversation?.lastMessage && typeof conversation.lastMessage === "object"
      ? conversation.lastMessage
      : null;
  const lastAt = firstValue(
    conversation?.lastMessageAt,
    conversation?.lastMessageTime,
    lastMessage?.sentAt,
    lastMessage?.createdAt,
    conversation?.updatedAt,
    conversation?.time,
    conversation?.sentAt
  );

  return {
    ...conversation,
    id: firstValue(conversation?.id, conversation?.conversationId, conversation?._id, peer?.id),
    userId: firstValue(
      conversation?.userId,
      conversation?.peerId,
      conversation?.receiverId,
      conversation?.otherUserId,
      peer?.id,
      peer?.userId
    ),
    name:
      firstText(
        conversation?.name,
        conversation?.username,
        conversation?.displayName,
        peer?.name,
        peer?.username
      ) ?? "User",
    avatar: firstText(
      conversation?.avatar,
      conversation?.avatarUrl,
      conversation?.profileImage,
      conversation?.profileImageUrl,
      conversation?.profilePicUrl,
      conversation?.photoUrl,
      peer?.avatar,
      peer?.avatarUrl,
      peer?.profileImageUrl,
      peer?.profilePicUrl,
      peer?.profileImage
    ),
    lastMsg:
      firstText(
        conversation?.lastMsg,
        typeof conversation?.lastMessage === "string" ? conversation.lastMessage : null,
        lastMessage?.message,
        lastMessage?.content,
        lastMessage?.text,
        lastMessage?.body,
        conversation?.message,
        conversation?.content,
        conversation?.body
      ) ?? "",
    time: formatChatTime(lastAt) || firstText(conversation?.time) || "",
    unread: Number(conversation?.unread ?? conversation?.unreadCount ?? 0) || 0,
    verified: Boolean(conversation?.verified ?? peer?.verified ?? peer?.vip),
    live: Boolean(conversation?.live ?? conversation?.isLive ?? peer?.isLive),
    liked: Boolean(conversation?.liked),
  };
};

const normalizeMessage = (message) => ({
  ...message,
  messageId: firstValue(message?.messageId, message?.id, message?._id),
  senderId: firstValue(message?.senderId, message?.fromUserId),
  receiverId: firstValue(message?.receiverId, message?.toUserId),
  content: firstText(message?.content, message?.text, message?.message, message?.body) ?? "",
  timestamp: firstText(message?.timestamp, message?.createdAt, message?.sentAt) ?? "",
  status: message?.status ?? "MESSAGE_SENT",
});

export const loadConversations = async () => {
  const data = await getChats();
  const conversations = Array.isArray(data) ? data : listFrom(data, "chats");
  const list = conversations.map(normalizeConversation);
  console.log("[chatService] chat list:", JSON.stringify(list, null, 2));
  return list;
};

export const loadChatHistory = async (userId) => {
  const data = await getUserMessages(userId);
  const messages = Array.isArray(data) ? data : listFrom(data, "messages");
  const list = messages.map(normalizeMessage);
  console.log(
    `[chatService] personal chat messages userId=${userId}:`,
    JSON.stringify(list, null, 2)
  );
  return {
    messages: list,
    hasMore: data?.hasMore ?? false,
  };
};

export const markChatAsRead = async (userId) => markUserMessagesRead(userId);
