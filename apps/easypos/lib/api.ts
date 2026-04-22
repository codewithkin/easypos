import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens, clearCachedUser } from "./auth-storage";
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

type RefreshResult = "success" | "invalid" | "offline";

let refreshPromise: Promise<RefreshResult> | null = null;

async function refreshAccessToken(): Promise<RefreshResult> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return "invalid";

  try {
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${BASE_URL}/api/auth/refresh`,
      { refreshToken },
    );
    await setTokens(data.accessToken, data.refreshToken);
    return "success";
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 400 || status === 401 || status === 403) {
        await Promise.all([clearTokens(), clearCachedUser()]);
        return "invalid";
      }
    }

    return "offline";
  }
}

function ensureRefresh(): Promise<RefreshResult> {
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

// Handle 401 → auto-refresh + retry; 402 → trial expired; convert AxiosError → ApiError
apiClient.interceptors.response.use(
  async (response) => {
    const { useAuthStore } = await import("@/store/auth");
    useAuthStore.getState().setOfflineMode(false);
    return response;
  },
  async (error: AxiosError<{ error?: string; details?: unknown }>) => {
    const original = error.config as RequestWithRetry | undefined;

    // ── 402 Billing lock (trial_expired or payment_due) ──
    if (error.response?.status === 402) {
      const reason = error.response.data?.error;
      const lockReason =
        reason === "trial_expired" || reason === "payment_due"
          ? reason
          : null;
      const fallbackMessage =
        lockReason === "payment_due"
          ? "Your subscription payment is due. Please complete payment to continue."
          : "Your free trial has ended. Please subscribe to continue.";
      const message =
        typeof (error.response.data as any)?.message === "string"
          ? (error.response.data as any).message
          : fallbackMessage;

      const { useAuthStore } = await import("@/store/auth");
      if (lockReason) {
        useAuthStore.getState().setBillingLockReason(lockReason);
        try {
          router.replace("/(app)/billing/plans" as any);
        } catch {
          // navigation not ready
        }
      }

      throw new ApiError(402, message, error.response.data?.details);
    }

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshed = await ensureRefresh();
      if (refreshed === "success") {
        const newToken = await getAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      if (refreshed === "offline") {
        const { useAuthStore } = await import("@/store/auth");
        useAuthStore.getState().setOfflineMode(true);
        throw new ApiError(0, "Network unavailable. Working in offline mode.");
      }

      // Refresh failed → session expired, force sign-out
      await Promise.all([clearTokens(), clearCachedUser()]);
      // Dynamically import auth store to avoid circular deps
      const { useAuthStore } = await import("@/store/auth");
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isOfflineMode: false,
        billingLockReason: null,
      });
      try { router.replace("/(auth)/login"); } catch { /* navigation not ready */ }
      throw new ApiError(401, "Session expired. Please sign in again.");
    }

    if (!error.response) {
      const { useAuthStore } = await import("@/store/auth");
      useAuthStore.getState().setOfflineMode(true);
      throw new ApiError(0, "Network unavailable. Check your connection.");
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
