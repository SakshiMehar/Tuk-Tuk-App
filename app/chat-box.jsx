import { useLocalSearchParams, useRouter } from "expo-router";
import ChatBox from "../Components/ChatBox";

export default function ChatBoxScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const user = {
    name: params.name ?? "User",
    avatar: params.avatar ?? "https://randomuser.me/api/portraits/men/34.jpg",
    matchPercent: Number(params.matchPercent ?? 95),
    interests: params.interests ? params.interests.split(",") : ["TV shows"],
    location: params.location ?? "Indore",
    likeCount: Number(params.likeCount ?? 0),
  };

  return <ChatBox user={user} onBack={() => router.back()} />;
}
