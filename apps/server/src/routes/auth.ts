import { Hono } from "hono";
import db from "@easypos/db";
import {
  loginRequestSchema,
  registerRequestSchema,
  refreshTokenRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from "@easypos/types";
import { slugify } from "@easypos/utils";
import { signAccessToken, signRefreshToken, getRefreshTokenExpiry } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { zBody } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendPasswordResetEmail } from "../lib/email.js";
import { PLAN_LIMITS } from "@easypos/types";

function userToResponse(user: any, org: any, branch: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    orgId: user.orgId,
    branchId: user.branchId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      currency: org.currency,
      logoUrl: org.logoUrl ?? null,
      plan: org.plan,
      maxUsers: org.maxUsers,
      maxMonthlyInvoices: org.maxMonthlyInvoices,
      maxProducts: org.maxProducts,
      maxCategories: org.maxCategories,
      maxBranches: org.maxBranches,
      currentMonthInvoices: org.currentMonthInvoices,
      pendingOverageCharges: org.pendingOverageCharges,
      billingCycleStart: org.billingCycleStart,
      nextBillingDate: org.nextBillingDate,
    },
    branch: branch ? { id: branch.id, name: branch.name } : null,
  };
}

const auth = new Hono<Env>()

  // ── Register (create org + owner) ──────────────────────────────
  .post("/register", zBody(registerRequestSchema), async (c) => {
    const { orgName, email, password, name, logoUrl } = c.req.valid("json");

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: "Email already in use" }, 409);
    }

    const passwordHash = await hashPassword(password);
    const slug = slugify(orgName);

    const result = await db.$transaction(async (tx) => {
      const now = new Date();
      const nextBilling = new Date(now);
      nextBilling.setDate(nextBilling.getDate() + 30);

      const starterLimits = PLAN_LIMITS.starter;
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: `${slug}-${Date.now().toString(36)}`,
          logoUrl: logoUrl ?? null,
          plan: "starter",
          maxUsers: starterLimits.users,
          maxMonthlyInvoices: starterLimits.monthlyInvoices,
          maxProducts: starterLimits.products,
          maxCategories: starterLimits.categories,
          maxBranches: starterLimits.branches,
          billingCycleStart: now,
          nextBillingDate: nextBilling,
        },
      });

      const branch = await tx.branch.create({
        data: { name: "Main Branch", orgId: org.id },
      });

      const user = await tx.user.create({
        data: { email, passwordHash, name, role: "ADMIN", orgId: org.id, branchId: branch.id },
      });

      return { org, user, branch };
    }) as any;

    const accessToken = await signAccessToken({
      userId: result.user.id,
      orgId: result.org.id,
      role: result.user.role,
      branchId: result.branch.id,
    });

    const refreshToken = await signRefreshToken(result.user.id);
    await db.refreshToken.create({
      data: { token: refreshToken, userId: result.user.id, expiresAt: getRefreshTokenExpiry() },
    });

    return c.json(
      {
        accessToken,
        refreshToken,
        user: userToResponse(result.user, result.org, result.branch),
      },
      201,
    );
  })

  // ── Login ──────────────────────────────────────────────────────
  .post("/login", zBody(loginRequestSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    const user = await db.user.findUnique({
      where: { email },
      include: { org: true, branch: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    if (!user.isActive) {
      return c.json({ error: "Account is deactivated" }, 403);
    }

    const accessToken = await signAccessToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
      branchId: user.branchId,
    });

    const refreshToken = await signRefreshToken(user.id);
    await db.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: getRefreshTokenExpiry() },
    });

    return c.json({
      accessToken,
      refreshToken,
      user: userToResponse(user, user.org, user.branch),
    });
  })

  // ── Refresh Token ──────────────────────────────────────────────
  .post("/refresh", zBody(refreshTokenRequestSchema), async (c) => {
    const { refreshToken } = c.req.valid("json");

    const stored = await db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { org: true, branch: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await db.refreshToken.delete({ where: { id: stored.id } });
      return c.json({ error: "Invalid or expired refresh token" }, 401);
    }

    const { user } = stored;

    // Rotate refresh token
    await db.refreshToken.delete({ where: { id: stored.id } });

    const newAccessToken = await signAccessToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
      branchId: user.branchId,
    });

    const newRefreshToken = await signRefreshToken(user.id);
    await db.refreshToken.create({
      data: { token: newRefreshToken, userId: user.id, expiresAt: getRefreshTokenExpiry() },
    });

    return c.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: userToResponse(user, user.org, user.branch),
    });
  })

  // ── Logout ─────────────────────────────────────────────────────
  .post("/logout", authMiddleware, async (c) => {
    const userId = c.get("userId");
    await db.refreshToken.deleteMany({ where: { userId } });
    return c.json({ message: "Logged out successfully" });
  })

  // ── Forgot Password ────────────────────────────────────────────
  .post("/forgot-password", zBody(forgotPasswordRequestSchema), async (c) => {
    const { email } = c.req.valid("json");
    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      const code = Math.random().toString().slice(2, 8);
      await db.passwordReset.create({
        data: {
          code,
          userId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      await sendPasswordResetEmail({ to: user.email, name: user.name, code }).catch(() => {
        console.error("[email] Failed to send password reset email to", user.email);
      });
    }

    return c.json({ message: "If the email exists, a reset code has been sent" });
  })

  // ── Reset Password ─────────────────────────────────────────────
  .post("/reset-password", zBody(resetPasswordRequestSchema), async (c) => {
    const { email, code, newPassword } = c.req.valid("json");

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return c.json({ error: "Invalid reset request" }, 400);

    const reset = await db.passwordReset.findFirst({
      where: { userId: user.id, code, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!reset) return c.json({ error: "Invalid or expired reset code" }, 400);

    const passwordHash = await hashPassword(newPassword);

    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { passwordHash } }),
      db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      db.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return c.json({ message: "Password reset successfully" });
  })

  // ── Get Current User ───────────────────────────────────────────
  .get("/me", authMiddleware, async (c) => {
    const userId = c.get("userId");

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { org: true, branch: true },
    });

    if (!user) return c.json({ error: "User not found" }, 404);

    return c.json(userToResponse(user, user.org, user.branch));
  });

export default auth;
