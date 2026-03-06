import { Hono } from "hono";
import db from "@easypos/db";
import {
  createIntermediatePaymentRequestSchema,
  PLAN_LIMITS,
  type Plan,
} from "@easypos/types";
import { zBody } from "../lib/validate.js";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { initiatePaynowPayment, pollPaynowStatus } from "../lib/billing.js";
import { applyPlanLimits, getOrgUsage } from "../lib/plan-limits.js";

const billing = new Hono<Env>()
  .use(authMiddleware)

  // ── Get billing usage ─────────────────────────────────────────
  .get("/usage", async (c) => {
    const orgId = c.get("orgId");

    const { org, userCount, productCount, categoryCount, branchCount } =
      await getOrgUsage(orgId);

    return c.json({
      plan: org.plan,
      limits: {
        users: org.maxUsers,
        monthlyInvoices: org.maxMonthlyInvoices,
        products: org.maxProducts,
        categories: org.maxCategories,
        branches: org.maxBranches,
      },
      usage: {
        users: userCount,
        monthlyInvoices: org.currentMonthInvoices,
        products: productCount,
        categories: categoryCount,
        branches: branchCount,
      },
      pendingOverageCharges: org.pendingOverageCharges,
      nextBillingDate: org.nextBillingDate,
      billingCycleStart: org.billingCycleStart,
    });
  })

  // ── Initiate plan purchase / upgrade ──────────────────────────
  .post(
    "/subscribe",
    requireRole("ADMIN", "MANAGER"),
    zBody(createIntermediatePaymentRequestSchema),
    async (c) => {
      const userId = c.get("userId");
      const orgId = c.get("orgId");
      const { plan } = c.req.valid("json");

      const planLimits = PLAN_LIMITS[plan];
      const amount = planLimits.price;

      // Fetch user email for Paynow
      const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { email: true },
      });

      // Create the intermediate payment record
      const intermediatePayment = await db.intermediatePayment.create({
        data: {
          planName: plan,
          amount,
          currency: "USD",
          userId,
          orgId,
        },
      });

      // Initiate Paynow payment
      const result = await initiatePaynowPayment({
        reference: intermediatePayment.id,
        email: user.email,
        amount,
        description: `EasyPOS ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - $${amount}/mo`,
      });

      if (!result.success) {
        await db.intermediatePayment.update({
          where: { id: intermediatePayment.id },
          data: { failureReason: result.error },
        });
        return c.json({ error: result.error || "Payment initiation failed" }, 400);
      }

      // Save the poll URL
      await db.intermediatePayment.update({
        where: { id: intermediatePayment.id },
        data: { pollUrl: result.pollUrl },
      });

      return c.json({
        paymentId: intermediatePayment.id,
        redirectUrl: result.redirectUrl,
      });
    },
  )

  // ── Confirm payment (called from return URL or by client) ─────
  .post("/confirm/:id", async (c) => {
    const orgId = c.get("orgId");
    const paymentId = c.req.param("id");

    const payment = await db.intermediatePayment.findFirst({
      where: { id: paymentId, orgId },
    });

    if (!payment) return c.json({ error: "Payment not found" }, 404);
    if (payment.paid) {
      return c.json({ message: "Payment already confirmed", plan: payment.planName });
    }

    if (!payment.pollUrl) {
      return c.json({ error: "Payment has no poll URL" }, 400);
    }

    // Poll Paynow for status
    const status = await pollPaynowStatus(payment.pollUrl);

    if (!status.paid) {
      return c.json(
        {
          error: "Payment not yet completed",
          paynowStatus: status.status,
        },
        402,
      );
    }

    // Mark as paid and apply plan
    await db.intermediatePayment.update({
      where: { id: paymentId },
      data: { paid: true },
    });

    const plan = payment.planName as Plan;
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setDate(nextBilling.getDate() + 30);

    await applyPlanLimits(orgId, plan);

    // Reset billing cycle on plan change
    await db.organization.update({
      where: { id: orgId },
      data: {
        billingCycleStart: now,
        nextBillingDate: nextBilling,
        currentMonthInvoices: 0,
        currentMonthOverageInvoices: 0,
        currentMonthOverageProducts: 0,
        currentMonthOverageCategories: 0,
        pendingOverageCharges: 0,
      },
    });

    return c.json({ message: "Payment confirmed", plan });
  })

  // ── Get payment status ────────────────────────────────────────
  .get("/payment/:id", async (c) => {
    const orgId = c.get("orgId");
    const paymentId = c.req.param("id");

    const payment = await db.intermediatePayment.findFirst({
      where: { id: paymentId, orgId },
    });

    if (!payment) return c.json({ error: "Payment not found" }, 404);

    return c.json({
      id: payment.id,
      planName: payment.planName,
      amount: payment.amount,
      currency: payment.currency,
      paid: payment.paid,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
    });
  })

  // ── List payment history ──────────────────────────────────────
  .get("/payments", requireRole("ADMIN"), async (c) => {
    const orgId = c.get("orgId");

    const payments = await db.intermediatePayment.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return c.json({ items: payments });
  });

