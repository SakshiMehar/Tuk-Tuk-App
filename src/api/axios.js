import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  baseURL: "https://neatly-twisted-agile.ngrok-free.dev",
  headers: {
    "Content-Type": "application/json",
    // ngrok requires this header to skip the browser warning page
    "ngrok-skip-browser-warning": "true",
  },
  timeout: 15000,
});

// ── Request interceptor: attach JWT if present ──────────────
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("@auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: surface error messages cleanly ────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default API;
