import { Hono } from "hono";
import db from "@easypos/db";
import {
  createUserRequestSchema,
  updateUserRequestSchema,
  inviteUserRequestSchema,
} from "@easypos/types";
import { hashPassword } from "../lib/password.js";
import { zBody } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { sendInviteEmail } from "../lib/email.js";
import { env } from "@easypos/env/server";

const USER_SELECT = {
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
} as const;

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
      select: USER_SELECT,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return c.json({ items });
  })

  // ── Get user by ID ────────────────────────────────────────────
  .get("/:id", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const user = await db.user.findFirst({ where: { id, orgId }, select: USER_SELECT });
    if (!user) return c.json({ error: "User not found" }, 404);
    return c.json(user);
  })

  // ── Invite user (creates account + sends email) ────────────────
  .post(
    "/invite",
    requireRole("ADMIN", "MANAGER"),
    zBody(inviteUserRequestSchema),
    async (c) => {
      const orgId = c.get("orgId");
      const currentRole = c.get("role");
      const currentUserId = c.get("userId");
      const { email, name, role, branchId } = c.req.valid("json");

      // Managers can only invite staff
      if (currentRole === "MANAGER" && role !== "STAFF") {
        return c.json({ error: "Managers can only invite Staff members" }, 403);
      }

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) return c.json({ error: "Email already in use" }, 409);

      // Generate a secure temporary password
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
      const temporaryPassword = Array.from(
        { length: 12 },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join("");

      const passwordHash = await hashPassword(temporaryPassword);

      const [org, inviter] = await Promise.all([
        db.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
        db.user.findUnique({ where: { id: currentUserId }, select: { name: true } }),
      ]);

      const user = await db.user.create({
        data: {
          email,
          name,
          role,
          orgId,
          branchId: branchId ?? null,
          passwordHash,
          isActive: true,
        },
        select: USER_SELECT,
      });

      // Fire-and-forget: don't let email failure block user creation
      sendInviteEmail({
        to: email,
        name,
        orgName: org?.name ?? "Your Organization",
        inviterName: inviter?.name ?? "Your admin",
        role,
        temporaryPassword,
        appUrl: env.APP_URL,
      }).catch(() => {
        console.error("[email] Failed to send invite email to", email);
      });

      return c.json(user, 201);
    },
  )

  // ── Create user (with explicit password) ──────────────────────
  .post("/", requireRole("ADMIN", "MANAGER"), zBody(createUserRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const currentRole = c.get("role");
    const { email, password, name, role, branchId } = c.req.valid("json");

    // Managers can only create staff accounts
    if (currentRole === "MANAGER" && role !== "STAFF") {
      return c.json({ error: "Managers can only create staff accounts" }, 403);
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return c.json({ error: "Email already in use" }, 409);

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: { email, passwordHash, name, role, orgId, branchId },
      select: USER_SELECT,
    });

    return c.json(user, 201);
  })

  // ── Update user ───────────────────────────────────────────────
  .put("/:id", requireRole("ADMIN", "MANAGER"), zBody(updateUserRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const currentRole = c.get("role");
    const data = c.req.valid("json");

    const existing = await db.user.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "User not found" }, 404);

    // Managers cannot promote someone to Admin or Manager
    if (currentRole === "MANAGER" && data.role && data.role !== "STAFF") {
      return c.json({ error: "Managers can only assign Staff role" }, 403);
    }

    const user = await db.user.update({ where: { id }, data, select: USER_SELECT });
    return c.json(user);
  })

  // ── Delete user ───────────────────────────────────────────────
  .delete("/:id", requireRole("ADMIN"), async (c) => {
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
  .post("/", requireRole("ADMIN", "MANAGER"), zBody(createUserRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const currentRole = c.get("role");
    const { email, password, name, role, branchId } = c.req.valid("json");

    // Managers can only create staff accounts
    if (currentRole === "MANAGER" && role !== "STAFF") {
      return c.json({ error: "Managers can only create staff accounts" }, 403);
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
  .put("/:id", requireRole("ADMIN", "MANAGER"), zBody(updateUserRequestSchema), async (c) => {
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
  .delete("/:id", requireRole("ADMIN"), async (c) => {
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
