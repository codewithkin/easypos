import type { Plan } from "@easypos/types";

export type BillingLockReason = "trial_expired" | "payment_due";

type BillingOrgState = {
  plan: Plan;
  trialEndsAt: Date | null;
  nextBillingDate: Date | null;
};

export type BillingLockState = {
  isLocked: boolean;
  reason: BillingLockReason | null;
  message: string | null;
  plan: Plan;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  serverNow: string;
};

export function getBillingLockState(org: BillingOrgState, now = new Date()): BillingLockState {
  const trialEndsAtIso = org.trialEndsAt?.toISOString() ?? null;
  const nextBillingDateIso = org.nextBillingDate?.toISOString() ?? null;
  const serverNow = now.toISOString();

  if (org.plan === "none") {
    const trialExpired = !org.trialEndsAt || org.trialEndsAt < now;
    if (trialExpired) {
      return {
        isLocked: true,
        reason: "trial_expired",
        message:
          "Your free trial has ended. Please subscribe to a plan to continue using EasyPOS.",
        plan: org.plan,
        trialEndsAt: trialEndsAtIso,
        nextBillingDate: nextBillingDateIso,
        serverNow,
      };
    }
  }

  if (org.plan !== "none") {
    const paymentDue = !!org.nextBillingDate && org.nextBillingDate < now;
    if (paymentDue) {
      return {
        isLocked: true,
        reason: "payment_due",
        message:
          "Your subscription payment is due. Please complete the payment to continue using EasyPOS.",
        plan: org.plan,
        trialEndsAt: trialEndsAtIso,
        nextBillingDate: nextBillingDateIso,
        serverNow,
      };
    }
  }

  return {
    isLocked: false,
    reason: null,
    message: null,
    plan: org.plan,
    trialEndsAt: trialEndsAtIso,
    nextBillingDate: nextBillingDateIso,
    serverNow,
  };
}