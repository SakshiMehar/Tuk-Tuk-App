import { wsService } from "../services/websocket";

export const buildChatBoxParams = (user) => {
  const userId = String(user?.userId ?? user?.id ?? "");
  const name = user?.name ?? user?.username ?? user?.senderName ?? "User";
  const params = {
    userId,
    name,
  };
  const avatar =
    user?.avatar ??
    user?.avatarUrl ??
    user?.profileImageUrl ??
    user?.profilePicUrl ??
    user?.profileImage;
  if (avatar) params.avatar = String(avatar);
  if (user?.lastMsg) params.lastMsg = String(user.lastMsg);
  const level = user?.level ?? user?.userLevel ?? user?.lvl;
  if (level != null) params.level = String(level);

  const isOfficial = Boolean(
    user?.officialSender === true ||
    user?.officialSender === "true" ||
    user?.isOfficial === true ||
    user?.isOfficial === "true" ||
    user?.official === true ||
    user?.official === "true" ||
    user?.lastMessage?.officialSender ||
    name === "Tuk Tuk Team" ||
    userId === "100005"
  );
  if (isOfficial) {
    params.officialSender = "true";
  } else if (user?.officialSender != null) {
    params.officialSender = String(user.officialSender);
  }
  return params;
};

/** Connect WS then open 1:1 chat screen. */
export const openUserChat = async (router, user) => {
  const userId = String(user?.userId ?? user?.id ?? "");
  if (!userId) return false;

  const params = buildChatBoxParams({ ...user, userId });
  

  try {
    await wsService.connect();
  } catch {
    // ChatBox will retry connect on mount
  }

  router.push({
    pathname: "/chat-box",
    params,
  });
  return true;
};
