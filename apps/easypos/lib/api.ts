import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth-storage";
import { router } from "expo-router";

const BASE_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";

// ── Error class ────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Token refresh logic ────────────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${BASE_URL}/api/auth/refresh`,
      { refreshToken },
    );
    await setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

function ensureRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Axios instance for our API ─────────────────────────────────────

type RequestWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach auth token to every outgoing request
apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → auto-refresh + retry; convert AxiosError → ApiError
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; details?: unknown }>) => {
    const original = error.config as RequestWithRetry | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshed = await ensureRefresh();
      if (refreshed) {
        const newToken = await getAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      // Refresh failed → session expired, force sign-out
      await clearTokens();
      // Dynamically import auth store to avoid circular deps
      const { useAuthStore } = await import("@/store/auth");
      useAuthStore.setState({ user: null, isAuthenticated: false });
      try { router.replace("/(auth)/login"); } catch { /* navigation not ready */ }
      throw new ApiError(401, "Session expired. Please sign in again.");
    }

    const status = error.response?.status ?? 0;
    const message = error.response?.data?.error ?? error.message ?? "Request failed";
    const details = error.response?.data?.details;
    throw new ApiError(status, message, details);
  },
);

// ── apiFetch ───────────────────────────────────────────────────────

export async function apiFetch<T = unknown>(
  path: string,
  config?: Parameters<typeof apiClient.request>[0],
): Promise<T> {
  const { data } = await apiClient.request<T>({ url: path, ...config });
  return data;
}

// ── API convenience wrappers ───────────────────────────────────────

export const api = {
  get: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: "get" }),

  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "post", data: body }),

  put: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "put", data: body }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "patch", data: body }),

  delete: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: "delete" }),
};

// ── External HTTP client (presigned URLs etc., no auth interceptors) ──
export const http = axios.create();
