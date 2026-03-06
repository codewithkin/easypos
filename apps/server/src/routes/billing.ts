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
      try {
        console.log("[SUBSCRIBE] === REQUEST START ===");
        const userId = c.get("userId");
        const orgId = c.get("orgId");
        console.log("[SUBSCRIBE] userId:", userId);
        console.log("[SUBSCRIBE] orgId:", orgId);

        const rawBody = await c.req.json();
        console.log("[SUBSCRIBE] Raw request body:", JSON.stringify(rawBody));

        const { plan } = c.req.valid("json");
        console.log("[SUBSCRIBE] Parsed plan from request:", plan);
        console.log("[SUBSCRIBE] Plan type:", typeof plan);
        console.log("[SUBSCRIBE] Plan value matches starter?", plan === "starter");
        console.log("[SUBSCRIBE] Valid plan values:", Object.keys(PLAN_LIMITS));

        if (!PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]) {
          console.log("[SUBSCRIBE] ERROR: Invalid plan value");
          return c.json(
            {
              error: `Invalid plan: "${plan}". Must be one of: ${Object.keys(PLAN_LIMITS).join(", ")}`,
            },
            400,
          );
        }

        const planLimits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
        const amount = planLimits.price;
        console.log("[SUBSCRIBE] Plan limits retrieved:", planLimits);
        console.log("[SUBSCRIBE] Amount:", amount);

        // Fetch user email for Paynow
        console.log("[SUBSCRIBE] Fetching user with id:", userId);
        const user = await db.user.findUniqueOrThrow({
          where: { id: userId },
          select: { email: true },
        });
        console.log("[SUBSCRIBE] User email:", user.email);

        // Create the intermediate payment record
        console.log("[SUBSCRIBE] Creating intermediate payment");
        const intermediatePayment = await db.intermediatePayment.create({
          data: {
            planName: plan,
            amount,
            currency: "USD",
            userId,
            orgId,
          },
        });
        console.log("[SUBSCRIBE] Intermediate payment created:", intermediatePayment.id);

        // Initiate Paynow payment
        console.log("[SUBSCRIBE] Initiating Paynow payment");
        const result = await initiatePaynowPayment({
          reference: intermediatePayment.id,
          email: user.email,
          amount,
          description: `EasyPOS ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - $${amount}/mo`,
        });
        console.log("[SUBSCRIBE] Paynow initiate result:", result);

        if (!result.success) {
          console.log("[SUBSCRIBE] Paynow failed, updating payment record");
          await db.intermediatePayment.update({
            where: { id: intermediatePayment.id },
            data: { failureReason: result.error },
          });
          return c.json({ error: result.error || "Payment initiation failed" }, 400);
        }

        // Save the poll URL
        console.log("[SUBSCRIBE] Saving poll URL:", result.pollUrl);
        await db.intermediatePayment.update({
          where: { id: intermediatePayment.id },
          data: { pollUrl: result.pollUrl },
        });

        console.log("[SUBSCRIBE] === SUCCESS ===");
        return c.json({
          paymentId: intermediatePayment.id,
          redirectUrl: result.redirectUrl,
        });
      } catch (err: any) {
        console.error("[SUBSCRIBE] === ERROR ===");
        console.error("[SUBSCRIBE] Error type:", err.constructor.name);
        console.error("[SUBSCRIBE] Error message:", err?.message);
        console.error("[SUBSCRIBE] Error stack:", err?.stack);
        console.error("[SUBSCRIBE] Full error:", err);
        return c.json({ error: err?.message || "Subscription failed" }, 500);
      }
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

  // ── Callback handler (Paynow redirects user's browser here) ────
  // Query param: ?reference=<paymentId>
  // Then we generate HTML that opens the deep link
  .get("/billing/callback", async (c) => {
    const reference = c.req.query("reference");

    if (!reference) {
      return c.html("<h1>Error: Missing payment reference</h1>", 400);
    }

    const payment = await db.intermediatePayment.findUnique({
      where: { id: reference },
    });

    if (!payment) {
      return c.html("<h1>Error: Payment not found</h1>", 404);
    }

    // Try to poll Paynow for the latest status
    if (payment.pollUrl && !payment.paid) {
      try {
        const status = await pollPaynowStatus(payment.pollUrl);
        if (status.paid) {
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
        }
      } catch (err) {
        console.error("[BILLING] Error polling Paynow:", err);
        // Continue anyway — the app will retry via the confirm endpoint
      }
    }

    // Generate HTML that opens the deep link
    const deepLink = payment.paid
      ? `easypos://billing/confirm?reference=${reference}&status=success`
      : `easypos://billing/confirm?reference=${reference}&status=pending`;

    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting...</title>
      </head>
      <body>
        <h1>Processing payment...</h1>
        <p>Please wait while we confirm your payment and redirect you to the app.</p>
        <script>
          // Try to open the deep link
          window.location = '${deepLink}';
          
          // Fallback: show a message after 2 seconds
          setTimeout(() => {
            document.body.innerHTML = '<h2>If the app did not open, you can close this window.</h2><p>Status: ${payment.paid ? "Payment confirmed" : "Payment pending"}</p>';
          }, 2000);
        </script>
      </body>
      </html>
    `);
  })

  // ── Return URL handler (legacy, for path param compatibility) ──
  // Path param version: /billing/confirm/:id
