import API from "./axios";

// ── Guest Login ─────────────────────────────────────────────
export const guestLogin = async () => {
  try{
  const response = await API.post("/api/auth/guest");
  return response.data;
  }catch(error){
    console.log("Guest Login Error:",error.response?.data || error.message);
    throw error;
  }
};

// ── Email / Password Login ──────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// Returns: { token, user }
export const emailLogin = async (email, password) => {
  const response = await API.post("/api/auth/login", { email, password });
  return response.data;
};

// ── Email / Password Register ───────────────────────────────
// POST /api/auth/register
// Body: { name, email, password }
// Returns: { token, user }
export const emailRegister = async (name, email, password) => {
  const response = await API.post("/api/auth/register", { name, email, password });
  return response.data;
};

// ── Send OTP (Twilio) ───────────────────────────────────────
export const sendOtp = async (phone) => {
  try{
  const response = await API.post("/api/auth/send-otp", { phone });
  return response.data;}
  catch(error){
    console.log("Send Otp Error" || error.message);
    throw error;
  }
};

// ── Verify OTP (Twilio) ─────────────────────────────────────
export const verifyOtp = async (phone, otp) => {
  const response = await API.post("/api/auth/verify-otp", { phone, otp });
  return response.data;
};

// ── Firebase Phone Auth ─────────────────────────────────────
// POST /api/auth/firebase-phone  Body: { idToken }
export const firebasePhoneAuth = async (idToken) => {
  try {
    const response = await API.post("/api/auth/firebase-phone", { idToken });
    return response.data;
  } catch (error) {
    console.log("Firebase Phone Auth Error:", error.message);
    throw error;
  }
};

// ── Google Mobile Login ─────────────────────────────────────
// POST /api/auth/google-login  Body: { idToken }
export const googleLogin = async (idToken) => {
  try {
    const response = await API.post("/api/auth/google-login", { idToken });
    return response.data;
  } catch (error) {
    console.log("Google Login Error:", error.message);
    throw error;
  }
};

// ── Facebook Mobile Login ───────────────────────────────────
// POST /api/auth/facebook-login  Body: { accessToken }
export const facebookLogin = async (accessToken) => {
  try {
    const response = await API.post("/api/auth/facebook-login", { accessToken });
    return response.data;
  } catch (error) {
    console.log("Facebook Login Error:", error.message);
    throw error;
  }
};

// ── Apple Login (iOS) ───────────────────────────────────────
export const appleLogin = async (identityToken) => {
  const response = await API.post("/api/auth/apple-login", { identityToken });
  return response.data;
};
