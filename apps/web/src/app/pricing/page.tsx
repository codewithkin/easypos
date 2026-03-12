"use client";

import { motion } from "framer-motion";
import { Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { PLAN_LIMITS } from "@easypos/types";

const downloadUrl =
  process.env.NEXT_PUBLIC_EXPO_PRODUCTION_BUILD_URL ?? "#";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    description: "Perfect for small shops just getting started",
    popular: false,
    cta: "Get started with Starter",
  },
  {
    key: "growth" as const,
    name: "Growth",
    description: "For growing businesses that need more power",
    popular: true,
    cta: "Upgrade to Growth",
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    description: "Supercharge your business at scale",
    popular: false,
    cta: "Supercharge with Enterprise",
  },
];

function getFeatures(key: "starter" | "growth" | "enterprise") {
  const l = PLAN_LIMITS[key];
  return [
    `Up to ${l.users} users`,
    `${l.products.toLocaleString()} products`,
    `${l.categories} categories`,
    `${l.branches} ${l.branches === 1 ? "branch" : "branches"}`,
    `${l.monthlyInvoices.toLocaleString()} invoices/month`,
    key === "starter"
      ? "Email support"
      : key === "growth"
        ? "Priority support"
        : "Dedicated support",
  ];
}

const faqs = [
  {
    q: "How does the 3-day free trial work?",
    a: "When you sign up, you pick any plan (Starter, Growth, or Enterprise) and get full access to all its features for 3 days — no payment required. At the end of the trial, you simply pay to continue on that plan.",
  },
  {
    q: "Can I change my plan later?",
    a: "Yes! You can upgrade or downgrade your plan at any time from the Billing section in the app. Changes take effect immediately.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept mobile money (EcoCash, OneMoney) and bank transfers via Paynow, Zimbabwe's trusted payment gateway.",
  },
  {
    q: "What happens if I exceed my plan limits?",
    a: "EasyPOS has overage protection. If you exceed invoices, products, or categories, you'll be charged $0.02 per extra unit so you never lose a sale. Branch and user limits are hard caps.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. All data is encrypted in transit and stored securely in our cloud database. Your business information is always protected.",
  },
  {
    q: "Can I use EasyPOS on multiple devices?",
    a: "Yes. Your team members can log in from any Android device. Each user has their own account with role-based permissions.",
  },
];

export default function PricingPage() {
  return (
    <div className="overflow-hidden">
      {/* ── Hero ─────────────────────────────────────────── */}
      {/* Hero */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mx-auto max-w-2xl"
          >
            <motion.span
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              variants={fadeUp}
            >
              Pricing
            </motion.span>
            <motion.h1
              className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Simple, transparent{" "}
              <span className="text-primary">pricing</span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Start with a 3-day free trial on any plan. No credit card
              required. Pick the plan that fits your business.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            className="grid gap-8 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {plans.map((plan) => {
              const limits = PLAN_LIMITS[plan.key];
              const features = getFeatures(plan.key);

              return (
                <motion.div
                  key={plan.key}
                  className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm ${
                    plan.popular ? "border-primary" : "border-border"
                  }`}
                  variants={fadeUp}
                  transition={{ duration: 0.4 }}
                >
                  {plan.popular && (
                    <div className="bg-primary py-2">
                      <p className="text-center text-xs font-bold uppercase tracking-wide text-primary-foreground">
                        Most Popular
                      </p>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold text-foreground">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">
                        ${limits.price}
                      </span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>

                    <ul className="mt-6 flex-1 space-y-3">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="mt-8 w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      render={<a href={downloadUrl} />}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            All plans include overage protection at $0.02/unit for invoices,
            products, and categories.
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      {/* FAQ */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.span
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              variants={fadeUp}
            >
              FAQ
            </motion.span>
            <motion.h2
              className="mt-4 text-3xl font-extrabold text-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Frequently asked questions
            </motion.h2>
          </motion.div>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <Accordion>
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ── Download CTA ──────────────────────────────────── */}
      {/* Download CTA */}
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.h2
              className="text-3xl font-extrabold text-white"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Start your free trial now
            </motion.h2>
            <motion.p
              className="mt-4 text-base text-white/80"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Download the app, pick your plan, and start selling in minutes.
            </motion.p>
            <motion.div
              className="mt-8"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-foreground shadow-lg transition hover:bg-white/90"
              >
                <Smartphone className="h-5 w-5" />
                <div className="text-left">
                  <div className="text-[10px] font-normal leading-none opacity-60">Download on</div>
                  <div className="text-sm font-bold leading-none">Android</div>
                </div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
