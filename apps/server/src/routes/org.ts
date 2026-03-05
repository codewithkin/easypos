import { Hono } from "hono";
import { z } from "zod";
import db from "@easypos/db";
import { zBody } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().min(1).max(10).optional(),
  receiptHeader: z.string().max(200).nullable().optional(),
  receiptFooter: z.string().max(200).nullable().optional(),
});

const org = new Hono<Env>()
  .use(authMiddleware)

  // ── Get current org ───────────────────────────────────────────
  .get("/", async (c) => {
    const orgId = c.get("orgId");

    const organization = await db.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
        logoUrl: true,
        receiptHeader: true,
        receiptFooter: true,
        plan: true,
        maxUsers: true,
        maxMonthlyInvoices: true,
        maxProducts: true,
        maxCategories: true,
        maxBranches: true,
        currentMonthInvoices: true,
        billingCycleStart: true,
        nextBillingDate: true,
        pendingOverageCharges: true,
      },
    });

    if (!organization) return c.json({ error: "Organization not found" }, 404);
    return c.json(organization);
  })

  // ── Update org settings (admin only) ─────────────────────────
  .put("/", requireRole("ADMIN"), zBody(updateOrgSchema), async (c) => {
    const orgId = c.get("orgId");
    const data = c.req.valid("json");

    const organization = await db.organization.update({
      where: { id: orgId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.receiptHeader !== undefined && { receiptHeader: data.receiptHeader }),
        ...(data.receiptFooter !== undefined && { receiptFooter: data.receiptFooter }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
        logoUrl: true,
        receiptHeader: true,
        receiptFooter: true,
        plan: true,
        maxUsers: true,
        maxMonthlyInvoices: true,
        maxProducts: true,
        maxCategories: true,
        maxBranches: true,
        currentMonthInvoices: true,
        billingCycleStart: true,
        nextBillingDate: true,
        pendingOverageCharges: true,
      },
    });

    return c.json(organization);
  });

export default org;
