import API from "./axios";

// ── Guest Login ─────────────────────────────────────────────
export const guestLogin = async () => {
  console.log("=== GUEST LOGIN ===");
  console.log("URL:", "/api/auth/guest");
  try {
    const response = await API.post("/api/auth/guest");
    console.log("Guest API Response status:", response.status);
    console.log("Guest API Response data:", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log("Guest API Error status:", error.response?.status);
    console.log("Guest API Error data:", JSON.stringify(error.response?.data));
    console.log("Guest API Error message:", error.message);
    throw error;
  }
};


// ── Firebase Phone Auth (Replaces Twilio) ───────────────────
export const firebasePhoneAuth = async (idToken, phoneNumber, name) => {
  const body = { idToken, phoneNumber, ...(name ? { name } : {}) };
  console.log("=== FIREBASE PHONE AUTH ===");
  console.log("URL:", "/api/auth/firebase-phone");
  console.log("Body:", JSON.stringify({ ...body, idToken: idToken?.slice(0, 40) + "..." }));
  try {
    const response = await API.post("/api/auth/firebase-phone", body);
    console.log("Firebase Phone API Response status:", response.status);
    console.log("Firebase Phone API Response data:", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log("Firebase Phone API Error status:", error.response?.status);
    console.log("Firebase Phone API Error data:", JSON.stringify(error.response?.data));
    console.log("Firebase Phone API Error message:", error.message);
    throw error;
  }
};

// ── Email / Password Login ───────────────────────────────────
export const emailLogin = async (email, password) => {
  console.log("=== EMAIL LOGIN ===");
  console.log("URL:", "/api/auth/login");
  console.log("Body:", JSON.stringify({ email }));
  try {
    const response = await API.post("/api/auth/login", { email, password });
    console.log("Email API Response status:", response.status);
    console.log("Email API Response data:", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log("Email API Error status:", error.response?.status);
    console.log("Email API Error data:", JSON.stringify(error.response?.data));
    console.log("Email API Error message:", error.message);
    throw error;
  }
};

// ── Google Login ─────────────────────────────────────────────
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

// ── Facebook Mobile Login (Native SDK — accessToken path) ───
export const facebookLogin = async (accessToken) => {
  console.log("=== FACEBOOK LOGIN ===");
  console.log("URL:", "/api/auth/facebook-login");
  console.log("accessToken (first 40 chars):", accessToken?.toString().slice(0, 40));
  try {
    const response = await API.post("/api/auth/facebook-login", { accessToken });
    console.log("Facebook API Response status:", response.status);
    console.log("Facebook API Response data:", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log("Facebook API Error status:", error.response?.status);
    console.log("Facebook API Error data:", JSON.stringify(error.response?.data));
    console.log("Facebook API Error message:", error.message);
    throw error;
  }
};

// ── Facebook Firebase Login (Firebase idToken path) ─────────
// Facebook accessToken → Firebase credential → Firebase idToken → this endpoint
export const facebookFirebaseLogin = async (idToken, name) => {
  const body = { idToken, ...(name ? { name } : {}) };
  console.log("=== FACEBOOK FIREBASE LOGIN ===");
  console.log("URL:", "/api/auth/facebook-login");
  console.log("Body:", JSON.stringify({ ...body, idToken: idToken?.slice(0, 40) + "..." }));
  try {
    const response = await API.post("/api/auth/facebook-login", body);
    console.log("Facebook Firebase API Response status:", response.status);
    console.log("Facebook Firebase API Response data:", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log("Facebook Firebase API Error status:", error.response?.status);
    console.log("Facebook Firebase API Error data:", JSON.stringify(error.response?.data));
    console.log("Facebook Firebase API Error message:", error.message);
    throw error;
  }
};

// ── Apple Login (iOS) ────────────────────────────────────────
export const appleLogin = async (identityToken) => {
  console.log("=== APPLE LOGIN ===");
  console.log("URL:", "/api/auth/apple-login");
  console.log("identityToken (first 40 chars):", identityToken?.slice(0, 40));
  try {
    const response = await API.post("/api/auth/apple-login", { identityToken });
    console.log("Apple API Response status:", response.status);
    console.log("Apple API Response data:", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log("Apple API Error status:", error.response?.status);
    console.log("Apple API Error data:", JSON.stringify(error.response?.data));
    console.log("Apple API Error message:", error.message);
    throw error;
  }
};
