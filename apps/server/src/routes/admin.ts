import { Hono } from "hono";
import db from "@easypos/db";
import { PLAN_LIMITS, type Plan } from "@easypos/types";
import { z } from "zod";
import { createSlug } from "../lib/slug.js";

const router = new Hono();

const ADMIN_PASSWORD = "exyro45610y2627291";

const manualSetupSchema = z.object({
  password: z.string().min(1, "Password is required"),
  storeName: z.string().min(1, "Store name is required"),
  plan: z.enum(["starter", "growth", "enterprise"], {
    errorMap: () => ({ message: "Plan must be one of: starter, growth, or enterprise" }),
  }),
});

/**
 * POST /api/admin/setup-plan
 * Manual plan setup endpoint (password protected).
 * Sets up an organization by store name with a specific plan, limits, and billing cycle.
 * 
 * Request body:
 * {
 *   "password": "exyro45610y2627291",
 *   "storeName": "My Store",
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
      return c.json({ 
        error: "Authentication failed",
        details: "Invalid password provided. Ensure the password is correct and case-sensitive.",
        field: "password"
      }, 401);
    }

    // Get the plan limits
    const planLimits = PLAN_LIMITS[parsed.plan];
    if (!planLimits) {
      return c.json({ 
        error: "Invalid plan specified",
        details: `Plan "${parsed.plan}" is not supported. Valid options are: starter, growth, enterprise`,
        field: "plan",
        validPlans: ["starter", "growth", "enterprise"]
      }, 400);
    }

    // Find the organization by store name (via branch slug)
    const storeSlug = createSlug(parsed.storeName);
    const branch = await db.branch.findFirst({
      where: { slug: storeSlug },
      include: { org: true },
    });

    if (!branch) {
      return c.json({
        error: "Store not found",
        details: `No store with name "${parsed.storeName}" exists. Store names are converted to slugs (e.g., 'My Store' → 'my-store'). Please verify the exact store name in your system.`,
        field: "storeName",
        convertedSlug: storeSlug
      }, 404);
    }

    const org = branch.org;

    // Calculate next billing date (30 days from now)
    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    // Update the organization
    const updated = await db.organization.update({
      where: { id: org.id },
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
        message: `Store "${parsed.storeName}" (${org.name}) has been set up with the ${parsed.plan} plan`,
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
      const fieldErrors = error.errors.reduce((acc, err) => {
        const path = err.path.join(".");
        acc[path] = err.message;
        return acc;
      }, {} as Record<string, string>);
      return c.json({ 
        error: "Request validation failed",
        details: "One or more required fields are missing or invalid",
        fields: fieldErrors
      }, 400);
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return c.json({ 
        error: "Store lookup failed",
        details: "The store could not be found in the database. Verify the store name is correct.",
        message: error.message
      }, 404);
    }
    console.error("[Admin Setup Plan Error]", error);
    return c.json({ 
      error: "Endpoint error",
      details: "An unexpected error occurred while processing the request. Check server logs for details.",
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default router;
