import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

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
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await clearTokens();
      return false;
    }

    const data = await res.json();
    await setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

// Deduplicate concurrent refresh calls
function ensureRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Main apiFetch function ─────────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiFetch<T = unknown>(path: string, options?: FetchOptions): Promise<T> {
  const token = await getAccessToken();

  const url = `${API_URL}/api${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...options,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  };

  let response = await fetch(url, config);

  // Auto-refresh on 401
  if (response.status === 401 && token) {
    const refreshed = await ensureRefresh();
    if (refreshed) {
      const newToken = await getAccessToken();
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, { ...config, headers });
    }
  }

  if (!response.ok) {
    let errorBody: any = {};
    try {
      errorBody = await response.json();
    } catch {}
    throw new ApiError(response.status, errorBody.error ?? "Request failed", errorBody.details);
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ── Convenience wrappers ───────────────────────────────────────────

export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path, { method: "GET" }),

  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body }),

  put: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body }),

  delete: <T = unknown>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
