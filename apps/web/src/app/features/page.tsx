"use client";

import Link from "next/link";
import Image from "next/image";
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
  ArrowRight,
  Check,
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
    points: [
      "Product grid optimized for speed",
      "Multiple payment methods",
      "Instant digital receipts",
      "Barcode scanning support",
    ],
    image: "/screenshots/sales/new-sale-products.jpg",
    alt: "EasyPOS new sale screen showing product grid for fast checkout",
  },
  {
    icon: Package,
    title: "Real-Time Inventory",
    description:
      "Know exactly what you have in stock. EasyPOS tracks quantities automatically with every sale and alerts you when products run low.",
    points: [
      "Auto stock deduction on sale",
      "Low-stock alerts",
      "Category organization",
      "Product history tracking",
    ],
    image: "/screenshots/products/products-list.jpg",
    alt: "EasyPOS product list showing stock levels and low-stock alerts",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics & Reports",
    description:
      "Get daily summaries, revenue breakdowns by payment method, and see your top-selling products. Make data-driven decisions to grow faster.",
    points: [
      "Daily & weekly reports",
      "Revenue by payment method",
      "Top products ranking",
      "Branch comparison",
    ],
    image: "/screenshots/dashboard/dashboard-home.jpg",
    alt: "EasyPOS dashboard showing daily revenue, top products, and sales analytics",
  },
  {
    icon: Users,
    title: "Team & Role Management",
    description:
      "Invite your staff as Admins, Managers, or Cashiers. Each role has specific permissions so your team only sees what they need.",
    points: [
      "Role-based access control",
      "Admin, Manager, Cashier roles",
      "Per-branch assignments",
      "Activity tracking",
    ],
    image: "/screenshots/team/team-management.jpg",
    alt: "EasyPOS team management screen showing user list with role badges",
  },
  {
    icon: Zap,
    title: "Multi-Branch Operations",
    description:
      "Run multiple store locations under one account. Track sales and inventory per branch, and manage everything centrally.",
    points: [
      "Unlimited branch scaling",
      "Per-branch analytics",
      "Centralized management",
      "Branch-specific staff",
    ],
    image: "/screenshots/store/store-settings.jpg",
    alt: "EasyPOS store settings showing branch management and configuration",
  },
  {
    icon: Receipt,
    title: "Digital & Printed Receipts",
    description:
      "Generate receipts instantly. Print via Bluetooth thermal printers or share digitally. Customize your receipt header and footer.",
    points: [
      "Bluetooth thermal printing",
      "Digital receipt sharing",
      "Custom receipt header/footer",
      "Logo branding",
    ],
    image: "/screenshots/sales/sale-receipt.jpg",
    alt: "EasyPOS receipt showing itemized sale with totals and payment details",
  },
];

const extraFeatures = [
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
      {/* ── Hero ── */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mx-auto max-w-3xl"
          >
            <motion.span
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              variants={fadeUp}
            >
              Features
            </motion.span>
            <motion.h1
              className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Everything your business{" "}
              <span className="text-primary">needs in one app</span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg leading-relaxed text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              From blazing-fast checkout to detailed analytics, EasyPOS has
              every tool you need to run a smarter, more profitable business.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
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
                render={<Link href="/pricing" />}
              >
                View Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Alternating features ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className={`grid items-center gap-14 lg:grid-cols-2 ${
                  i % 2 !== 0 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
              >
                {/* Screenshot */}
                <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                  <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
                    <div className="relative aspect-[9/19] sm:aspect-[3/4]">
                      <Image
                        src={feature.image}
                        alt={feature.alt}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Content */}
                <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    {feature.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {feature.points.map((p) => (
                      <li key={p} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm text-muted-foreground">{p}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Extra features grid ── */}
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
              And More
            </motion.span>
            <motion.h2
              className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Packed with{" "}
              <span className="text-primary">powerful extras</span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {extraFeatures.map((f) => (
              <motion.div
                key={f.title}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
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
              className="text-3xl font-extrabold text-white sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Ready to put these features to work?
            </motion.h2>
            <motion.p
              className="mt-4 text-base text-white/80"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Start your 3-day free trial today and see exactly what EasyPOS
              can do for your business.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
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
              <Button
                variant="outline"
                size="lg"
                className="h-[52px] rounded-xl border-2 border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/pricing" />}
              >
                See Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}


