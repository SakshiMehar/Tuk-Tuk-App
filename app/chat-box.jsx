import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { BackHandler } from "react-native";
import ChatBox from "../Components/ChatBox";

export default function ChatBoxScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isOfficial = Boolean(
    params.officialSender === "true" ||
    params.officialSender === true ||
    params.name === "Tuk Tuk Team" ||
    String(params.userId ?? params.id ?? "") === "100005"
  );

  const user = {
    userId: params.userId ?? params.id ?? null,
    name: params.name ?? "User",
    // Avatar URLs passed as route params get URL-encoded — decode before use
    avatar: params.avatar ? decodeURIComponent(params.avatar) : null,
    lastMsg: params.lastMsg ?? "",
    level: params.level ? Number(params.level) : null,
    officialSender: isOfficial,
  };

  const isColdStart = params.isColdStart === "true";
  const handleBack = useCallback(() => {
    if (isOfficial) {
      // Direct go back to chatlist without popping into voice-party or triggering Leave Room
      router.replace("/(tabs)/chat");
      return;
    }
    if (isColdStart) {
      router.dismissAll();
      router.replace("/(tabs)/chat");
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/chat");
    }
  }, [isOfficial, isColdStart, router]);

  useEffect(() => {
    const onHardwareBack = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => sub.remove();
  }, [handleBack]);

  return <ChatBox user={user} onBack={handleBack} />;
}
