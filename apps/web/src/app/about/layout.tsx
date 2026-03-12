import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About EasyPOS",
  description:
    "Meet Kin Leon Zinzombe — the solo developer who built EasyPOS to give every Zimbabwean business a simple, affordable POS system that requires zero training.",
  keywords: [
    "about EasyPOS",
    "Kin Leon Zinzombe",
    "Zimbabwe POS app developer",
    "EasyPOS story",
    "simple POS Zimbabwe",
    "made in Zimbabwe",
  ],
  openGraph: {
    title: "About EasyPOS | Built by Kin Leon Zinzombe for Zimbabwe",
    description:
      "EasyPOS was created because Zimbabwean businesses deserved a POS that was intentionally simple — no training, no bloat, just tools that work.",
    images: [
      {
        url: "/people/team.jpg",
        alt: "Kin Leon Zinzombe, founder of EasyPOS",
      },
    ],
  },
  twitter: {
    title: "About EasyPOS | Built by Kin Leon Zinzombe for Zimbabwe",
    description:
      "EasyPOS was created because Zimbabwean businesses deserved a POS that was intentionally simple — no training, no bloat, just tools that work.",
    images: ["/people/team.jpg"],
  },
  alternates: {
    canonical: "https://www.myeasypos.com/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
