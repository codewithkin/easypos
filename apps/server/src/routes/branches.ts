import { Hono } from "hono";
import db from "@easypos/db";
import { createBranchRequestSchema, updateBranchRequestSchema } from "@easypos/types";
import { zBody } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const branches = new Hono<Env>()
  .use(authMiddleware)

  // ── List branches ──────────────────────────────────────────────
  .get("/", async (c) => {
    const orgId = c.get("orgId");

    const items = await db.branch.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
    });

    return c.json({ items });
  })

  // ── Get branch by ID ──────────────────────────────────────────
  .get("/:id", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const branch = await db.branch.findFirst({
      where: { id, orgId },
      include: {
        _count: { select: { users: true, devices: true, sales: true } },
      },
    });

    if (!branch) return c.json({ error: "Branch not found" }, 404);
    return c.json(branch);
  })

  // ── Create branch ─────────────────────────────────────────────
  .post("/", requireRole("ADMIN"), zBody(createBranchRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const data = c.req.valid("json");

    const branch = await db.branch.create({
      data: { ...data, orgId },
    });

    return c.json(branch, 201);
  })

  // ── Update branch ─────────────────────────────────────────────
  .put("/:id", requireRole("ADMIN", "MANAGER"), zBody(updateBranchRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const existing = await db.branch.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "Branch not found" }, 404);

    const branch = await db.branch.update({ where: { id }, data });
    return c.json(branch);
  })

  // ── Delete branch ─────────────────────────────────────────────
  .delete("/:id", requireRole("ADMIN"), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const existing = await db.branch.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "Branch not found" }, 404);

    await db.branch.delete({ where: { id } });
    return c.json({ message: "Branch deleted" });
  });

export default branches;