export default billing;

// ── Webhook handler (no auth - called by Paynow) ──────────────────
// This is mounted separately without authMiddleware

export const billingWebhook = new Hono()
  .post("/billing/webhook", async (c) => {
    // Paynow sends a POST with URL-encoded body
    const body = await c.req.text();
    const params = new URLSearchParams(body);
    const reference = params.get("reference");
    const status = (params.get("status") || "").toLowerCase();

    if (!reference) {
      return c.json({ error: "Missing reference" }, 400);
    }

    const payment = await db.intermediatePayment.findUnique({
      where: { id: reference },
    });

    if (!payment) {
      return c.json({ error: "Payment not found" }, 404);
    }

    if (payment.paid) {
      return c.json({ message: "Already processed" });
    }

    if (status === "paid" || status === "delivered") {
      await db.intermediatePayment.update({
        where: { id: reference },
        data: { paid: true },
      });

      const plan = payment.planName as Plan;
      const now = new Date();
      const nextBilling = new Date(now);
      nextBilling.setDate(nextBilling.getDate() + 30);

      await applyPlanLimits(payment.orgId, plan);

      await db.organization.update({
        where: { id: payment.orgId },
        data: {
          billingCycleStart: now,
          nextBillingDate: nextBilling,
          currentMonthInvoices: 0,
          currentMonthOverageInvoices: 0,
          currentMonthOverageProducts: 0,
          currentMonthOverageCategories: 0,
          pendingOverageCharges: 0,
        },
      });
    } else if (status === "cancelled" || status === "failed") {
      await db.intermediatePayment.update({
        where: { id: reference },
        data: { failureReason: `Paynow status: ${status}` },
      });
    }

    return c.json({ message: "OK" });
  })

  // ── Return URL handler (Paynow redirects user's browser here) ──
  // Then we redirect to the app's deep link
  .get("/billing/confirm/:id", async (c) => {
    const paymentId = c.req.param("id");

    const payment = await db.intermediatePayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      // Redirect to failure screen
      return c.redirect(`easypos://payments/failure?reason=${encodeURIComponent("Payment not found")}`);
    }

    // Try to poll and confirm
    if (payment.pollUrl && !payment.paid) {
      try {
        const status = await pollPaynowStatus(payment.pollUrl);
        if (status.paid) {
          await db.intermediatePayment.update({
            where: { id: paymentId },
            data: { paid: true },
          });

          const plan = payment.planName as Plan;
          const now = new Date();
          const nextBilling = new Date(now);
          nextBilling.setDate(nextBilling.getDate() + 30);

          await applyPlanLimits(payment.orgId, plan);
          await db.organization.update({
            where: { id: payment.orgId },
            data: {
              billingCycleStart: now,
              nextBillingDate: nextBilling,
              currentMonthInvoices: 0,
              currentMonthOverageInvoices: 0,
              currentMonthOverageProducts: 0,
              currentMonthOverageCategories: 0,
              pendingOverageCharges: 0,
            },
          });
        }
      } catch {
        // Ignore polling errors — the app will retry via the confirm endpoint
      }
    }

    if (payment.paid) {
      return c.redirect(`easypos://payments/success?intermediatePayment=${paymentId}`);
    }

    // Payment not yet confirmed — still redirect to success screen
    // which will poll the confirm endpoint
    return c.redirect(`easypos://payments/success?intermediatePayment=${paymentId}`);
  });
