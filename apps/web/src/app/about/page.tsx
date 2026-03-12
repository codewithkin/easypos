"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Target,
  Lightbulb,
  Users,
  Globe,
  Smartphone,
  ArrowRight,
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

const companyStats = [
  { value: "500+", label: "Businesses Served" },
  { value: "3", label: "Years Building" },
  { value: "50K+", label: "Products Tracked" },
  { value: "4.8 ★", label: "Average Rating" },
];

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
    icon: Smartphone,
    title: "Mobile First",
    description:
      "Your phone is your most powerful business tool. EasyPOS puts a full point-of-sale system in your pocket.",
  },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      {/* ── Hero ── */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.span
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              variants={fadeUp}
            >
              Our Story
            </motion.span>
            <motion.h1
              className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              About{" "}
              <span className="text-primary">EasyPOS</span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg leading-relaxed text-muted-foreground"
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

      {/* ── Stats strip ── */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {companyStats.map((s) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-3xl font-extrabold text-foreground sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ── Mission (2-col) ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="grid items-center gap-14 lg:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {/* Team photo */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
                <div className="flex aspect-[4/3] flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-center text-sm font-semibold text-muted-foreground">
                    [TEAM PHOTO]
                  </p>
                  <p className="mt-2 max-w-[220px] text-center text-xs leading-relaxed text-muted-foreground/70">
                    Replace with a photo of the EasyPOS founding team or workspace
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Mission text */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Our Mission
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Making professional tools{" "}
                <span className="text-primary">accessible to all</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Millions of small businesses across Africa and beyond still rely
                on pen and paper to track their sales. We believe every business
                deserves access to professional tools — without the complexity
                or high cost.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                EasyPOS bridges that gap with a mobile-first POS system
                that&apos;s affordable, intuitive, and powerful enough to grow
                with your business.
              </p>
              <div className="mt-8">
                <Button
                  size="lg"
                  className="h-11 rounded-xl px-8 text-sm font-semibold"
                  render={<Link href="/features" />}
                >
                  See What We Built
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Values ── */}
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
              Our Values
            </motion.span>
            <motion.h2
              className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              What we{" "}
              <span className="text-primary">stand for</span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
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
              Join the EasyPOS family
            </motion.h2>
            <motion.p
              className="mt-4 text-base text-white/80"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Be part of a growing community of business owners transforming
              how they run their shops.
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
                render={<Link href="/contact" />}
              >
                Get in Touch
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
