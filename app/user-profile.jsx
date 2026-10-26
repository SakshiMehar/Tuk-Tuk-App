import { useLocalSearchParams, useRouter } from "expo-router";
import UserProfileView from "../Components/UserProfileView";

const safeDecodeUri = (val) => {
  if (!val || typeof val !== "string") return null;
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
};

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const user = {
    userId: params.userId ?? params.id ?? null,
    name: params.name ?? "User",
    // Avatar URLs passed as route params get URL-encoded — decode safely before use
    avatar: safeDecodeUri(params.avatar),
  };

  return <UserProfileView user={user} onBack={() => router.back()} />;
}
