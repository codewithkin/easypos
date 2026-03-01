import { Hono } from "hono";
import db from "@easypos/db";
import { createUserRequestSchema, updateUserRequestSchema } from "@easypos/types";
import { hashPassword } from "../lib/password.js";
import { zBody } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const users = new Hono<Env>()
  .use(authMiddleware)

  // ── List users ─────────────────────────────────────────────────
  .get("/", async (c) => {
    const orgId = c.get("orgId");
    const role = c.get("role");
    const branchId = c.get("branchId");

    const where: any = { orgId };

    // Managers can only see users in their branch
    if (role === "MANAGER" && branchId) {
      where.branchId = branchId;
    }

    const items = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        orgId: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ items });
  })

  // ── Get user by ID ────────────────────────────────────────────
  .get("/:id", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const user = await db.user.findFirst({
      where: { id, orgId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        orgId: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
        branch: { select: { id: true, name: true } },
      },
    });

    if (!user) return c.json({ error: "User not found" }, 404);
    return c.json(user);
  })

  // ── Create user ───────────────────────────────────────────────
  .post("/", requireRole("OWNER", "MANAGER"), zBody(createUserRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const currentRole = c.get("role");
    const { email, password, name, role, branchId } = c.req.valid("json");

    // Managers can only create cashiers
    if (currentRole === "MANAGER" && role !== "CASHIER") {
      return c.json({ error: "Managers can only create cashier accounts" }, 403);
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return c.json({ error: "Email already in use" }, 409);

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: { email, passwordHash, name, role, orgId, branchId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        orgId: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return c.json(user, 201);
  })

  // ── Update user ───────────────────────────────────────────────
  .put("/:id", requireRole("OWNER", "MANAGER"), zBody(updateUserRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const existing = await db.user.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "User not found" }, 404);

    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        orgId: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return c.json(user);
  })

  // ── Delete user ───────────────────────────────────────────────
  .delete("/:id", requireRole("OWNER"), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const currentUserId = c.get("userId");

    if (id === currentUserId) {
      return c.json({ error: "Cannot delete your own account" }, 400);
    }

    const existing = await db.user.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "User not found" }, 404);

    await db.user.delete({ where: { id } });
    return c.json({ message: "User deleted" });
  });

export default users;
