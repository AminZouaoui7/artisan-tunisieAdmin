import axios, { AxiosHeaders } from "axios";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://artisanmedinabackend.onrender.com/api"
).replace(/\/+$/, "");

export const API_ORIGIN = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL.slice(0, -4)
  : new URL(API_BASE_URL).origin;

export function getAdminToken() {
  return localStorage.getItem("artisan_admin_token") || "";
}

export function buildApiUrl(path: string) {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http")) return path;

  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function buildBackendUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("artisan_admin_token");
      window.location.href = "/login";
    }

    const message =
      (typeof data === "object" &&
        data &&
        "message" in data &&
        typeof data.message === "string" &&
        data.message) ||
      (typeof data === "object" &&
        data &&
        "detail" in data &&
        typeof data.detail === "string" &&
        data.detail) ||
      (typeof data === "string" && data.trim()) ||
      "Une erreur est survenue.";

    throw new Error(message);
  }

  return data as T;
}

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
});

adminApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  const headers = AxiosHeaders.from(config.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;
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
