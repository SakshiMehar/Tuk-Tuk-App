import { useLocalSearchParams, useRouter } from "expo-router";
import ChatBox from "../Components/ChatBox";

export default function ChatBoxScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const user = {
    userId: params.userId ?? params.id ?? null,
    name: params.name ?? "User",
    // Avatar URLs passed as route params get URL-encoded — decode before use
    avatar: params.avatar ? decodeURIComponent(params.avatar) : null,
    lastMsg: params.lastMsg ?? "",
    level: params.level ? Number(params.level) : null,
  };

  

  return <ChatBox user={user} onBack={() => router.back()} />;
}
