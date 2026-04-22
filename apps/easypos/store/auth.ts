import { create } from "zustand";
import type { AuthUser } from "@easypos/types";
import { api, ApiError } from "@/lib/api";
import {
  setTokens,
  clearTokens,
  getRefreshToken,
  getCachedUser,
  setCachedUser,
  clearCachedUser,
  hasCompletedFirstOnlineSignIn,
  markFirstOnlineSignInCompleted,
} from "@/lib/auth-storage";

type BillingLockReason = "trial_expired" | "payment_due";

function isNetworkError(error: unknown) {
  return error instanceof ApiError && error.status === 0;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
  hasCompletedOnlineSignIn: boolean;
  billingLockReason: BillingLockReason | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { orgName: string; email: string; password: string; name: string; logoUrl?: string; trialPlan?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  setOfflineMode: (isOfflineMode: boolean) => void;
  setBillingLockReason: (reason: BillingLockReason | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isOfflineMode: false,
  hasCompletedOnlineSignIn: false,
  billingLockReason: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const [refreshToken, cachedUser, hasOnlineSignIn] = await Promise.all([
        getRefreshToken(),
        getCachedUser(),
        hasCompletedFirstOnlineSignIn(),
      ]);

      if (!refreshToken) {
        set({
          user: null,
          isAuthenticated: false,
          isOfflineMode: false,
          hasCompletedOnlineSignIn: hasOnlineSignIn,
          billingLockReason: null,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      // Online refresh is the source of truth when reachable.
      const data = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
        "/auth/refresh",
        { refreshToken },
      );

      await setTokens(data.accessToken, data.refreshToken);
      await setCachedUser(data.user);
      await markFirstOnlineSignInCompleted();

      set({
        user: data.user,
        isAuthenticated: true,
        isOfflineMode: false,
        hasCompletedOnlineSignIn: true,
        billingLockReason: null,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      const [cachedUser, hasOnlineSignIn] = await Promise.all([
        getCachedUser(),
        hasCompletedFirstOnlineSignIn(),
      ]);

      if (isNetworkError(error) && cachedUser && hasOnlineSignIn) {
        set({
          user: cachedUser,
          isAuthenticated: true,
          isOfflineMode: true,
          hasCompletedOnlineSignIn: true,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      if (!isNetworkError(error)) {
        await Promise.all([clearTokens(), clearCachedUser()]);
      }

      set({
        user: null,
        isAuthenticated: false,
        isOfflineMode: false,
        hasCompletedOnlineSignIn: hasOnlineSignIn,
        billingLockReason: null,
        isInitialized: true,
        isLoading: false,
      });
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
      await setCachedUser(data.user);
      await markFirstOnlineSignInCompleted();
      set({
        user: data.user,
        isAuthenticated: true,
        isOfflineMode: false,
        hasCompletedOnlineSignIn: true,
        billingLockReason: null,
        isLoading: false,
      });
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
      await setCachedUser(result.user);
      await markFirstOnlineSignInCompleted();
      set({
        user: result.user,
        isAuthenticated: true,
        isOfflineMode: false,
        hasCompletedOnlineSignIn: true,
        billingLockReason: null,
        isLoading: false,
      });
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
    await Promise.all([clearTokens(), clearCachedUser()]);
    set({
      user: null,
      isAuthenticated: false,
      isOfflineMode: false,
      billingLockReason: null,
    });
  },

  setUser: (user) => {
    void setCachedUser(user);
    set({ user });
  },

  setOfflineMode: (isOfflineMode) => set({ isOfflineMode }),

  setBillingLockReason: (reason) => set({ billingLockReason: reason }),
}));
