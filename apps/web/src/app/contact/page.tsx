"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const downloadUrl =
  process.env.NEXT_PUBLIC_EXPO_PRODUCTION_BUILD_URL ?? "#";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    detail: "support@easypos.co.zw",
    href: "mailto:support@easypos.co.zw",
  },
  {
    icon: Phone,
    title: "Phone",
    detail: "+263 77 000 0000",
    href: "tel:+2637700000000",
  },
  {
    icon: MapPin,
    title: "Location",
    detail: "Harare, Zimbabwe",
    href: "#",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

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
              Get in <span className="text-primary">touch</span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Have a question, feedback, or need help? We&apos;d love to hear
              from you. Our team typically responds within 24 hours.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Contact form + info ───────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
            >
              <motion.h2
                className="text-2xl font-bold text-foreground"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                Send us a message
              </motion.h2>
              <motion.p
                className="mt-2 text-sm text-muted-foreground"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.05 }}
              >
                Fill out the form and we&apos;ll get back to you as soon as
                possible.
              </motion.p>

              {submitted ? (
                <motion.div
                  className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Send className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Message sent!
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Thank you for reaching out. We&apos;ll get back to you
                    within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  className="mt-8 space-y-5"
                  variants={fadeUp}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What is this about?"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more..."
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" size="lg">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </motion.form>
              )}
            </motion.div>

            {/* Contact info + map */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
            >
              <motion.h2
                className="text-2xl font-bold text-foreground"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                Contact information
              </motion.h2>
              <motion.p
                className="mt-2 text-sm text-muted-foreground"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.05 }}
              >
                Reach out through any of these channels.
              </motion.p>

              <motion.div
                className="mt-8 space-y-4"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {contactInfo.map((info) => (
                  <a
                    key={info.title}
                    href={info.href}
                    className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <info.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {info.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {info.detail}
                      </p>
                    </div>
                  </a>
                ))}
              </motion.div>

              {/* Map placeholder */}
              <motion.div
                className="mt-8"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="overflow-hidden rounded-2xl border border-border bg-muted/50">
                  <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                    <div className="text-center">
                      <MapPin className="mx-auto mb-3 h-10 w-10 text-primary/40" />
                      <p className="text-sm font-medium text-muted-foreground">
                        [MAP — Replace with an embedded Google Maps iframe or static map image showing your location]
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
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
              Rather try it yourself?
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Download EasyPOS and explore all features with a free trial.
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
