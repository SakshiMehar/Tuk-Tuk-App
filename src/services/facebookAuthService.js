/**
 * Facebook login for Expo Go (expo-auth-session).
 * Native SDK is in facebookSdkNative.js (dev build only).
 */
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { FACEBOOK_APP_ID } from "../config/auth";
import { facebookLogin } from "../api/authApi";
import { establishSessionFromApi } from "./authSessionService";

WebBrowser.maybeCompleteAuthSession();

export const signInWithFacebook = async () => {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const request = new AuthSession.AuthRequest({
    clientId: FACEBOOK_APP_ID,
    redirectUri,
    scopes: ["public_profile", "email"],
    responseType: AuthSession.ResponseType.Token,
    extraParams: { display: "popup" },
  });

  const result = await request.promptAsync({
    authorizationEndpoint: "https://www.facebook.com/v19.0/dialog/oauth",
  });

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new Error("Facebook sign-in was cancelled.");
  }
  if (result.type !== "success") {
    throw new Error("Facebook sign-in failed.");
  }

  const accessToken = result.params?.access_token;
  if (!accessToken) {
    throw new Error("Facebook sign-in did not return an access token.");
  }

  return establishSessionFromApi(facebookLogin, accessToken);
};
