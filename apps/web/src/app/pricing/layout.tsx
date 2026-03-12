import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for every Zimbabwean business. Start free for 3 days — no credit card required. Choose from Starter, Growth, or Enterprise plans.",
  keywords: [
    "EasyPOS pricing",
    "POS app Zimbabwe price",
    "affordable POS Zimbabwe",
    "EasyPOS plans",
    "small business POS cost",
    "EasyPOS free trial",
    "POS subscription Zimbabwe",
  ],
  openGraph: {
    title: "EasyPOS Pricing | Affordable Plans for Every Zimbabwean Business",
    description:
      "No hidden fees. No training costs. Choose a plan that fits your business and start your 3-day free trial today. Starter, Growth, and Enterprise available.",
    images: [
      {
        url: "/screenshots/dashboard/dashboard-home.jpg",
        alt: "EasyPOS app dashboard",
      },
    ],
  },
  twitter: {
    title: "EasyPOS Pricing | Affordable Plans for Every Zimbabwean Business",
    description:
      "No hidden fees. No training costs. Choose a plan that fits your business and start your 3-day free trial today. Starter, Growth, and Enterprise available.",
    images: ["/screenshots/dashboard/dashboard-home.jpg"],
  },
  alternates: {
    canonical: "https://www.myeasypos.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
