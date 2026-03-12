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
  { value: "1", label: "Founder (That's Me!)" },
  { value: "∞", label: "Ambition to Simplify" },
  { value: "500+", label: "Zimbabwean Businesses" },
  { value: "0", label: "Training Required" },
];

const values = [
  {
    icon: Heart,
    title: "Built for You, Not Corporate",
    description:
      "I created EasyPOS because I saw Zimbabwean business owners struggling with pen-and-paper bookkeeping or overpriced, over-complicated systems. This is made by someone who gets it.",
  },
  {
    icon: Target,
    title: "Intentionally Simple",
    description:
      "No confusing menus. No 50-page manual. No training courses. If you can tap a button and type a number, you can use EasyPOS. It's that straightforward.",
  },
  {
    icon: Lightbulb,
    title: "Made for Zimbabwe",
    description:
      "Built specifically for Zimbabwean businesses. Local payment methods, ZWL currency support, and prices that make sense for local markets. Made in Zimbabwe, for Zimbabwe.",
  },
  {
    icon: Users,
    title: "All Sizes Welcome",
    description:
      "Whether you're running a small spaza shop, growing boutique, or multi-branch operation, EasyPOS scales with you. No complexity tax.",
  },
  {
    icon: Globe,
    title: "Personal Support",
    description:
      "Not a robot answering your questions. Real support from someone who cares about your success. Get help that actually understands your business.",
  },
  {
    icon: Smartphone,
    title: "Your Pocket, Your Power",
    description:
      "Your phone is powerful enough to run your entire POS. No expensive hardware, no IT setup. Just an app that works, offline or online.",
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
              My Story
            </motion.span>
            <motion.h1
              className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              I'm <span className="text-primary">Kin Leon Zinzombe</span>, and I
              Built EasyPOS For You
            </motion.h1>
            <motion.p
              className="mt-6 text-lg leading-relaxed text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              EasyPOS exists because I got tired of watching Zimbabwean business
              owners struggle with pen-and-paper bookkeeping or systems that
              were intentionally complicated to justify expensive training.
              You shouldn't have to hire a consultant to run your shop.
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
                Why I Built This
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                I wanted to <span className="text-primary">remove barriers</span>,
                not create them
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                I watched too many brilliant business owners—people selling clothes, groceries, electronics, services—get held back by tools that were either non-existent or impossibly complicated.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Some systems were designed to be hard so you&apos;d pay for training. Others required expensive hardware or internet that many Zimbabwean businesses don&apos;t have access to.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground font-semibold text-primary">
                So I decided to build the opposite: a POS system that&apos;s so simple you don&apos;t need training, so affordable you won&apos;t hesitate, and so reliable it works whether you have internet or not.
              </p>
              <div className="mt-8">
                <Button
                  size="lg"
                  className="h-11 rounded-xl px-8 text-sm font-semibold"
                  render={<Link href="/features" />}
                >
                  See How It Works
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
              Core Values
            </motion.span>
            <motion.h2
              className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              What drives <span className="text-primary">every decision</span>
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
              Ready to stop doing things the hard way?
            </motion.h2>
            <motion.p
              className="mt-4 text-base text-white/80"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              3-day free trial. No credit card. No setup hassle. Just download and start selling.
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
                Questions? Let's Talk
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
