import * as SecureStore from "expo-secure-store";
import type { AuthUser } from "@easypos/types";

const ACCESS_TOKEN_KEY = "easypos_access_token";
const REFRESH_TOKEN_KEY = "easypos_refresh_token";
const AUTH_USER_SNAPSHOT_KEY = "easypos_auth_user_snapshot";
const FIRST_ONLINE_SIGNIN_KEY = "easypos_first_online_signin";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function getCachedUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(AUTH_USER_SNAPSHOT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_USER_SNAPSHOT_KEY);
    return null;
  }
}

export async function setCachedUser(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(AUTH_USER_SNAPSHOT_KEY, JSON.stringify(user));
}

export async function clearCachedUser(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_USER_SNAPSHOT_KEY);
}

export async function hasCompletedFirstOnlineSignIn(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(FIRST_ONLINE_SIGNIN_KEY);
  return value === "1";
}

export async function markFirstOnlineSignInCompleted(): Promise<void> {
  await SecureStore.setItemAsync(FIRST_ONLINE_SIGNIN_KEY, "1");
}
