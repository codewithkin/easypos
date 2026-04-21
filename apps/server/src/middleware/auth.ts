import { createMiddleware } from "hono/factory";
import db from "@easypos/db";
import { verifyAccessToken } from "../lib/jwt.js";
import type { Env } from "../lib/context.js";
import { getBillingLockState } from "../lib/billing-lock.js";

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

    // Keep billing/auth routes reachable so locked orgs can recover.
    const path = c.req.path;
    const isBillingRoute = path.startsWith("/api/billing");
    const isAuthRoute = path.startsWith("/api/auth");

    if (!isBillingRoute && !isAuthRoute) {
      const org = await db.organization.findUnique({
        where: { id: payload.orgId },
        select: { plan: true, trialEndsAt: true, nextBillingDate: true },
      });

      if (org) {
        const lockState = getBillingLockState(org);
        if (lockState.isLocked && lockState.reason) {
          return c.json(
            {
              error: lockState.reason,
              message: lockState.message,
              lock: lockState,
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
