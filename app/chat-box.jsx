import { useLocalSearchParams, useRouter } from "expo-router";
import ChatBox from "../Components/ChatBox";

export default function ChatBoxScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const user = {
    userId: params.userId ?? params.id ?? null,
    name: params.name ?? "User",
    avatar: params.avatar ?? null,
    lastMsg: params.lastMsg ?? "",
  };

  console.log("[ChatBox] personal chat user:", JSON.stringify(user, null, 2));

  return <ChatBox user={user} onBack={() => router.back()} />;
}
