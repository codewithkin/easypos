import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Kin, the creator of EasyPOS. Ask about features, report a bug, request support, or just say hello. Every message is read personally.",
  keywords: [
    "contact EasyPOS",
    "EasyPOS support",
    "EasyPOS help Zimbabwe",
    "POS support Zimbabwe",
    "EasyPOS feedback",
    "get help EasyPOS",
  ],
  openGraph: {
    title: "Contact EasyPOS | Talk to the Creator Directly",
    description:
      "Have a question about EasyPOS? Need help getting started? Reach out to Kin directly — no ticket queue, no bots. Just real support for your business.",
    images: [
      {
        url: "/screenshots/dashboard/dashboard-home.jpg",
        alt: "EasyPOS dashboard",
      },
    ],
  },
  twitter: {
    title: "Contact EasyPOS | Talk to the Creator Directly",
    description:
      "Have a question about EasyPOS? Need help getting started? Reach out to Kin directly — no ticket queue, no bots. Just real support for your business.",
    images: ["/screenshots/dashboard/dashboard-home.jpg"],
  },
  alternates: {
    canonical: "https://www.myeasypos.com/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
