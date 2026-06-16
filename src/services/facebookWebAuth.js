/**
 * Facebook login via in-app WebView (Android) or AuthSession (iOS).
 * Android: avoids Chrome/Facebook app stripping redirect_uri from OAuth URL.
 */
import { Platform } from "react-native";
import { AuthRequest, ResponseType } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { FacebookAuthProvider, signInWithCredential } from "firebase/auth";
import { FACEBOOK_APP_ID, firebaseConfig } from "../config/auth";
import { firebaseFacebookAuth } from "../api/authApi";
import { establishSessionFromApi } from "./authSessionService";
import { getFirebaseAuth } from "../lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const FB_DISCOVERY = {
  authorizationEndpoint: "https://www.facebook.com/v19.0/dialog/oauth",
};

/** HTTPS redirect — Meta only accepts https:// URIs (not fb://). Same as Firebase Facebook provider. */
export const getFacebookRedirectUri = () => {
  const authDomain =
    firebaseConfig.authDomain || "tuk-tuk-application.firebaseapp.com";
  return `https://${authDomain}/__/auth/handler`;
};

const parseAccessToken = (url) => {
  const fragment = url.includes("#") ? url.split("#")[1] : url.split("?")[1];
  if (!fragment) return null;
  return new URLSearchParams(fragment).get("access_token");
};

const buildAuthRequest = () => {
  const redirectUri = getFacebookRedirectUri();
  const request = new AuthRequest({
    clientId: FACEBOOK_APP_ID,
    redirectUri,
    responseType: ResponseType.Token,
    usePKCE: false,
    scopes: ["public_profile"],
    extraParams: { display: "touch" },
  });
  return { request, redirectUri };
};

const exchangeTokenForSession = async (accessToken) => {
  const auth = getFirebaseAuth();
  const facebookCredential = FacebookAuthProvider.credential(accessToken);
  const userCredential = await signInWithCredential(auth, facebookCredential);

  const idToken = await userCredential.user.getIdToken();
  const { displayName, phoneNumber } = userCredential.user;

  if (!idToken) throw new Error("Firebase did not return a token.");

  console.log(
    "[facebookWebAuth] Firebase idToken:",
    `${idToken.slice(0, 12)}… (len=${idToken.length})`
  );
  console.log("[facebookWebAuth] Firebase user:", {
    displayName,
    phoneNumber: phoneNumber ?? null,
  });
  console.log("[facebookWebAuth] calling backend auth API…");

  return establishSessionFromApi(
    (credential) =>
      firebaseFacebookAuth(
        credential.idToken,
        credential.phoneNumber,
        credential.name
      ),
    { idToken, phoneNumber: phoneNumber ?? null, name: displayName }
  );
};

const promptWithWebView = ({ authUrl, redirectUri, openWebView }) =>
  new Promise((resolve, reject) => {
    openWebView({
      authUrl,
      redirectUri,
      onSuccess: (url) => {
        const accessToken = parseAccessToken(url);
        if (accessToken) {
          resolve(accessToken);
          return;
        }
        reject(new Error("Facebook sign-in did not return an access token."));
      },
      onCancel: () => reject(new Error("Facebook sign-in was cancelled.")),
    });
  });

export const signInWithFacebookWeb = async (options = {}) => {
  if (!FACEBOOK_APP_ID) {
    throw new Error("Facebook App ID is not configured.");
  }

  const { request, redirectUri } = buildAuthRequest();
  const authUrl = await request.makeAuthUrlAsync(FB_DISCOVERY);

  console.log("[facebookWebAuth] redirectUri:", redirectUri);
  console.log("[facebookWebAuth] authUrl:", authUrl);

  if (!authUrl.includes("redirect_uri=")) {
    throw new Error("Facebook auth URL is missing redirect_uri.");
  }

  let accessToken;

  if (Platform.OS === "android" && options.openWebView) {
    accessToken = await promptWithWebView({
      authUrl,
      redirectUri,
      openWebView: options.openWebView,
    });
  } else {
    const result = await request.promptAsync(FB_DISCOVERY, {
      showInRecents: false,
    });

    if (result.type === "cancel" || result.type === "dismiss") {
      throw new Error("Facebook sign-in was cancelled.");
    }
    if (result.type !== "success") {
      throw new Error("Facebook sign-in failed.");
    }

    accessToken =
      result.authentication?.accessToken ??
      result.params?.access_token ??
      parseAccessToken(result.url ?? "");
  }

  if (!accessToken) {
    throw new Error("Facebook sign-in did not return an access token.");
  }

  return exchangeTokenForSession(accessToken);
};
