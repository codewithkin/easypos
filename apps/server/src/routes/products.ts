import { Hono } from "hono";
import db from "@easypos/db";
import {
  createProductRequestSchema,
  updateProductRequestSchema,
  paginationQuerySchema,
} from "@easypos/types";
import { getPaginationMeta, getPaginationSkip } from "@easypos/utils";
import { zBody, zQuery } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { checkProductLimit, recordProductOverage } from "../lib/plan-limits.js";

const products = new Hono<Env>()
  .use(authMiddleware)

  // ── List products (paginated) ─────────────────────────────────
  .get("/", zQuery(paginationQuerySchema), async (c) => {
    const orgId = c.get("orgId");
    const { page, pageSize, search, active } = c.req.valid("query");

    const where: any = { orgId };
    if (active !== undefined) {
      where.isActive = active;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        skip: getPaginationSkip(page, pageSize),
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      db.product.count({ where }),
    ]);

    return c.json({ items, ...getPaginationMeta(total, page, pageSize) });
  })

  // ── Get product by ID ─────────────────────────────────────────
  .get("/:id", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const product = await db.product.findFirst({
      where: { id, orgId },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!product) return c.json({ error: "Product not found" }, 404);
    return c.json(product);
  })

  // ── Create product ────────────────────────────────────────────
  .post("/", requireRole("ADMIN", "MANAGER"), zBody(createProductRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const data = c.req.valid("json");

    // ── Plan enforcement: product limit ───────────────────────────
    const productCheck = await checkProductLimit(orgId);
    if (!productCheck.allowed) {
      return c.json({ error: productCheck.reason }, 403);
    }

    const existingSku = await db.product.findFirst({
      where: { sku: data.sku, orgId },
    });
    if (existingSku) return c.json({ error: "SKU already exists" }, 409);

    const product = await db.product.create({
      data: { ...data, orgId },
      include: { category: { select: { id: true, name: true } } },
    });

    // Track product overage if applicable
    if (productCheck.overage) await recordProductOverage(orgId);

    return c.json(product, 201);
  })

  // ── Update product ────────────────────────────────────────────
  .put("/:id", requireRole("ADMIN", "MANAGER"), zBody(updateProductRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const existing = await db.product.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "Product not found" }, 404);

    if (data.sku && data.sku !== existing.sku) {
      const skuTaken = await db.product.findFirst({ where: { sku: data.sku, orgId } });
      if (skuTaken) return c.json({ error: "SKU already exists" }, 409);
    }

    const product = await db.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } } },
    });

    return c.json(product);
  })

  // ── Delete product ────────────────────────────────────────────
  .delete("/:id", requireRole("ADMIN"), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const existing = await db.product.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "Product not found" }, 404);

    await db.product.update({ where: { id }, data: { isActive: false } });
    return c.json({ message: "Product deactivated" });
  });

export default products;
