import { Hono } from "hono";
import db from "@easypos/db";
import { createCategoryRequestSchema } from "@easypos/types";
import { zBody } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { checkCategoryLimit, recordCategoryOverage } from "../lib/plan-limits.js";

const categories = new Hono<Env>()
  .use(authMiddleware)

  // ── List categories ────────────────────────────────────────────
  .get("/", async (c) => {
    const orgId = c.get("orgId");

    const items = await db.category.findMany({
      where: { orgId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });

    return c.json({ items });
  })

  // ── Create category ───────────────────────────────────────────
  .post("/", requireRole("ADMIN", "MANAGER"), zBody(createCategoryRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const { name } = c.req.valid("json");

    // ── Plan enforcement: category limit ──────────────────────────
    const categoryCheck = await checkCategoryLimit(orgId);
    if (!categoryCheck.allowed) {
      return c.json({ error: categoryCheck.reason }, 403);
    }

    const category = await db.category.create({
      data: { name, orgId },
    });

    // Track category overage if applicable
    if (categoryCheck.overage) await recordCategoryOverage(orgId);

    return c.json(category, 201);
  })

  // ── Update category ───────────────────────────────────────────
  .put("/:id", requireRole("ADMIN", "MANAGER"), zBody(createCategoryRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const { name } = c.req.valid("json");

    const existing = await db.category.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "Category not found" }, 404);

    const category = await db.category.update({ where: { id }, data: { name } });
    return c.json(category);
  })

  // ── Delete category ───────────────────────────────────────────
  .delete("/:id", requireRole("ADMIN"), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const existing = await db.category.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "Category not found" }, 404);

    await db.category.delete({ where: { id } });
    return c.json({ message: "Category deleted" });
  });

export default categories;
