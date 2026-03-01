import { createMiddleware } from "hono/factory";
import type { Role } from "@easypos/types";
import type { Env } from "../lib/context.js";

export function requireRole(...roles: Role[]) {
  return createMiddleware<Env>(async (c, next) => {
    const role = c.get("role");

    if (!roles.includes(role)) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    await next();
  });
}
