import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_TIMEOUT_MS, isNgrokBaseUrl } from "../config/env";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(isNgrokBaseUrl() ? { "ngrok-skip-browser-warning": "true" } : {}),
  },
  timeout: API_TIMEOUT_MS,
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
