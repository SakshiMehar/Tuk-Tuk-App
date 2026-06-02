/** Native Facebook SDK — dev/production builds only (not Expo Go). */
import { LoginManager, AccessToken, Settings } from "react-native-fbsdk-next";
import auth from "@react-native-firebase/auth";
import { FACEBOOK_APP_ID } from "../config/auth";
import { facebookFirebaseLogin } from "../api/authApi";
import { saveSession } from "../store/authStore";
import { normalizeAuthResponse } from "../utils/authResponse";

let sdkInitialized = false;

export const configureFacebookSdk = () => {
  if (sdkInitialized) return;
  Settings.setAppID(FACEBOOK_APP_ID);
  Settings.initializeSDK();
  sdkInitialized = true;
};

export const signInWithFacebook = async () => {
  configureFacebookSdk();

  console.log("=== FACEBOOK SIGN IN ===");
  console.log("Step 1: Requesting Facebook permissions...");

  let result;
  try {
    result = await LoginManager.logInWithPermissions([
      "public_profile",
      "email",
    ]);
  } catch (err) {
    console.log("Facebook LoginManager error:", err?.message);
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

  console.log("Step 2: Getting Facebook access token...");
  const tokenData = await AccessToken.getCurrentAccessToken();
  const accessToken = tokenData?.accessToken?.toString();

  if (!accessToken) {
    throw new Error("Facebook sign-in did not return an access token.");
  }
  console.log("Facebook accessToken (first 40 chars):", accessToken.slice(0, 40));

  console.log("Step 3: Signing into Firebase with Facebook credential...");
  const facebookCredential = auth.FacebookAuthProvider.credential(accessToken);
  const userCredential = await auth().signInWithCredential(facebookCredential);

  console.log("Step 4: Getting Firebase idToken...");
  const idToken = await userCredential.user.getIdToken();
  const { displayName, email, uid } = userCredential.user;

  console.log("Firebase UID:", uid);
  console.log("Firebase displayName:", displayName);
  console.log("Firebase email:", email);
  console.log("Firebase idToken (first 40 chars):", idToken?.slice(0, 40));

  if (!idToken) throw new Error("Firebase did not return a token.");

  console.log("Step 5: Calling backend /api/auth/facebook-login with Firebase idToken...");
  const data = await facebookFirebaseLogin(idToken, displayName);
  const { token, user } = normalizeAuthResponse(data);

  if (!token) throw new Error("Backend did not return a token.");

  await saveSession(token, user);
  console.log("Facebook Firebase login complete. Session saved.");
  return { token, user };
};
