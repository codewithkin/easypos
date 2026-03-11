import { createMiddleware } from "hono/factory";
import db from "@easypos/db";
import { verifyAccessToken } from "../lib/jwt.js";
import type { Env } from "../lib/context.js";

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const header = c.req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = header.slice(7);

  try {
    const payload = await verifyAccessToken(token);
    c.set("userId", payload.userId);
    c.set("orgId", payload.orgId);
    c.set("role", payload.role);
    c.set("branchId", payload.branchId);

    // ── Trial enforcement ──────────────────────────────────────
    // Check if the org is on plan "none" (trial or unpaid).
    // If the trial has expired, block access with 402.
    // Billing routes are excluded so users can still pay.
    const path = c.req.path;
    const isBillingRoute = path.startsWith("/api/billing");
    const isAuthRoute = path.startsWith("/api/auth");

    if (!isBillingRoute && !isAuthRoute) {
      const org = await db.organization.findUnique({
        where: { id: payload.orgId },
        select: { plan: true, trialEndsAt: true },
      });

      if (org && org.plan === "none") {
        const now = new Date();
        if (!org.trialEndsAt || org.trialEndsAt < now) {
          return c.json(
            {
              error: "trial_expired",
              message: "Your free trial has ended. Please subscribe to a plan to continue using EasyPOS.",
            },
            402,
          );
        }
      }
    }

    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
