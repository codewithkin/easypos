import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore everything EasyPOS can do — blazing-fast checkout, real-time inventory, sales analytics, team management, multi-branch support, and digital receipts. All in one app.",
  keywords: [
    "EasyPOS features",
    "POS features Zimbabwe",
    "inventory tracking app",
    "sales analytics Zimbabwe",
    "team management POS",
    "digital receipts Zimbabwe",
    "multi-branch POS",
    "mobile point of sale features",
  ],
  openGraph: {
    title: "EasyPOS Features | Everything Your Business Needs in One App",
    description:
      "From blazing-fast checkout to detailed analytics, team roles, and Bluetooth receipt printing — EasyPOS has every tool for a smarter, more profitable Zimbabwean business.",
    images: [
      {
        url: "/screenshots/sales/new-sale-products.jpg",
        alt: "EasyPOS checkout screen showing product grid",
      },
    ],
  },
  twitter: {
    title: "EasyPOS Features | Everything Your Business Needs in One App",
    description:
      "From blazing-fast checkout to detailed analytics, team roles, and Bluetooth receipt printing — EasyPOS has every tool for a smarter, more profitable Zimbabwean business.",
    images: ["/screenshots/sales/new-sale-products.jpg"],
  },
  alternates: {
    canonical: "https://www.myeasypos.com/features",
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
