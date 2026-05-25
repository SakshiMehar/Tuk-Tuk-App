import {
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebase";
import { firebasePhoneAuth } from "../api/authApi";
import { establishSessionFromApi } from "./authSessionService";

const assertRecaptcha = (recaptchaVerifier) => {
  if (!recaptchaVerifier) {
    throw new Error(
      "Phone verification is not ready. Wait a moment and try again."
    );
  }
};

/**
 * Step 1–2: Firebase SDK → send SMS OTP (reCAPTCHA required in Expo / RN).
 * @returns {Promise<string>} verificationId for confirm step
 */
export const sendPhoneOtp = async (phoneNumber, recaptchaVerifier) => {
  assertRecaptcha(recaptchaVerifier);
  const auth = getFirebaseAuth();
  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
};

/**
 * Step 3–5: Verify OTP → Firebase ID token → POST /api/auth/firebase-phone → JWT session.
 */
export const verifyPhoneOtpAndLogin = async (verificationId, smsCode) => {
  if (!verificationId) {
    throw new Error("Missing verification session. Request a new code.");
  }

  const auth = getFirebaseAuth();
  const credential = PhoneAuthProvider.credential(verificationId, smsCode);
  const userCredential = await signInWithCredential(auth, credential);
  const idToken = await userCredential.user.getIdToken(true);

  if (!idToken) {
    throw new Error("Firebase did not return an ID token.");
  }

  return establishSessionFromApi(firebasePhoneAuth, idToken);
};
