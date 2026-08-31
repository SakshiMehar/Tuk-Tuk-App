import { useLocalSearchParams, useRouter } from "expo-router";
import UserProfileView from "../Components/UserProfileView";

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const user = {
    userId: params.userId ?? params.id ?? null,
    name: params.name ?? "User",
    // Avatar URLs passed as route params get URL-encoded — decode before use
    avatar: params.avatar ? decodeURIComponent(params.avatar) : null,
  };

  return <UserProfileView user={user} onBack={() => router.back()} />;
}
