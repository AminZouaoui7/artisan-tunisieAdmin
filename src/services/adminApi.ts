import axios from "axios";

export const API_URL = "http://localhost:5163/api";

export const adminApi = axios.create({
  baseURL: API_URL,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("artisan_admin_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("artisan_admin_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);