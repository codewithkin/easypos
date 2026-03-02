import db from "@easypos/db";
import { PLAN_LIMITS, OVERAGE_RATE, type Plan } from "@easypos/types";

/**
 * Fetch org billing data and current resource counts.
 */
export async function getOrgUsage(orgId: string) {
  const org = await db.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: {
      plan: true,
      maxUsers: true,
      maxMonthlyInvoices: true,
      maxProducts: true,
      maxCategories: true,
      maxBranches: true,
      currentMonthInvoices: true,
      currentMonthOverageInvoices: true,
      currentMonthOverageProducts: true,
      currentMonthOverageCategories: true,
      pendingOverageCharges: true,
      billingCycleStart: true,
      nextBillingDate: true,
    },
  });

  const [userCount, productCount, categoryCount, branchCount] = await Promise.all([
    db.user.count({ where: { orgId, isActive: true } }),
    db.product.count({ where: { orgId } }),
    db.category.count({ where: { orgId } }),
    db.branch.count({ where: { orgId, isActive: true } }),
  ]);

  return { org, userCount, productCount, categoryCount, branchCount };
}

/**
 * Check if the billing cycle has rolled over and reset counters.
 * Returns true if a reset happened.
 */
export async function maybeResetBillingCycle(orgId: string): Promise<boolean> {
  const org = await db.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { nextBillingDate: true },
  });

  if (new Date() < org.nextBillingDate) return false;

  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setDate(nextBilling.getDate() + 30);

  await db.organization.update({
    where: { id: orgId },
    data: {
      currentMonthInvoices: 0,
      currentMonthOverageInvoices: 0,
      currentMonthOverageProducts: 0,
      currentMonthOverageCategories: 0,
      // Don't reset pendingOverageCharges — those get cleared on payment
      billingCycleStart: now,
      nextBillingDate: nextBilling,
    },
  });

  return true;
}

// ── Resource-specific limit checks ─────────────────────────────────

type LimitResult =
  | { allowed: true; overage: false }
  | { allowed: true; overage: true; overageCharge: number }
  | { allowed: false; reason: string };

/**
 * Check if org can create a new sale (invoice).
 * Invoices allow overage at OVERAGE_RATE per extra unit.
 */
export async function checkInvoiceLimit(orgId: string): Promise<LimitResult> {
  await maybeResetBillingCycle(orgId);

  const org = await db.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currentMonthInvoices: true, maxMonthlyInvoices: true },
  });

  if (org.currentMonthInvoices < org.maxMonthlyInvoices) {
    return { allowed: true, overage: false };
  }

  // Over limit → charge overage
  return { allowed: true, overage: true, overageCharge: OVERAGE_RATE };
}

/**
 * Increment invoice counter (and overage if applicable). Call after sale creation.
 */
export async function incrementInvoiceCount(orgId: string, isOverage: boolean) {
  await db.organization.update({
    where: { id: orgId },
    data: {
      currentMonthInvoices: { increment: 1 },
      ...(isOverage
        ? {
            currentMonthOverageInvoices: { increment: 1 },
            pendingOverageCharges: { increment: OVERAGE_RATE },
          }
        : {}),
    },
  });
}

/**
 * Check if org can create a new product.
 * Products allow overage at OVERAGE_RATE per extra unit.
 */
export async function checkProductLimit(orgId: string): Promise<LimitResult> {
  const { org, productCount } = await getOrgUsage(orgId);

  if (productCount < org.maxProducts) {
    return { allowed: true, overage: false };
  }

  return { allowed: true, overage: true, overageCharge: OVERAGE_RATE };
}

/**
 * Record product overage charge.
 */
export async function recordProductOverage(orgId: string) {
  await db.organization.update({
    where: { id: orgId },
    data: {
      currentMonthOverageProducts: { increment: 1 },
      pendingOverageCharges: { increment: OVERAGE_RATE },
    },
  });
}

/**
 * Check if org can create a new category.
 * Categories allow overage at OVERAGE_RATE per extra unit.
 */
export async function checkCategoryLimit(orgId: string): Promise<LimitResult> {
  const { org, categoryCount } = await getOrgUsage(orgId);

  if (categoryCount < org.maxCategories) {
    return { allowed: true, overage: false };
  }

  return { allowed: true, overage: true, overageCharge: OVERAGE_RATE };
}

/**
 * Record category overage charge.
 */
export async function recordCategoryOverage(orgId: string) {
  await db.organization.update({
    where: { id: orgId },
    data: {
      currentMonthOverageCategories: { increment: 1 },
      pendingOverageCharges: { increment: OVERAGE_RATE },
    },
  });
}

/**
 * Check if org can create a new branch.
 * Branches are HARD-BLOCKED (no overage).
 */
export async function checkBranchLimit(orgId: string): Promise<LimitResult> {
  const { org, branchCount } = await getOrgUsage(orgId);

  if (branchCount < org.maxBranches) {
    return { allowed: true, overage: false };
  }

  return { allowed: false, reason: `Branch limit reached (${org.maxBranches}). Please upgrade your plan.` };
}

/**
 * Check if org can add a new user.
 * Users are HARD-BLOCKED (no overage).
 */
export async function checkUserLimit(orgId: string): Promise<LimitResult> {
  const { org, userCount } = await getOrgUsage(orgId);

  if (userCount < org.maxUsers) {
    return { allowed: true, overage: false };
  }

  return { allowed: false, reason: `User limit reached (${org.maxUsers}). Please upgrade your plan.` };
}

/**
 * Apply new plan limits to an organization.
 */
export async function applyPlanLimits(orgId: string, plan: Plan) {
  const limits = PLAN_LIMITS[plan];

  await db.organization.update({
    where: { id: orgId },
    data: {
      plan,
      maxUsers: limits.users,
      maxMonthlyInvoices: limits.monthlyInvoices,
      maxProducts: limits.products,
      maxCategories: limits.categories,
      maxBranches: limits.branches,
    },
  });
}
