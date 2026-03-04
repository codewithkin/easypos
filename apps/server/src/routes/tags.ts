import { Hono } from "hono";
import db from "@easypos/db";
import { zBody } from "../lib/validate.js";
import { z } from "zod";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
});

const tags = new Hono<Env>()
  .use(authMiddleware)

  // ── List all tags for org ─────────────────────────────────────
  .get("/", async (c) => {
    const orgId = c.get("orgId");

    const items = await db.tag.findMany({
      where: { orgId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });

    return c.json({ items });
  })

  // ── Create tag ────────────────────────────────────────────────
  .post("/", requireRole("ADMIN", "MANAGER"), zBody(createTagSchema), async (c) => {
    const orgId = c.get("orgId");
    const { name } = c.req.valid("json");

    // Check for duplicate
    const existing = await db.tag.findUnique({
      where: { name_orgId: { name: name.trim(), orgId } },
    });
    if (existing) return c.json({ error: "Tag already exists" }, 409);

    const tag = await db.tag.create({
      data: { name: name.trim(), orgId },
      include: { _count: { select: { products: true } } },
    });

    return c.json(tag, 201);
  })

  // ── Delete tag ────────────────────────────────────────────────
  .delete("/:id", requireRole("ADMIN", "MANAGER"), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const existing = await db.tag.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "Tag not found" }, 404);

    await db.tag.delete({ where: { id } });
    return c.json({ success: true });
  });

export default tags;
