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

let _cachedToken = null;

AsyncStorage.getItem("@auth_token")

  .then((t) => { _cachedToken = t; })

  .catch(() => {});

export const refreshTokenCache = async () => {

  _cachedToken = await AsyncStorage.getItem("@auth_token");

};

export const getBearerToken = async () => {

  await refreshTokenCache();

  if (!_cachedToken) {

    _cachedToken = await AsyncStorage.getItem("@auth_token");

  }

  return _cachedToken;

};

/** Merge Authorization into axios/fetch config (RN-safe). */

export const authRequestConfig = async (config = {}) => {

  const token = await getBearerToken();

  const headers = { ...(config.headers || {}) };

  if (token) {

    headers.Authorization = `Bearer ${token}`;

  }

  return { ...config, headers };

};

export const clearTokenCache = () => { _cachedToken = null; };

API.interceptors.request.use(

  async (config) => {

    const isFormData =

      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isFormData) {

      config.headers.delete?.("Content-Type");

      config.headers.delete?.("content-type");

      delete config.headers["Content-Type"];

      delete config.headers["content-type"];

    }

    const token = await getBearerToken();

    _cachedToken = token;

    if (token) {

      const auth = `Bearer ${token}`;

      if (!config.headers) config.headers = {};

      if (typeof config.headers.set === "function") {

        try { config.headers.set("Authorization", auth); } catch (_) {}

      }

      config.headers.Authorization = auth;

    }

    return config;

  },

  (error) => Promise.reject(error)

);

API.interceptors.response.use(

  (response) => response,

  (error) => {

    const status = error?.response?.status;

    const requestUrl = `${error?.config?.baseURL ?? ""}${error?.config?.url ?? ""}`;

    console.error("[axios] request failed:", status, requestUrl, error?.response?.data);

    const responseData = error?.response?.data;
    const responseText =
      typeof responseData === "string" ? responseData : JSON.stringify(responseData ?? "");

    let message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Something went wrong";

    if (
      /ERR_NGROK_3200|endpoint.*is offline|ngrok-free\.dev is offline/i.test(responseText)
    ) {
      message =
        "Backend is offline. Start your server and ngrok tunnel, then update EXPO_PUBLIC_API_BASE_URL in .env if the ngrok URL changed.";
    }

    const err = new Error(message);

    err.status = status;

    err.responseData = error?.response?.data;

    err.requestUrl = requestUrl;

    return Promise.reject(err);

  }

);

export default API;

