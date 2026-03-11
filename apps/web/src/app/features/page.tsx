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
  Receipt,
  Smartphone,
  Globe,
  Printer,
  Tag,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    title: "Blazing-Fast Checkout",
    description:
      "Ring up sales in seconds with an intuitive product grid, barcode scanning, and quick cart management. Accept cash, mobile money, and card payments.",
    placeholder:
      "[SCREENSHOT — POS checkout screen with product grid on left, cart summary on right, payment method selector at bottom]",
  },
  {
    icon: Package,
    title: "Real-Time Inventory",
    description:
      "Know exactly what you have in stock. EasyPOS tracks quantities automatically with every sale and alerts you when products run low.",
    placeholder:
      "[SCREENSHOT — Product list showing stock levels with low-stock warning badges]",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics & Reports",
    description:
      "Get daily summaries, revenue breakdowns by payment method, and see your top-selling products. Make data-driven decisions to grow faster.",
    placeholder:
      "[SCREENSHOT — Dashboard showing daily revenue chart, top products list, and payment method breakdown]",
  },
  {
    icon: Users,
    title: "Team & Role Management",
    description:
      "Invite your staff as Admins, Managers, or Cashiers. Each role has specific permissions so your team only sees what they need.",
    placeholder:
      "[SCREENSHOT — Team management screen showing user list with roles and invite button]",
  },
  {
    icon: Zap,
    title: "Multi-Branch Operations",
    description:
      "Run multiple store locations under one account. Track sales and inventory per branch, and manage everything centrally.",
    placeholder:
      "[SCREENSHOT — Branch selector dropdown and branch-specific sales data]",
  },
  {
    icon: Receipt,
    title: "Digital & Printed Receipts",
    description:
      "Generate receipts instantly. Print via Bluetooth thermal printers or share digitally. Customize your receipt header and footer.",
    placeholder:
      "[SCREENSHOT — Receipt preview with customized header, itemized list, and totals]",
  },
];

const additionalFeatures = [
  {
    icon: Tag,
    title: "Product Tags & Categories",
    description: "Organize your catalog with categories and tags for fast filtering.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Built for phones and tablets. Works perfectly on any screen size.",
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    description: "Set your preferred currency. Prices display in your local format.",
  },
  {
    icon: Printer,
    title: "Thermal Printer Support",
    description: "Connect Bluetooth thermal printers for fast, professional receipts.",
  },
  {
    icon: Shield,
    title: "Secure & Encrypted",
    description: "All data is encrypted in transit and at rest. Your business data is safe.",
  },
  {
    icon: Users,
    title: "Customer Tracking",
    description: "Keep customer records and view purchase history to build loyalty.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="overflow-hidden">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(149_100%_35%/0.08),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mx-auto max-w-2xl"
          >
            <motion.h1
              className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Powerful features,{" "}
              <span className="text-primary">simple to use</span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Every tool you need to manage sales, inventory, and your team —
              all in one app on your phone.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Alternating features ──────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className={`grid items-center gap-12 lg:grid-cols-2 ${
                  i % 2 === 1 ? "lg:direction-rtl" : ""
                }`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
              >
                <motion.div
                  className={i % 2 === 1 ? "lg:order-2" : ""}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>

                <motion.div
                  className={i % 2 === 1 ? "lg:order-1" : ""}
                  variants={fadeUp}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  <div className="overflow-hidden rounded-2xl border border-border bg-muted/50">
                    <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                      <p className="text-center text-sm font-medium text-muted-foreground">
                        {feature.placeholder}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo video placeholder ────────────────────────── */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.h2
              className="text-3xl font-bold text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              See EasyPOS in action
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Watch a quick walkthrough of how EasyPOS can transform your daily
              sales workflow.
            </motion.p>
          </motion.div>

          <motion.div
            className="mx-auto mt-12 max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/50 shadow-xl">
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <div className="ml-1 h-0 w-0 border-l-[20px] border-y-[12px] border-l-primary border-y-transparent" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    [DEMO VIDEO — Upload a walkthrough video showing the full sales flow: add products → checkout → receipt]
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── More features grid ────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.h2
              className="text-3xl font-bold text-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              And so much more
            </motion.h2>
          </motion.div>

          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {additionalFeatures.map((f) => (
              <motion.div
                key={f.title}
                className="rounded-xl border border-border bg-card p-5"
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <f.icon className="h-5 w-5 text-primary" />
                <h4 className="mt-3 text-sm font-semibold text-foreground">
                  {f.title}
                </h4>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Download CTA ──────────────────────────────────── */}
      <section className="border-t border-border bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.h2
              className="text-3xl font-bold text-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Ready to try it out?
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Download the app and start your free 3-day trial today.
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
