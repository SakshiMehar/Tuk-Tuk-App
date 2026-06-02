import auth from "@react-native-firebase/auth";
import { saveSession } from "../store/authStore";
import { firebasePhoneAuth } from "../api/authApi";
import { normalizeAuthResponse } from "../utils/authResponse";

// Stores the confirmation object between sendPhoneOtp and verifyPhoneOtpAndLogin
let pendingConfirmation = null;

/**
 * Step 1: Send OTP via native Firebase SDK.
 * Uses Play Integrity on Android — no reCAPTCHA needed.
 */
export const sendPhoneOtp = async (phoneNumber) => {
  pendingConfirmation = await auth().signInWithPhoneNumber(phoneNumber);
};

/**
 * Step 2: Verify OTP → exchange Firebase token for backend JWT → save session.
 * The stored JWT is automatically attached to all subsequent API calls via the
 * axios request interceptor (axios.js).
 */
export const verifyPhoneOtpAndLogin = async (smsCode, name) => {
  if (!pendingConfirmation) {
    throw new Error("No pending verification. Please request a new code.");
  }

  const userCredential = await pendingConfirmation.confirm(smsCode);
  const idToken = await userCredential.user.getIdToken();
  const { phoneNumber } = userCredential.user;

  if (!idToken) throw new Error("Firebase did not return a token.");

  const data = await firebasePhoneAuth(idToken, phoneNumber, name);
  const { token, user } = normalizeAuthResponse(data);

  if (!token) throw new Error("Backend did not return a token.");

  await saveSession(token, user);
  pendingConfirmation = null;
  return { token, user };
};
