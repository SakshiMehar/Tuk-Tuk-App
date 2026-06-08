/** Native Facebook SDK — dev/production builds only (not Expo Go). */
import { LoginManager, AccessToken, Settings } from "react-native-fbsdk-next";
import auth from "@react-native-firebase/auth";
import { FACEBOOK_APP_ID } from "../config/auth";
import { facebookFirebaseLogin } from "../api/authApi";
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


  let result;
  try {
    result = await LoginManager.logInWithPermissions([
      "public_profile",
      "email",
    ]);
  } catch (err) {
    if (
      err?.message?.toLowerCase().includes("app not active") ||
      err?.message?.toLowerCase().includes("not accessible")
    ) {
      throw new Error(
        "Facebook app is in Development mode. Add your account as a Tester in the Facebook Developer Console (App ID: 999372849281178 → Roles → Testers)."
      );
    }
    throw err;
  }

  if (result.isCancelled) {
    throw new Error("Facebook sign-in was cancelled.");
  }

  const tokenData = await AccessToken.getCurrentAccessToken();
  const accessToken = tokenData?.accessToken?.toString();

  if (!accessToken) {
    throw new Error("Facebook sign-in did not return an access token.");
  }

  const facebookCredential = auth.FacebookAuthProvider.credential(accessToken);
  const userCredential = await auth().signInWithCredential(facebookCredential);

  const idToken = await userCredential.user.getIdToken();
  const { displayName, email, uid } = userCredential.user;


  if (!idToken) throw new Error("Firebase did not return a token.");

  return establishSessionFromApi(
    (credential) => facebookFirebaseLogin(credential.idToken, credential.name),
    { idToken, name: displayName }
  );
};
