import { sign, verify } from "hono/jwt";
import { env } from "@easypos/env/server";
import type { Role } from "@easypos/types";

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

export interface AccessTokenPayload {
  userId: string;
  orgId: string;
  role: Role;
  branchId: string | null;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return sign(
    {
      ...payload,
      type: "access",
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY,
    },
    env.JWT_SECRET,
  );
}

export async function signRefreshToken(userId: string): Promise<string> {
  return sign(
    {
      userId,
      type: "refresh",
      exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY,
    },
    env.JWT_REFRESH_SECRET,
  );
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const payload = await verify(token, env.JWT_SECRET);
  return {
    userId: payload.userId as string,
    orgId: payload.orgId as string,
    role: payload.role as Role,
    branchId: (payload.branchId as string) ?? null,
  };
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string }> {
  const payload = await verify(token, env.JWT_REFRESH_SECRET);
  return { userId: payload.userId as string };
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);
}
