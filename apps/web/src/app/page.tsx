"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  BarChart3,
  Users,
  Package,
  Zap,
  Shield,
  Download,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const features = [
  {
    icon: ShoppingCart,
    title: "Lightning-Fast Sales",
    description:
      "Ring up sales in seconds with an intuitive POS interface designed for speed.",
  },
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Track stock levels in real-time. Get alerts when products are running low.",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    description:
      "Daily summaries, top products, revenue breakdowns — all at your fingertips.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Invite staff with role-based access. Admins, managers, and cashiers.",
  },
  {
    icon: Zap,
    title: "Multi-Branch Support",
    description:
      "Run multiple store locations from one account. Scale as you grow.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description:
      "Your data is encrypted and backed up. Always accessible, always safe.",
  },
];

const plans = [
  { name: "Starter", price: PLAN_LIMITS.starter.price, popular: false },
  { name: "Growth", price: PLAN_LIMITS.growth.price, popular: true },
  { name: "Enterprise", price: PLAN_LIMITS.enterprise.price, popular: false },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(149_100%_35%/0.08),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-36">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                🚀 Now with 3-day free trial
              </span>
            </motion.div>

            <motion.h1
              className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              The simplest way to{" "}
              <span className="text-primary">run your store</span>
            </motion.h1>

            <motion.p
              className="mt-6 text-lg text-muted-foreground sm:text-xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              EasyPOS gives you everything you need to sell, track inventory,
              manage your team, and grow your business — right from your phone.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button size="lg" className="h-12 px-8 text-base" render={<a href={downloadUrl} />}>
                <Download className="mr-2 h-5 w-5" />
                Download App
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
                render={<Link href="/features" />}
              >
                View Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero image placeholder */}
          <motion.div
            className="mx-auto mt-16 max-w-4xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/50 shadow-2xl">
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <ShoppingCart className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    [HERO IMAGE / APP SCREENSHOT — Replace with a screenshot of the POS interface in action]
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features overview ─────────────────────────────── */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.h2
              className="text-3xl font-bold text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Everything your business needs
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              From quick sales to detailed analytics, EasyPOS handles it all.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Screenshot section ────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="grid items-center gap-12 lg:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Designed for real-world selling
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Whether you run a retail shop, restaurant, or market stall,
                EasyPOS adapts to your workflow. Simple enough for anyone on
                your team to use on day one.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Works offline — sync when you reconnect",
                  "Thermal receipt printing support",
                  "Customer tracking and purchase history",
                  "Overage protection so you never lose a sale",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button size="lg" render={<a href={downloadUrl} />}>
                  <Download className="mr-2 h-4 w-4" />
                  Get EasyPOS
                </Button>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="overflow-hidden rounded-2xl border border-border bg-muted/50">
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                  <p className="px-8 text-center text-sm font-medium text-muted-foreground">
                    [APP SCREENSHOT — Replace with a screenshot showing product grid, cart, and checkout flow]
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing teaser ────────────────────────────────── */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.h2
              className="text-3xl font-bold text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Start with a 3-day free trial on any plan. No credit card required.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-card p-6 text-center ${
                  plan.popular ? "border-primary" : "border-border"
                }`}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <Button
                  className="mt-6 w-full"
                  variant={plan.popular ? "default" : "outline"}
                  render={<Link href="/pricing" />}
                >
                  See details
                </Button>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="text-sm font-medium text-primary hover:underline"
            >
              Compare all plan features →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="border-t border-border bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.h2
              className="text-3xl font-bold text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Start selling smarter today
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Join hundreds of businesses already using EasyPOS to streamline
              their operations.
            </motion.p>
            <motion.div
              className="mt-8"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button size="lg" className="h-12 px-8 text-base" render={<a href={downloadUrl} />}>
                <Download className="mr-2 h-5 w-5" />
                Download EasyPOS
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
