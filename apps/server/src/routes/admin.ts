import { Hono } from "hono";
import db from "@easypos/db";
import { PLAN_LIMITS, type Plan } from "@easypos/types";
import { z } from "zod";

const router = new Hono();

const ADMIN_PASSWORD = "exyro45610y2627291";

const manualSetupSchema = z.object({
  password: z.string().min(1, "Password is required"),
  orgId: z.string().min(1, "Organization ID is required"),
  plan: z.enum(["starter", "growth", "enterprise"], {
    errorMap: () => ({ message: "Plan must be one of: starter, growth, or enterprise" }),
  }),
});

/**
 * POST /api/admin/setup-plan
 * Manual plan setup endpoint (password protected).
 * Sets up an organization with a specific plan, limits, and billing cycle.
 * 
 * Request body:
 * {
 *   "password": "exyro45610y2627291",
 *   "orgId": "org_xxxxx",
 *   "plan": "growth"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "org": { ... organization data ... }
 * }
 */
router.post("/setup-plan", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = manualSetupSchema.parse(body);

    // Verify password
    if (parsed.password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }

    // Get the plan limits
    const planLimits = PLAN_LIMITS[parsed.plan];
    if (!planLimits) {
      return c.json({ error: `Invalid plan: ${parsed.plan}` }, 400);
    }

    // Calculate next billing date (30 days from now)
    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    // Update the organization
    const updated = await db.organization.update({
      where: { id: parsed.orgId },
      data: {
        plan: parsed.plan as Plan,
        maxUsers: planLimits.users,
        maxMonthlyInvoices: planLimits.monthlyInvoices,
        maxProducts: planLimits.products,
        maxCategories: planLimits.categories,
        maxBranches: planLimits.branches,
        billingCycleStart: now,
        nextBillingDate,
        // Reset counters for the new billing cycle
        currentMonthInvoices: 0,
        currentMonthOverageInvoices: 0,
        currentMonthOverageProducts: 0,
        currentMonthOverageCategories: 0,
        pendingOverageCharges: 0,
      },
    });

    return c.json(
      {
        success: true,
        message: `Organization "${updated.name}" has been set up with the ${parsed.plan} plan`,
        org: {
          id: updated.id,
          name: updated.name,
          plan: updated.plan,
          maxUsers: updated.maxUsers,
          maxMonthlyInvoices: updated.maxMonthlyInvoices,
          maxProducts: updated.maxProducts,
          maxCategories: updated.maxCategories,
          maxBranches: updated.maxBranches,
          billingCycleStart: updated.billingCycleStart,
          nextBillingDate: updated.nextBillingDate,
        },
      },
      200,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return c.json({ error: "Organization not found" }, 404);
    }
    return c.json({ error: "An error occurred", message: error instanceof Error ? error.message : String(error) }, 500);
  }
});

export default router;
