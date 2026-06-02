import API from "./axios";

// ── Guest Login ─────────────────────────────────────────────
export const guestLogin = async () => {
  try {
    const response = await API.post("/api/auth/guest");
    return response.data;
  } catch (error) {
    console.log("Guest Login Error:", error.response?.data || error.message);
    throw error;
  }
};


// ── Firebase Phone Auth (Replaces Twilio) ───────────────────
// Backend endpoint: /api/auth/firebase-phone
export const firebasePhoneAuth = async (idToken, phoneNumber, name) => {
  try {
    const response = await API.post("/api/auth/firebase-phone", {
      idToken,
      phoneNumber,
      ...(name ? { name } : {}),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ── Email / Password Login ───────────────────────────────────
export const emailLogin = async (email, password) => {
  try {
    const response = await API.post("/api/auth/login", { email, password });
    return response.data;
  } catch (error) {
    console.log("Email Login Error:", error.response?.data || error.message);
    throw error;
  }
};

// ── Social Logins (Native Implementation) ───────────────────

export const googleLogin = async (idToken, name) => {
  const body = { idToken, name };
  console.log("=== GOOGLE LOGIN ===");
  console.log("URL:", "/api/auth/google-login");
  console.log("Body:", JSON.stringify(body));
  console.log("idToken (first 40 chars):", idToken?.slice(0, 40));
  try {
    const response = await API.post("/api/auth/google-login", body);
    console.log("Google API Response status:", response.status);
    console.log("Google API Response data:", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log("Google API Error status:", error.response?.status);
    console.log("Google API Error data:", JSON.stringify(error.response?.data));
    console.log("Google API Error message:", error.message);
    throw error;
  }
};

export const facebookLogin = async (accessToken) => {
  try {
    const response = await API.post("/api/auth/facebook-login", { accessToken });
    return response.data;
  } catch (error) {
    console.log("Facebook API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const appleLogin = async (identityToken) => {
  const response = await API.post("/api/auth/apple-login", { identityToken });
  return response.data;
};