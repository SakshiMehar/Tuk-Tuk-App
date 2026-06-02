import {
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebase";
import { saveSession } from "../store/authStore";

const assertRecaptcha = (recaptchaVerifier) => {
  if (!recaptchaVerifier) {
    throw new Error(
      "Phone verification is not ready. Wait a moment and try again."
    );
  }
};

/**
 * Step 1: Send OTP via Firebase.
 * @returns {Promise<string>} verificationId
 */
export const sendPhoneOtp = async (phoneNumber, recaptchaVerifier) => {
  assertRecaptcha(recaptchaVerifier);
  const auth = getFirebaseAuth();
  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
};

/**
 * Step 2: Verify OTP → get Firebase ID token → save session directly.
 * No backend call — Firebase token is used as the session token.
 */
export const verifyPhoneOtpAndLogin = async (verificationId, smsCode) => {
  if (!verificationId) {
    throw new Error("Missing verification session. Request a new code.");
  }

  const auth = getFirebaseAuth();
  const credential = PhoneAuthProvider.credential(verificationId, smsCode);
  const userCredential = await signInWithCredential(auth, credential);

  const idToken = await userCredential.user.getIdToken(true);
  const { uid, phoneNumber } = userCredential.user;

  if (!idToken) {
    throw new Error("Firebase did not return an ID token.");
  }

  const user = {
    id:    uid,
    phone: phoneNumber,
    provider: "phone",
  };

  await saveSession(idToken, user);
  return { token: idToken, user };
};
