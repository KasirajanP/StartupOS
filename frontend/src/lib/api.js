import axios from "axios";

import { API_BASE_URL } from "../config/env";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./storage";

const api = axios.create({
  baseURL: API_BASE_URL,
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
        refresh,
      });
    }

    try {
      const { data } = await refreshPromise;
      setTokens({ access: data.access, refresh: data.refresh ?? refresh });
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearTokens();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);

export default api;
