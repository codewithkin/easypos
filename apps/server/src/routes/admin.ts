import { env } from "@easypos/env/server";
import { Hono } from "hono";
import db from "@easypos/db";
import { PLAN_LIMITS, type Plan } from "@easypos/types";
import { z } from "zod";
import { getBillingLockState } from "../lib/billing-lock.js";

const router = new Hono();

const ADMIN_PASSWORD = env.ADMIN_SETUP_PASSWORD;

const manualSetupSchema = z.object({
  password: z.string().min(1, "Password is required"),
  storeName: z.string().min(1, "Store name is required"),
  plan: z.enum(["starter", "growth", "enterprise"]),
});

const manualMonthlyPaidSchema = z.object({
  password: z.string().min(1, "Password is required"),
  storeName: z.string().min(1, "Store name is required"),
  source: z.string().trim().min(1).max(100).optional(),
});

async function findOrganizationByStoreName(storeName: string) {
  return db.organization.findFirst({
    where: {
      name: {
        equals: storeName,
        mode: "insensitive",
      },
    },
  });
}

function getNextBillingDate(now: Date) {
  const nextBillingDate = new Date(now);
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);
  return nextBillingDate;
}

function getBillingStatusPayload(org: {
  plan: Plan;
  trialEndsAt: Date | null;
  billingCycleStart: Date;
  nextBillingDate: Date;
}) {
  const lock = getBillingLockState({
    plan: org.plan,
    trialEndsAt: org.trialEndsAt,
    nextBillingDate: org.nextBillingDate,
  });

  return {
    plan: org.plan,
    billingCycleStart: org.billingCycleStart,
    nextBillingDate: org.nextBillingDate,
    lock,
  };
}

async function getAuditActorUserId(orgId: string) {
  const adminUser = await db.user.findFirst({
    where: { orgId, role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (adminUser) return adminUser.id;

  const fallbackUser = await db.user.findFirst({
    where: { orgId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return fallbackUser?.id ?? null;
}

async function writeAdminAuditLog(input: {
  orgId: string;
  action: string;
  details: string;
  metadata: Record<string, unknown>;
}) {
  try {
    const actorUserId = await getAuditActorUserId(input.orgId);
    if (!actorUserId) return;

    await db.auditLog.create({
      data: {
        action: input.action,
        details: input.details,
        metadata: input.metadata as any,
        userId: actorUserId,
        orgId: input.orgId,
      },
    });
  } catch (error) {
    console.error("[Admin Audit Error]", error);
  }
}

function getValidationFieldErrors(error: z.ZodError) {
  return error.issues.reduce((acc, issue) => {
    const path = issue.path.join(".");
    acc[path] = issue.message;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * POST /api/admin/setup-plan
 * Manual plan setup endpoint (password protected).
 * Sets up an organization by organization name (the name used during registration) with a specific plan, limits, and billing cycle.
 * 
 * Request body:
 * {
 *   "password": "exyro45610y2627291",
 *   "storeName": "My Organization",
 *   "plan": "growth"
 * }
 * 
 * Note: "storeName" should be the organization name from registration (e.g., "Christus"), not a branch name.
 * Organization names are converted to slugs (e.g., "Christus" → "christus-<timestamp>") for lookup.
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

    const org = await findOrganizationByStoreName(parsed.storeName);

    if (!org) {
      return c.json({
        error: "Organization not found",
        details: `No organization with name "${parsed.storeName}" exists. This should be the exact organization name from registration (not a branch name). Organizations names are case-insensitive. Please verify the organization name is correct.`,
        field: "storeName",
        hint: "The 'storeName' parameter should match the 'orgName' you provided during registration (e.g., 'Christus')."
      }, 404);
    }

    const now = new Date();
    const nextBillingDate = getNextBillingDate(now);

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

    await writeAdminAuditLog({
      orgId: org.id,
      action: "ADMIN_SETUP_PLAN",
      details: `Manual plan setup applied: ${parsed.plan}`,
      metadata: {
        source: "setup-plan-endpoint",
        storeName: parsed.storeName,
        plan: parsed.plan,
        serverNow: now.toISOString(),
        nextBillingDate: nextBillingDate.toISOString(),
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
        billingStatus: getBillingStatusPayload(updated),
      },
      200,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: "Request validation failed",
        details: "One or more required fields are missing or invalid",
        fields: getValidationFieldErrors(error)
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

router.post("/setup-monthly-paid", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = manualMonthlyPaidSchema.parse(body);

    if (parsed.password !== ADMIN_PASSWORD) {
      return c.json(
        {
          error: "Authentication failed",
          details: "Invalid password provided. Ensure the password is correct and case-sensitive.",
          field: "password",
        },
        401,
      );
    }

    const org = await findOrganizationByStoreName(parsed.storeName);

    if (!org) {
      return c.json(
        {
          error: "Organization not found",
          details: `No organization with name "${parsed.storeName}" exists. This should be the exact organization name from registration (not a branch name). Organizations names are case-insensitive. Please verify the organization name is correct.`,
          field: "storeName",
          hint: "The 'storeName' parameter should match the 'orgName' you provided during registration (e.g., 'Christus').",
        },
        404,
      );
    }

    if (org.plan === "none") {
      return c.json(
        {
          error: "Plan not active",
          details: "This organization is still on the trial/no-plan tier. Use /api/admin/setup-plan first to activate a paid plan.",
          field: "storeName",
        },
        400,
      );
    }

    const now = new Date();
    const nextBillingDate = getNextBillingDate(now);

    const updated = await db.organization.update({
      where: { id: org.id },
      data: {
        billingCycleStart: now,
        nextBillingDate,
        currentMonthInvoices: 0,
        currentMonthOverageInvoices: 0,
        currentMonthOverageProducts: 0,
        currentMonthOverageCategories: 0,
        pendingOverageCharges: 0,
      },
    });

    await writeAdminAuditLog({
      orgId: org.id,
      action: "ADMIN_MARK_MONTHLY_PAID",
      details: "Manual monthly payment marked as paid",
      metadata: {
        source: parsed.source ?? "manual-admin-override",
        storeName: parsed.storeName,
        plan: updated.plan,
        previousNextBillingDate: org.nextBillingDate.toISOString(),
        newNextBillingDate: updated.nextBillingDate.toISOString(),
        serverNow: now.toISOString(),
      },
    });

    return c.json(
      {
        success: true,
        message: `Monthly payment marked as paid for store "${parsed.storeName}"`,
        org: {
          id: updated.id,
          name: updated.name,
          plan: updated.plan,
          billingCycleStart: updated.billingCycleStart,
          nextBillingDate: updated.nextBillingDate,
          pendingOverageCharges: updated.pendingOverageCharges,
        },
        billingStatus: getBillingStatusPayload(updated),
      },
      200,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Request validation failed",
          details: "One or more required fields are missing or invalid",
          fields: getValidationFieldErrors(error),
        },
        400,
      );
    }

    console.error("[Admin Setup Monthly Paid Error]", error);
    return c.json(
      {
        error: "Endpoint error",
        details: "An unexpected error occurred while processing the request. Check server logs for details.",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

export default router;
