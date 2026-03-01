import { Hono } from "hono";
import db from "@easypos/db";
import { getStartOfDay, getEndOfDay } from "@easypos/utils";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const reports = new Hono<Env>()
  .use(authMiddleware)
  .use(requireRole("ADMIN", "MANAGER"))

  // ── Daily summary ─────────────────────────────────────────────
  .get("/daily", async (c) => {
    const orgId = c.get("orgId");
    const role = c.get("role");
    const branchId = c.get("branchId");

    const dateParam = c.req.query("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const where: any = {
      orgId,
      status: "COMPLETED",
      createdAt: { gte: getStartOfDay(date), lte: getEndOfDay(date) },
    };

    if (role === "MANAGER" && branchId) {
      where.branchId = branchId;
    }

    const sales = await db.sale.findMany({
      where,
      include: { items: true },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalTransactions = sales.length;
    const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // By payment method
    const methodMap = new Map<string, { count: number; total: number }>();
    for (const sale of sales) {
      const entry = methodMap.get(sale.paymentMethod) ?? { count: 0, total: 0 };
      entry.count++;
      entry.total += sale.total;
      methodMap.set(sale.paymentMethod, entry);
    }

    const byPaymentMethod = Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      ...data,
    }));

    // Top products
    const productMap = new Map<string, { productName: string; quantity: number; revenue: number }>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const entry = productMap.get(item.productId) ?? {
          productName: item.productName,
          quantity: 0,
          revenue: 0,
        };
        entry.quantity += item.quantity;
        entry.revenue += item.total;
        productMap.set(item.productId, entry);
      }
    }

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return c.json({
      date: date.toISOString().slice(0, 10),
      totalRevenue,
      totalTransactions,
      averageTicket: Math.round(averageTicket),
      byPaymentMethod,
      topProducts,
    });
  })

  // ── Branch comparison ─────────────────────────────────────────
  .get("/branches", requireRole("OWNER"), async (c) => {
    const orgId = c.get("orgId");

    const dateParam = c.req.query("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const branches = await db.branch.findMany({
      where: { orgId },
      select: { id: true, name: true },
    });

    const results = await Promise.all(
      branches.map(async (branch) => {
        const sales = await db.sale.findMany({
          where: {
            branchId: branch.id,
            status: "COMPLETED",
            createdAt: { gte: getStartOfDay(date), lte: getEndOfDay(date) },
          },
        });

        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

        return {
          branchId: branch.id,
          branchName: branch.name,
          totalRevenue,
          totalTransactions: sales.length,
        };
      }),
    );

    return c.json({ date: date.toISOString().slice(0, 10), branches: results });
  })

  // ── Cashier performance ───────────────────────────────────────
  .get("/cashiers", async (c) => {
    const orgId = c.get("orgId");
    const role = c.get("role");
    const branchId = c.get("branchId");

    const dateParam = c.req.query("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const where: any = {
      orgId,
      status: "COMPLETED",
      createdAt: { gte: getStartOfDay(date), lte: getEndOfDay(date) },
    };

    if (role === "MANAGER" && branchId) {
      where.branchId = branchId;
    }

    const sales = await db.sale.findMany({
      where,
      include: { cashier: { select: { id: true, name: true } } },
    });

    const cashierMap = new Map<string, { name: string; transactions: number; revenue: number }>();
    for (const sale of sales) {
      const entry = cashierMap.get(sale.cashierId) ?? {
        name: sale.cashier.name,
        transactions: 0,
        revenue: 0,
      };
      entry.transactions++;
      entry.revenue += sale.total;
      cashierMap.set(sale.cashierId, entry);
    }

    const cashiers = Array.from(cashierMap.entries())
      .map(([cashierId, data]) => ({
        cashierId,
        ...data,
        averageTicket: data.transactions > 0 ? Math.round(data.revenue / data.transactions) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return c.json({ date: date.toISOString().slice(0, 10), cashiers });
  });

export default reports;
