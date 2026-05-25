import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "807444567658-l9gq0ophos92739p6o9vjms7kmq0407o.apps.googleusercontent.com",

    androidClientId:
      "807444567658-1doo16uhnb3pl3b7mr0dspmogvt1dmi9.apps.googleusercontent.com",

    webClientId:
      "807444567658-l9gq0ophos92739p6o9vjms7kmq0407o.apps.googleusercontent.com",

    scopes: ["openid", "profile", "email"],

    responseType: "id_token",

    selectAccount: true,
  });

  return {
    request,
    response,
    promptAsync,
  };
}

export const getGoogleIdToken = (authResponse) => {
  if (!authResponse || authResponse.type !== "success") {
    return null;
  }

  return (
    authResponse.authentication?.idToken ??
    authResponse.params?.id_token ??
    null
  );
};

export const getGoogleAuthErrorMessage = (authResponse) => {
  if (!authResponse) return null;

  if (
    authResponse.type === "cancel" ||
    authResponse.type === "dismiss"
  ) {
    return "cancelled";
  }

  if (authResponse.type === "error") {
    return authResponse.error?.message ?? "Google sign-in failed.";
  }

  return null;
};