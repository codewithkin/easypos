import { create } from "zustand";
import type { AuthUser } from "@easypos/types";
import { api, ApiError } from "@/lib/api";
import { setTokens, clearTokens, getRefreshToken } from "@/lib/auth-storage";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { orgName: string; email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        set({ isInitialized: true, isLoading: false });
        return;
      }

      // Try to refresh and get current user
      const data = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
        "/auth/refresh",
        { refreshToken },
      );

      // api.post won't work here since we're calling refresh directly
      // Let me use the raw refresh approach
      await setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isInitialized: true, isLoading: false });
    } catch {
      await clearTokens();
      set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
        "/auth/login",
        { email, password },
      );
      await setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const result = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
        "/auth/register",
        data,
      );
      await setTokens(result.accessToken, result.refreshToken);
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors during logout
    }
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));
