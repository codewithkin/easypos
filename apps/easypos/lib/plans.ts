import { PLAN_LIMITS, type Plan } from "@easypos/types";

export interface PlanInfo {
    key: Plan;
    name: string;
    description: string;
    price: number;
    popular?: boolean;
    cta: string;
    features: string[];
}

/**
 * All available plans for display in the UI.
 * The `none` plan is excluded — it represents "no plan selected".
 */
const plans: PlanInfo[] = [
    {
        key: "starter",
        name: "Starter",
        description: "Perfect for small shops just getting started",
        price: PLAN_LIMITS.starter.price,
        cta: "Get started with Starter",
        features: [
            `Up to ${PLAN_LIMITS.starter.users} users`,
            `${PLAN_LIMITS.starter.products} products`,
            `${PLAN_LIMITS.starter.categories} categories`,
            `${PLAN_LIMITS.starter.branches} branch`,
            `${PLAN_LIMITS.starter.monthlyInvoices.toLocaleString()} invoices/month`,
            "Email support",
        ],
    },
    {
        key: "growth",
        name: "Growth",
        description: "For growing businesses that need more power",
        price: PLAN_LIMITS.growth.price,
        popular: true,
        cta: "Upgrade to Growth",
        features: [
            `Up to ${PLAN_LIMITS.growth.users} users`,
            `${PLAN_LIMITS.growth.products} products`,
            `${PLAN_LIMITS.growth.categories} categories`,
            `${PLAN_LIMITS.growth.branches} branches`,
            `${PLAN_LIMITS.growth.monthlyInvoices.toLocaleString()} invoices/month`,
            "Priority support",
        ],
    },
    {
        key: "enterprise",
        name: "Enterprise",
        description: "Supercharge your business at scale",
        price: PLAN_LIMITS.enterprise.price,
        cta: "Supercharge with Enterprise",
        features: [
            `Up to ${PLAN_LIMITS.enterprise.users} users`,
            `${PLAN_LIMITS.enterprise.products.toLocaleString()} products`,
            `${PLAN_LIMITS.enterprise.categories} categories`,
            `${PLAN_LIMITS.enterprise.branches} branches`,
            `${PLAN_LIMITS.enterprise.monthlyInvoices.toLocaleString()} invoices/month`,
            "Dedicated support",
        ],
    },
];

export default plans;
