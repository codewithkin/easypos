import { Hono } from "hono";
import db from "@easypos/db";
import { createSaleRequestSchema, voidSaleRequestSchema, paginationQuerySchema } from "@easypos/types";
import { generateReceiptNumber, getPaginationMeta, getPaginationSkip, getStartOfDay, getEndOfDay } from "@easypos/utils";
import { zBody, zQuery } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const sales = new Hono<Env>()
  .use(authMiddleware)

  // ── Create sale ───────────────────────────────────────────────
  .post("/", zBody(createSaleRequestSchema), async (c) => {
    const userId = c.get("userId");
    const orgId = c.get("orgId");
    const branchId = c.get("branchId");
    const { items, paymentMethod, tax, note, deviceId } = c.req.valid("json");

    if (!branchId) {
      return c.json({ error: "You must be assigned to a branch to create sales" }, 400);
    }

    // Look up product prices
    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, orgId, isActive: true },
    });

    if (products.length !== productIds.length) {
      return c.json({ error: "One or more products not found or inactive" }, 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const saleItems = items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        total: product.price * item.quantity,
      };
    });

    const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = tax ?? 0;
    const total = subtotal + taxAmount;
    const receiptNumber = generateReceiptNumber();

    const sale = await db.sale.create({
      data: {
        receiptNumber,
        subtotal,
        tax: taxAmount,
        total,
        paymentMethod,
        note,
        cashierId: userId,
        branchId,
        orgId,
        deviceId,
        items: { create: saleItems },
      },
      include: { items: true },
    });

    return c.json(sale, 201);
  })

  // ── List sales (today by default) ─────────────────────────────
  .get("/", zQuery(paginationQuerySchema), async (c) => {
    const orgId = c.get("orgId");
    const role = c.get("role");
    const branchId = c.get("branchId");
    const { page, pageSize } = c.req.valid("query");

    const dateParam = c.req.query("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const where: any = {
      orgId,
      createdAt: { gte: getStartOfDay(date), lte: getEndOfDay(date) },
    };

    // Cashiers see only their own sales, managers see branch sales
    if (role === "CASHIER") {
      where.cashierId = c.get("userId");
    } else if (role === "MANAGER" && branchId) {
      where.branchId = branchId;
    }

    const [items, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          items: true,
          cashier: { select: { id: true, name: true } },
        },
        skip: getPaginationSkip(page, pageSize),
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.sale.count({ where }),
    ]);

    return c.json({ items, ...getPaginationMeta(total, page, pageSize) });
  })

  // ── Get sale by ID ────────────────────────────────────────────
  .get("/:id", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const sale = await db.sale.findFirst({
      where: { id, orgId },
      include: {
        items: true,
        cashier: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        receipts: true,
      },
    });

    if (!sale) return c.json({ error: "Sale not found" }, 404);
    return c.json(sale);
  })

  // ── Void sale ─────────────────────────────────────────────────
  .post("/:id/void", requireRole("OWNER", "MANAGER"), zBody(voidSaleRequestSchema), async (c) => {
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const { reason } = c.req.valid("json");

    const sale = await db.sale.findFirst({ where: { id, orgId } });
    if (!sale) return c.json({ error: "Sale not found" }, 404);
    if (sale.status !== "COMPLETED") {
      return c.json({ error: "Only completed sales can be voided" }, 400);
    }

    const [updated] = await db.$transaction([
      db.sale.update({ where: { id }, data: { status: "VOIDED" } }),
      db.auditLog.create({
        data: {
          action: "VOID_SALE",
          details: reason,
          metadata: { saleId: id, receiptNumber: sale.receiptNumber, total: sale.total },
          userId,
          orgId,
        },
      }),
    ]);

    return c.json(updated);
  })

  // ── Record receipt print event ────────────────────────────────
  .post("/:id/print", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const sale = await db.sale.findFirst({ where: { id, orgId } });
    if (!sale) return c.json({ error: "Sale not found" }, 404);

    const body = await c.req.json().catch(() => ({}));

    const receipt = await db.receipt.create({
      data: { saleId: id, printerName: body?.printerName },
    });

    return c.json(receipt, 201);
  });

export default sales;
