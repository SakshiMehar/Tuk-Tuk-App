import API from "./axios";

export const guestLogin = async () => {
  const response = await API.post("/api/auth/guest");
  return response.data;
};

export const firebasePhoneAuth = async (idToken, phoneNumber, name) => {
  const body = { idToken, phoneNumber, ...(name ? { name } : {}) };
  const response = await API.post("/api/auth/firebase-phone", body);
  return response.data;
};

export const emailLogin = async (email, password) => {
  const response = await API.post("/api/auth/login", { email, password });
  return response.data;
};

export const googleLogin = async (idToken, name) => {
  const response = await API.post("/api/auth/google-login", { idToken, name });
  return response.data;
};

export const facebookLogin = async (accessToken) => {
  const response = await API.post("/api/auth/facebook-login", { accessToken });
  return response.data;
};

export const facebookFirebaseLogin = async (idToken, name) => {
  const body = { idToken, ...(name ? { name } : {}) };
  const response = await API.post("/api/auth/facebook-login", body);
  return response.data;
};

export const appleLogin = async (identityToken) => {
  const response = await API.post("/api/auth/apple-login", { identityToken });
  return response.data;
};
