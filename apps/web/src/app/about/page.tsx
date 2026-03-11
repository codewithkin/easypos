"use client";

import { motion } from "framer-motion";
import { Heart, Target, Lightbulb, Users, Globe, Download } from "lucide-react";
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

const values = [
  {
    icon: Heart,
    title: "Built for Small Business",
    description:
      "We understand the daily challenges of running a shop. EasyPOS is designed from the ground up for business owners who want something simple that just works.",
  },
  {
    icon: Target,
    title: "Simplicity First",
    description:
      "No bloated features or complicated setups. We focus on what matters most: helping you sell faster and track your business better.",
  },
  {
    icon: Lightbulb,
    title: "Always Improving",
    description:
      "We listen to our users and ship updates regularly. New features, better performance, and more integrations — always evolving.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Our roadmap is shaped by real feedback from real business owners. If something can be better, we want to know.",
  },
  {
    icon: Globe,
    title: "Made in Africa",
    description:
      "Built to serve African businesses with local payment methods, currencies, and support that understands the market.",
  },
  {
    icon: Download,
    title: "Mobile First",
    description:
      "Your phone is your most powerful business tool. EasyPOS puts a full point-of-sale system in your pocket.",
  },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(149_100%_35%/0.08),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.h1
              className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              About <span className="text-primary">EasyPOS</span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg text-muted-foreground leading-relaxed"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              We&apos;re on a mission to make business management accessible to
              every entrepreneur. EasyPOS helps small and growing businesses
              sell, track, and grow — all from a simple app on their phone.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Team photo placeholder ────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/50">
              <div className="flex aspect-[21/9] items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-primary/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    [TEAM PHOTO — Replace with a photo of the EasyPOS team, founders, or workspace]
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────── */}
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
              className="text-3xl font-bold text-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Our Mission
            </motion.h2>
            <motion.p
              className="mt-6 text-base text-muted-foreground leading-relaxed"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Millions of small businesses across Africa and beyond still rely on
              pen and paper to track their sales. We believe every business
              deserves access to professional tools — without the complexity or
              high cost. EasyPOS bridges that gap with a mobile-first POS
              system that&apos;s affordable, intuitive, and powerful enough to
              grow with your business.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Values grid ───────────────────────────────────── */}
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
              What we stand for
            </motion.h2>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {value.description}
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
              Join the EasyPOS community
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Download the app and see why businesses love EasyPOS.
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
