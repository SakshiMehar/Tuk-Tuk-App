import API from "./axios";

const logAuthResponse = (endpoint, data) => {
  console.log(`[authApi] ${endpoint}:`, JSON.stringify(data, null, 2));
};

export const guestLogin = async () => {
  const response = await API.post("/api/auth/guest");
  logAuthResponse("POST /api/auth/guest", response.data);
  return response.data;
};

export const firebasePhoneAuth = async (idToken, phoneNumber, name) => {
  const body = { idToken, phoneNumber, ...(name ? { name } : {}) };
  const response = await API.post("/api/auth/firebase-phone", body);
  logAuthResponse("POST /api/auth/firebase-phone", response.data);
  return response.data;
};

export const emailLogin = async (email, password) => {
  const response = await API.post("/api/auth/login", { email, password });
  logAuthResponse("POST /api/auth/login", response.data);
  return response.data;
};

export const googleLogin = async (idToken, name) => {
  const response = await API.post("/api/auth/google-login", { idToken, name });
  logAuthResponse("POST /api/auth/google-login", response.data);
  return response.data;
};

export const facebookLogin = async (accessToken) => {
  const response = await API.post("/api/auth/facebook-login", { accessToken });
  logAuthResponse("POST /api/auth/facebook-login", response.data);
  return response.data;
};

export const facebookFirebaseLogin = async (idToken, name) => {
  const body = { idToken, ...(name ? { name } : {}) };
  const response = await API.post("/api/auth/facebook-login", body);
  logAuthResponse("POST /api/auth/facebook-login (firebase)", response.data);
  return response.data;
};

export const appleLogin = async (identityToken) => {
  const response = await API.post("/api/auth/apple-login", { identityToken });
  logAuthResponse("POST /api/auth/apple-login", response.data);
  return response.data;
};
