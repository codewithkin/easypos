import { createMiddleware } from "hono/factory";
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
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
