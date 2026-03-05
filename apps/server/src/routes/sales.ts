import { Hono } from "hono";
import db from "@easypos/db";
import {
  createSaleRequestSchema,
  voidSaleRequestSchema,
  paginationQuerySchema,
} from "@easypos/types";
import {
  generateReceiptNumber,
  getPaginationMeta,
  getPaginationSkip,
  getStartOfDay,
  getEndOfDay,
} from "@easypos/utils";
import { zBody, zQuery } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { checkInvoiceLimit, incrementInvoiceCount } from "../lib/plan-limits.js";

const sales = new Hono<Env>()
  .use(authMiddleware)

  // ── Create sale ───────────────────────────────────────────────
  .post("/", zBody(createSaleRequestSchema), async (c) => {
    const userId = c.get("userId");
    const orgId = c.get("orgId");
    const branchId = c.get("branchId");
    const { items, paymentMethod, tax, discount, amountTendered, note, deviceId, customerId } = c.req.valid("json");

    if (!branchId) {
      return c.json({ error: "You must be assigned to a branch to create sales" }, 400);
    }

    // ── Plan enforcement: invoice limit ───────────────────────────
    const invoiceCheck = await checkInvoiceLimit(orgId);
    if (!invoiceCheck.allowed) {
      return c.json({ error: invoiceCheck.reason }, 403);
    }

    // Look up product prices
    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, orgId, isActive: true },
    });

    if (products.length !== productIds.length) {
      return c.json({ error: "One or more products not found or inactive" }, 400);
    }

    const productMap = new Map(products.map((p: typeof products[0]) => [p.id, p]));

    const saleItems = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const subtotal = product.price * item.quantity;
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        total: subtotal,
      };
    });

    const subtotal = saleItems.reduce((sum: number, item: typeof saleItems[0]) => sum + item.total, 0);
    const discountAmount = discount ?? 0;
    const taxAmount = tax ?? 0;
    const total = subtotal - discountAmount + taxAmount;
    const change =
      amountTendered != null && amountTendered >= total ? amountTendered - total : null;
    const receiptNumber = generateReceiptNumber();

    const sale = await db.sale.create({
      data: {
        receiptNumber,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        amountTendered: amountTendered ?? null,
        change,
        paymentMethod,
        note,
        cashierId: userId,
        branchId,
        orgId,
        deviceId,
        customerId: customerId ?? null,
        items: { create: saleItems },
      },
      include: { items: true },
    });

    // Track invoice count for billing
    await incrementInvoiceCount(orgId, invoiceCheck.overage);

    return c.json(sale, 201);
  })

  // ── List sales (today by default, supports period filter) ───
  .get("/", zQuery(paginationQuerySchema), async (c) => {
    const orgId = c.get("orgId");
    const role = c.get("role");
    const branchId = c.get("branchId");
    const { page, pageSize } = c.req.valid("query");

    // Support period: today (default), 7d, 30d, all
    const period = c.req.query("period") ?? "today";
    const now = new Date();

    const where: any = { orgId };

    if (period === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      where.createdAt = { gte: start, lte: getEndOfDay(now) };
    } else if (period === "30d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      where.createdAt = { gte: start, lte: getEndOfDay(now) };
    } else if (period !== "all") {
      // Default: today
      const dateParam = c.req.query("date");
      const date = dateParam ? new Date(dateParam) : now;
      where.createdAt = { gte: getStartOfDay(date), lte: getEndOfDay(date) };
    }

    // Staff see only their own sales, managers see branch sales
    if (role === "STAFF") {
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
  .post("/:id/void", requireRole("ADMIN", "MANAGER"), zBody(voidSaleRequestSchema), async (c) => {
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
