/** Native Facebook SDK — dev/production builds only (not Expo Go). */
import {
  LoginManager,
  AccessToken,
  Settings,
} from "react-native-fbsdk-next";
import { FACEBOOK_APP_ID } from "../config/auth";
import { facebookLogin } from "../api/authApi";
import { establishSessionFromApi } from "./authSessionService";

let sdkInitialized = false;

export const configureFacebookSdk = () => {
  if (sdkInitialized) return;
  Settings.setAppID(FACEBOOK_APP_ID);
  Settings.initializeSDK();
  sdkInitialized = true;
};

export const signInWithFacebook = async () => {
  configureFacebookSdk();

  const result = await LoginManager.logInWithPermissions([
    "public_profile",
    "email",
  ]);

  if (result.isCancelled) {
    throw new Error("Facebook sign-in was cancelled.");
  }

  const tokenData = await AccessToken.getCurrentAccessToken();
  const accessToken = tokenData?.accessToken?.toString();

  if (!accessToken) {
    throw new Error("Facebook sign-in did not return an access token.");
  }

  return await establishSessionFromApi(facebookLogin, accessToken);
};
