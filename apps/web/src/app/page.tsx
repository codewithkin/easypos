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
  Star,
  Smartphone,
  Receipt,
  TrendingUp,
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

const smartFeatures = [
  {
    icon: Zap,
    title: "Lightning-Fast Checkout",
    description:
      "Complete a sale in seconds with an intuitive product grid, quick cart management, and instant receipt generation.",
  },
  {
    icon: Shield,
    title: "Secure & Always Reliable",
    description:
      "Your data is encrypted and backed up automatically. Access your business anytime, anywhere.",
  },
];

const stats = [
  { value: "500+", label: "Businesses" },
  { value: "50K+", label: "Products Managed" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.8 ★", label: "Average Rating" },
];

const howItWorks = [
  {
    number: "01",
    title: "Add Your Products",
    description:
      "Set up your product catalog with prices, categories, and stock levels in minutes.",
  },
  {
    number: "02",
    title: "Set Up Your Store",
    description:
      "Configure your branches, invite staff, and customize your receipt template.",
  },
  {
    number: "03",
    title: "Sell Instantly",
    description:
      "Ring up sales in seconds, accept multiple payment methods, and print receipts.",
  },
  {
    number: "04",
    title: "Track & Grow",
    description:
      "Monitor daily sales, view analytics, and make data-driven decisions every day.",
  },
];

const testimonials = [
  {
    quote:
      "EasyPOS completely transformed how I run my shop. I used to track everything in a notebook - now I get daily summaries right on my phone.",
    name: "Tatenda M.",
    business: "Grocery Store Owner, Harare",
    rating: 5,
  },
  {
    quote:
      "Setting up was so simple. I had my products loaded and was making sales on the same day. The team management feature is a game-changer.",
    name: "Blessing K.",
    business: "Fashion Boutique, Bulawayo",
    rating: 5,
  },
  {
    quote:
      "The inventory alerts alone are worth it. I never run out of stock unexpectedly anymore. My customers notice the difference.",
    name: "Farai C.",
    business: "Electronics Shop, Mutare",
    rating: 5,
  },
];

const plans = [
  {
    name: "Starter",
    price: PLAN_LIMITS.starter.price,
    popular: false,
    features: [
      "Up to 50 products",
      "Single branch",
      "1 team member",
      "Basic reporting",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: PLAN_LIMITS.growth.price,
    popular: true,
    features: [
      "Up to 500 products",
      "Up to 5 branches",
      "Up to 10 team members",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: PLAN_LIMITS.enterprise.price,
    popular: false,
    features: [
      "Unlimited products",
      "Unlimited branches",
      "Unlimited team members",
      "Custom integrations",
      "24/7 dedicated support",
    ],
  },
];

export default function Home() {
  return (
    <div className="overflow-hidden">

      {/* ── Hero ── */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-0 sm:px-6 sm:pt-24 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Trusted by 500+ businesses across Zimbabwe
              </span>
            </motion.div>

            <motion.h1
              className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Your Trusted Partner for{" "}
              <span className="text-primary">Smart Selling</span>
            </motion.h1>

            <motion.p
              className="mt-6 text-lg text-muted-foreground sm:text-xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              EasyPOS gives you everything you need to sell faster, track
              inventory, manage your team, and grow your business - right from
              your phone.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-3 rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background shadow-lg transition hover:opacity-90"
              >
                <Smartphone className="h-5 w-5" />
                <div className="text-left">
                  <div className="text-[10px] font-normal leading-none opacity-60">Download on</div>
                  <div className="text-sm font-bold leading-none">Android</div>
                </div>
              </a>
              <Button
                variant="outline"
                size="lg"
                className="h-[52px] rounded-xl border-2 px-8 text-sm font-semibold"
                render={<Link href="/features" />}
              >
                Explore Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero phone + floating cards */}
          <motion.div
            className="mt-14 flex justify-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className="relative flex items-end gap-4 sm:gap-8">
              {/* Floating stat card left */}
              <motion.div
                className="mb-16 hidden w-40 rounded-2xl border border-border bg-white p-4 shadow-lg sm:block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground">Today&apos;s Sales</p>
                <p className="mt-0.5 text-xl font-extrabold text-primary">$842.50</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">↑ 12% vs yesterday</p>
              </motion.div>

              {/* Phone frame */}
              <div className="relative">
                <div className="mx-auto w-[200px] overflow-hidden rounded-[2rem] border-[6px] border-foreground/[0.07] bg-background shadow-2xl sm:w-[240px]">
                  <div className="flex aspect-[9/19] flex-col items-center justify-center gap-2 bg-gradient-to-b from-primary/5 to-primary/10 p-4">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-center text-[10px] font-semibold text-muted-foreground">
                      [HERO PHONE SCREENSHOT]
                    </p>
                    <p className="px-2 text-center text-[9px] leading-tight text-muted-foreground/70">
                      Replace with EasyPOS sales dashboard showing product grid and today&apos;s totals
                    </p>
                  </div>
                </div>
                {/* Notch */}
                <div className="absolute left-1/2 top-0 h-5 w-14 -translate-x-1/2 rounded-b-xl bg-foreground/[0.07]" />
              </div>

              {/* Floating stat card right */}
              <motion.div
                className="mb-16 hidden w-40 rounded-2xl border border-border bg-white p-4 shadow-lg sm:block"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-warning/10">
                  <Package className="h-4 w-4 text-warning" />
                </div>
                <p className="text-xs font-semibold text-foreground">Low Stock Alert</p>
                <p className="mt-0.5 text-xl font-extrabold text-warning">3 items</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Reorder needed now</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust band ── */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Accepted Payments
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {["EcoCash", "OneMoney", "Paynow", "Cash", "Bank Transfer"].map((p) => (
                <span key={p} className="text-sm font-bold text-foreground/30">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Smart POS (About) ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="grid items-center gap-14 lg:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {/* Phone mockup */}
            <motion.div className="flex justify-center" variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className="relative">
                <div className="mx-auto w-[220px] overflow-hidden rounded-[2rem] border-[6px] border-foreground/[0.07] bg-secondary shadow-2xl sm:w-[260px]">
                  <div className="flex aspect-[9/19] flex-col items-center justify-center gap-2 bg-gradient-to-b from-primary/5 to-primary/10 p-4">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-center text-[10px] font-semibold text-muted-foreground">
                      [CHECKOUT SCREENSHOT]
                    </p>
                    <p className="px-2 text-center text-[9px] leading-tight text-muted-foreground/70">
                      Replace with EasyPOS cart/checkout screen showing items, totals and payment methods
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 top-0 h-5 w-14 -translate-x-1/2 rounded-b-xl bg-foreground/[0.07]" />
                {/* Floating badge */}
                <motion.div
                  className="absolute -right-3 top-16 rounded-2xl border border-border bg-white p-3 shadow-xl sm:-right-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-foreground">Sale Complete</p>
                      <p className="text-[9px] text-muted-foreground">Receipt sent ✓</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                About EasyPOS
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Fast, smart, and{" "}
                <span className="text-primary">secure point of sale</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Bookkeeping, inventory, team management, and analytics - all in one place, all from your phone. EasyPOS is built for the real-world pace of small and growing businesses.
              </p>
              <div className="mt-8 space-y-5">
                {smartFeatures.map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="grid items-center gap-14 lg:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                In Numbers
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Effortlessly manage{" "}
                <span className="text-primary">your business</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                EasyPOS connects business owners with the tools they need for fast, reliable operations. Whether you&apos;re a solo entrepreneur or running multiple branches, we&apos;ve got you covered.
              </p>
              <div className="mt-6">
                <Button
                  size="lg"
                  className="h-11 rounded-xl px-8 text-sm font-semibold"
                  render={<a href={downloadUrl} />}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download EasyPOS
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
                <div className="flex aspect-[4/3] flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-center text-sm font-semibold text-muted-foreground">
                    [LIFESTYLE PHOTO]
                  </p>
                  <p className="mt-2 max-w-[220px] text-center text-xs leading-relaxed text-muted-foreground/70">
                    Replace with a photo of a business owner using EasyPOS on their phone at a shop counter
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.span
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              variants={fadeUp}
            >
              How It Works
            </motion.span>
            <motion.h2
              className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              From setup to your first sale -{" "}
              <span className="text-primary">here&apos;s how</span>
            </motion.h2>
            <motion.p
              className="mt-4 text-base text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Get up and running in minutes. EasyPOS is designed for business owners, not tech experts.
            </motion.p>
          </motion.div>

          {/* Desktop 3-col layout */}
          <div className="mt-16 hidden items-start gap-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-col gap-10 pt-10">
              {howItWorks.slice(0, 2).map((step) => (
                <motion.div
                  key={step.number}
                  className="flex flex-row-reverse gap-4 text-right"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-sm font-bold text-primary">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div className="w-[180px] overflow-hidden rounded-[2rem] border-[6px] border-foreground/[0.07] bg-secondary shadow-2xl sm:w-[220px]">
                  <div className="flex aspect-[9/19] flex-col items-center justify-center gap-2 bg-gradient-to-b from-primary/5 to-primary/10 p-4">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-center text-[10px] font-semibold text-muted-foreground">
                      [HOW IT WORKS SCREENSHOT]
                    </p>
                    <p className="px-2 text-center text-[9px] leading-tight text-muted-foreground/70">
                      Replace with EasyPOS app showing the main navigation and sale flow
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 top-0 h-5 w-14 -translate-x-1/2 rounded-b-xl bg-foreground/[0.07]" />
              </div>
            </div>

            <div className="flex flex-col gap-10 pt-10">
              {howItWorks.slice(2).map((step) => (
                <motion.div
                  key={step.number}
                  className="flex gap-4"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-sm font-bold text-primary">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile layout */}
          <div className="mt-12 flex flex-col items-center gap-10 lg:hidden">
            <div className="relative">
              <div className="w-[180px] overflow-hidden rounded-[2rem] border-[6px] border-foreground/[0.07] bg-secondary shadow-2xl">
                <div className="flex aspect-[9/19] flex-col items-center justify-center gap-2 bg-gradient-to-b from-primary/5 to-primary/10 p-4">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-center text-[10px] font-semibold text-muted-foreground">
                    [HOW IT WORKS SCREENSHOT]
                  </p>
                </div>
              </div>
              <div className="absolute left-1/2 top-0 h-5 w-14 -translate-x-1/2 rounded-b-xl bg-foreground/[0.07]" />
            </div>
            <div className="w-full max-w-md space-y-6">
              {howItWorks.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-sm font-bold text-primary">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.span
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              variants={fadeUp}
            >
              Testimonials
            </motion.span>
            <motion.h2
              className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Business management made easy -{" "}
              <span className="text-primary">hear it from our users</span>
            </motion.h2>
            <motion.p
              className="mt-4 text-base text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Hear directly from business owners who rely on EasyPOS every day.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm"
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="flex-1 text-sm italic leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.business}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.span
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              variants={fadeUp}
            >
              Pricing
            </motion.span>
            <motion.h2
              className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Simple, transparent{" "}
              <span className="text-primary">pricing</span>
            </motion.h2>
            <motion.p
              className="mt-4 text-base text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Start with a 3-day free trial on any plan. No credit card required.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-white p-6 text-center shadow-sm ${
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
                  <span className="text-4xl font-extrabold text-foreground">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>

                {/* Features list */}
                <ul className="mt-6 space-y-2.5 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-6 w-full rounded-xl"
                  variant={plan.popular ? "default" : "outline"}
                  render={<Link href="/pricing" />}
                >
                  See details
                </Button>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 text-center">
            <Link href="/pricing" className="text-sm font-medium text-primary hover:underline">
              Compare all plan features →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                One app for fast, reliable{" "}
                <span className="opacity-75">business management</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/80">
                Join hundreds of business owners who&apos;ve ditched pen-and-paper bookkeeping. Try EasyPOS free for 3 days - no credit card required.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
                <Button
                  variant="outline"
                  size="lg"
                  className="h-[52px] rounded-xl border-2 border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                  render={<Link href="/features" />}
                >
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              className="flex justify-center lg:justify-end"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <div className="w-[180px] overflow-hidden rounded-[2rem] border-[6px] border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm sm:w-[200px]">
                  <div className="flex aspect-[9/19] flex-col items-center justify-center gap-2 p-4">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-center text-[10px] font-medium text-white/70">
                      [CTA PHONE SCREENSHOT]
                    </p>
                    <p className="px-2 text-center text-[9px] leading-tight text-white/50">
                      Replace with EasyPOS analytics home screen
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 top-0 h-5 w-14 -translate-x-1/2 rounded-b-xl bg-white/10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
